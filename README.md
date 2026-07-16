# Quartz 知识库前端

本项目基于 Quartz v5，将 `llm-wiki-agent/wiki` 中的 Markdown 构建为静态知识库，并通过本地 Chats 插件调用 `wiki-backend`。最终运行环境是 NVIDIA DGX Spark（Ubuntu ARM64），Windows 主要用于开发和 Git 管理。

## 项目职责

- 读取 `llm-wiki-agent/wiki` 中的真实知识库内容。
- 生成可由 Nginx 直接提供的 `public/` 静态站点。
- 通过 `.local-plugins/chats` 提供 Chats、ingest 和 synthesis 前端界面。
- 使用同源 `/api` 调用 `wiki-backend`，浏览器不直接访问后端端口。

`public/` 是构建产物，不是内容源，也不要手工修改。文档入库完成后，`llm-wiki-agent/wiki` 会发生变化；当前发布流程仍需要重新构建 Quartz 才能让页面和搜索索引反映最新内容。

## 当前部署拓扑

```text
局域网浏览器
  -> http://192.168.8.8:8080
  -> DGX Nginx
     |- /api/* -> 127.0.0.1:8081 (wiki-backend)
     `- 其他路径 -> quartz/public

公网浏览器
  -> ECS Nginx :8080
  -> ECS 127.0.0.1:18080 (frps)
  -> DGX frpc
  -> DGX 127.0.0.1:8080 (同一个 DGX Nginx)
```

只保留一条业务隧道：ECS `18080` 到 DGX `8080`。不要恢复 ECS `18081` 到 DGX `8081` 的后端直通。

两个入口都从站点根路径 `/` 访问 Quartz，不使用 `/quartz/` 子路径：

- DGX 局域网：`http://192.168.8.8:8080/`
- ECS 公网：`http://<ECS_PUBLIC_HOST>:8080/`

`quartz.config.yaml` 当前使用：

```yaml
configuration:
  baseUrl: "192.168.8.8:8080"
```

这样不会把 ECS 公网地址写入构建产物。`baseUrl` 不是浏览器允许访问的地址白名单，也不妨碍用户从 ECS 入口访问。若以后启用正式域名、HTTPS，或发现 sitemap、RSS、OG URL 必须统一为公网域名，再单独调整它。

## 环境要求

- Node.js `>=22`
- npm `>=10.9.2`
- 最终构建验证环境：DGX Ubuntu ARM64
- 内容目录：`/home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki`
- Quartz 目录：`/home/dgx/Projects/knowledge_base_mkt/quartz`

版本要求以 `package.json` 为准。

## 首次初始化

在 DGX 上执行：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz
npm ci

cd .local-plugins/chats
npm ci
npm run build
cd ../..

npx quartz plugin install --clean
npx quartz plugin install --from-config
```

这些命令分别恢复 Quartz 依赖、Chats 插件依赖与 `dist/`、社区插件及本地插件链接。不要把 Windows 的 `node_modules/`、`.quartz/plugins/` 或 `public/` 复制到 DGX。

## 生产构建

正常内容或配置更新：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz

CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

`CHAT_PROXY_URL=/api` 必须保持同源。无论浏览器从局域网还是 ECS 访问，Chats 都先请求当前站点的 `/api/*`，再由 DGX Nginx 转发到 `wiki-backend`。

如果修改了 `.local-plugins/chats/src/`，必须先构建插件：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz/.local-plugins/chats
npm run build

cd /home/dgx/Projects/knowledge_base_mkt/quartz
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

资源链路是：

```text
.local-plugins/chats/src
  -> npm run build
  -> .local-plugins/chats/dist
  -> npx quartz build
  -> public/chats.html 和 public/static/*
```

只改 Wiki 内容时不需要重装插件，但仍需重新执行 Quartz 构建。`ingest` 成功只代表文档处理和入库成功，不代表 `public/` 已自动发布。

## DGX Nginx

DGX Nginx 是局域网入口，也是 FRP 唯一回源入口：

```nginx
server {
    listen 8080;
    server_name _;

    root /home/dgx/Projects/knowledge_base_mkt/quartz/public;
    index index.html;
    error_page 404 /404.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        client_max_body_size 100m;
        proxy_connect_timeout 10s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;

        proxy_buffering off;
        proxy_cache off;
        add_header X-Accel-Buffering no;
    }

    location / {
        try_files $uri $uri.html $uri/ $uri/index.html =404;
    }
}
```

`proxy_pass` 后面不要加 `/`。后端路由本身带 `/api/`，正确写法会把 `/api/chats` 原样转发为 `/api/chats`。

DGX Nginx 不需要额外配置反向代理缓存：静态文件本来就从 DGX 本地磁盘读取，Linux 页缓存已经能减少磁盘开销。公网延迟优化放在 ECS Nginx，由 ECS 缓存 Quartz 静态响应；`/api/` 在任何一层都不得缓存。

检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

如果 Nginx 无权读取 `public/`，应给实际 worker 用户补充父目录执行权限和文件读取权限，不要使用 `chmod -R 777`。

## ECS 缓存边界

ECS Nginx 继续保留现有 `/research_report_library/` 等本地路由。Quartz 相关请求通过 `127.0.0.1:18080` 回源 DGX，并按以下边界处理：

- `/api/`：不缓存，关闭响应缓冲，支持上传和流式回答。
- `/static/contentIndex.json`：短缓存，例如 1 分钟。
- `/static/`：较长缓存，例如 1 天。
- 其他 Quartz 页面：短缓存，例如 1 分钟。

当前构建文件名可能带内容哈希，但不能假定所有文件都永久不可变。除非确认文件名随内容变化，否则不要统一加 `immutable` 或一年缓存。内容更新后若要立即生效，可清理 ECS 对应缓存，或等待短 TTL 到期。

## 构建后验证

先确认产物：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz

test -f public/index.html
test -f public/chats.html
test -f public/static/contentIndex.json
grep -R '/quartz/' public/index.html public/chats.html && exit 1 || true
grep -n 'data-proxy-url="/api"' public/chats.html
```

再验证 DGX 入口：

```bash
curl --fail --silent --show-error http://127.0.0.1:8080/ > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/chats > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/static/contentIndex.json > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
curl --fail --silent --show-error http://127.0.0.1:8080/api/chats > /dev/null
```

最后分别用浏览器验证局域网和 ECS 入口。重点检查页面、搜索、Chats、上传和流式回答。

## 常见问题

### 请求 `/quartz/static/*` 返回 404

站点实际部署在根路径 `/`，但构建产物仍带 `/quartz/` 前缀。检查 `baseUrl` 是否误写了 `/quartz`，重新构建 `public/`，再清理浏览器和 ECS 缓存。不要通过 Nginx 为错误路径长期增加兼容 alias。

### 页面能打开，但 Chats 调用失败

按顺序检查：

1. `public/chats.html` 中的代理地址是否为 `/api`。
2. DGX Nginx 的 `location /api/` 是否使用 `proxy_pass http://127.0.0.1:8081;`。
3. `curl http://127.0.0.1:8081/api/health` 是否成功。
4. `wiki-backend` 和 Nginx 错误日志是否有异常。

不要把生产构建改回浏览器直连 `http://192.168.8.8:8081/api`。

### ingest 成功但页面没有新文档

确认 `llm-wiki-agent/wiki` 已更新，然后重新构建 Quartz。当前没有把 ingest 完成和 Quartz 发布强绑定为一个自动事务。

### Chats 源码更新但 UI 仍是旧版本

先在 `.local-plugins/chats` 执行 `npm run build`，再重建 Quartz，并检查 ECS 缓存与浏览器缓存。

## 仓库边界

下列内容是依赖、缓存或生成状态，不是跨机器同步依据：

- `node_modules/`
- `.local-plugins/chats/node_modules/`
- `.quartz/plugins/`
- `.quartz-cache/`
- `public/`

Windows 修改源码并提交；DGX 拉取后安装依赖、构建和验证。所有文本、脚本与配置最终以 Linux Ubuntu ARM64、LF 换行和 Linux 权限语义为准。
