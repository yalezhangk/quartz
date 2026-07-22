# Quartz 知识库前端

本项目基于 Quartz v5，将 `llm-wiki-agent/wiki` 中的 Markdown 构建为静态知识库。`knowledge-ui` 本地插件提供产品级知识浏览界面，`chats` 本地插件通过同源 `/api` 调用 `wiki-backend` 提供知识问答和文档入库。最终运行环境是 NVIDIA DGX Spark（Ubuntu ARM64），Windows 主要用于开发和 Git 管理。

## 项目职责

- 读取 `llm-wiki-agent/wiki` 中的真实知识库内容。
- 生成可由 Nginx 直接提供的 `public/` 静态站点。
- 通过 `.local-plugins/knowledge-ui` 提供唯一主导航、首页 `/`、知识库 `/library` 与知识质量 `/quality`。
- 通过 `.local-plugins/chats` 提供知识问答 `/chats`、文档入库 `/ingest` 和 Synthesis 前端界面。
- 保留 Quartz 原生正文、Search、Explorer、TOC、Backlinks 与 Graph；`/graph` 使用 Wiki 生成的图谱 HTML。
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

cd .local-plugins/knowledge-ui
npm ci
npm run build

cd ../chats
npm ci
npm run build
cd ../..

npx quartz plugin install --clean
npx quartz plugin install --from-config
```

这些命令分别恢复 Quartz、Knowledge UI、Chats 插件依赖与 `dist/`，再恢复社区插件及本地插件链接。两个插件的 `dist/` 是实际包入口，和 `src/` 一起由 Git 追踪；DGX 仍须重新构建以验证 Linux ARM64 环境。不要把 Windows 的 `node_modules/`、`.quartz/plugins/` 或 `public/` 复制到 DGX。

## Windows 本地同源预览

先在一个 PowerShell 窗口启动后端，必须使用后端项目自己的虚拟环境：

```powershell
cd ..\wiki-backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8081
```

再在 Quartz 目录构建并启动带 `/api` 转发的静态预览：

```powershell
$env:CHAT_PROXY_URL="/api"
npx.cmd quartz build -d ..\llm-wiki-agent\wiki
npm.cmd run serve:integrated
```

浏览器打开 `http://127.0.0.1:8080/`。该预览只监听回环地址，并将 `/api/*` 转发到 `127.0.0.1:8081`；它还会为无扩展名的 `/graph` 返回正确的 HTML 类型。如果 `8080` 已占用，可先设置 `$env:QUARTZ_PREVIEW_PORT="8090"`；如后端端口不同，可设置 `$env:QUARTZ_API_TARGET="http://127.0.0.1:<port>"`。这只用于 Windows 验证，不改变生产环境的 Nginx 同源代理。

## 生产构建

正常内容或配置更新：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz

CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

`CHAT_PROXY_URL=/api` 必须保持同源。无论浏览器从局域网还是 ECS 访问，Chats 都先请求当前站点的 `/api/*`，再由 DGX Nginx 转发到 `wiki-backend`。

如果修改了任一本地插件的 `src/`，必须先构建对应插件。两个插件都变更时可按以下顺序执行：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz/.local-plugins/knowledge-ui
npm run build

cd ../chats
npm run build

cd ../..
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

只改其中一个插件时，只构建它即可；提交前必须同步提交该插件的 `src/` 与 `dist/`。

资源链路是：

```text
.local-plugins/knowledge-ui/src 或 .local-plugins/chats/src
  -> 对应目录 npm run build
  -> 对应 dist/
  -> npx quartz build
  -> public/index.html、library.html、chats.html、ingest.html、quality.html、static/*
```

只改 Wiki 内容时不需要重装插件，但仍需重新执行 Quartz 构建。`ingest` 成功只代表文档处理和入库成功，不代表 `public/` 已自动发布。`/quality` 只报告构建期可以确认的元数据缺口，不伪造断链、矛盾或发布结论。

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

    # Wiki 中的 graph.html 被 Quartz 发射为无扩展名的 public/graph。
    location = /graph {
        default_type text/html;
        try_files /graph =404;
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
test -f public/library.html
test -f public/chats.html
test -f public/ingest.html
test -f public/quality.html
test -f public/graph
test -f public/static/contentIndex.json
grep -R '/quartz/' public/index.html public/chats.html public/ingest.html && exit 1 || true
grep -n 'data-proxy-url="/api"' public/chats.html
grep -n 'data-proxy-url="/api"' public/ingest.html
```

再验证 DGX 入口：

```bash
curl --fail --silent --show-error http://127.0.0.1:8080/ > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/library > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/chats > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/ingest > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/quality > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/graph > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/static/contentIndex.json > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
curl --fail --silent --show-error http://127.0.0.1:8080/api/chats > /dev/null
```

最后分别用浏览器验证局域网和 ECS 入口。重点检查首页、知识库筛选、知识正文、Search、Graph、Chats、上传、任务详情和流式回答。

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

先确认变更属于 `.local-plugins/knowledge-ui` 还是 `.local-plugins/chats`，在对应目录执行 `npm run build`，再重建 Quartz，并检查 ECS 缓存与浏览器缓存。

### 点击 Graph 后浏览器下载文件

先确认 `public/graph` 存在且内容是 HTML。由于它没有扩展名，DGX Nginx 必须为精确路径 `/graph` 返回 `text/html`；采用上文 `location = /graph` 配置后重载 Nginx。不要手工改 `public/graph`。

## 仓库边界

下列内容是依赖、缓存或生成状态，不是跨机器同步依据：

- `node_modules/`
- `.local-plugins/knowledge-ui/node_modules/`
- `.local-plugins/chats/node_modules/`
- `.quartz/plugins/`
- `.quartz-cache/`
- `public/`

以下内容是跨机器需要同步和审查的本地插件交付物：

- `.local-plugins/knowledge-ui/src/` 与 `.local-plugins/knowledge-ui/dist/`
- `.local-plugins/chats/src/` 与 `.local-plugins/chats/dist/`
- 两个插件各自的 `package.json`、`package-lock.json` 和构建配置

Windows 修改源码并提交；DGX 拉取后安装依赖、重建插件、构建 `public/` 并验证。所有文本、脚本与配置最终以 Linux Ubuntu ARM64、LF 换行和 Linux 权限语义为准。
