# Quartz v5

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/



# MKT Sample Quartz 运行手册

本仓库是基于 Quartz v5 的知识库前端，运行目标是 DGX Spark / Linux ARM64。Windows 侧主要用于代码编辑和提交；DGX 侧负责安装依赖、恢复插件状态、读取真实 wiki 内容目录并启动服务。

本文只记录当前项目的运行和维护流程，不覆盖 Quartz 官方教程或云托管流程。

## 开发/预览启动方式

在 DGX 上进入 Quartz 仓库根目录后，可按下面的方式启动 Quartz 自带的本地预览服务：

```bash
CHAT_PROXY_URL=http://192.168.8.8:8081/api npx quartz build --serve \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki \
  --port 8080 \
  --wsPort 3001
```

关键约定：

- `CHAT_PROXY_URL=http://192.168.8.8:8081/api`：让 Chats 插件直接通过 `http://192.168.8.8:8081/api` 访问 `wiki-backend`。
- `-d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki`：显式指定真实 wiki 内容目录；DGX 仓库内不依赖 `content/`。
- `--port 8080`：Quartz HTTP 页面服务端口。
- `--wsPort 3001`：Quartz 热更新 WebSocket 端口。
- `build --serve` 会先生成当前站点输出，再启动本地预览服务并监听内容变化。

`build --serve` 适合开发、调试和临时预览，不是推荐的生产环境长期服务方式。生产环境建议只用 Quartz 生成 `public/`，再由 Nginx 服务静态文件并反向代理后端 API。

如果 `8080` 或 `3001` 已被占用，先停止旧 Quartz 进程，或者显式换端口。

## `public/` 目录是什么

`public/` 是 Quartz 的构建产物目录。Quartz 会把 `llm-wiki-agent/wiki` 中的 Markdown、图片和资源处理成浏览器可直接访问的静态网站文件，例如：

- `index.html`、`chats.html`：最终页面。
- `*.css`、`*.js`：页面样式和交互脚本。
- `static/contentIndex.json`：搜索、索引等功能使用的数据。
- 图片、RSS、站点图和其他静态资源。

`public/` 不是源码目录，不要手工修改。它可以删除后重新生成，正确来源是：

```bash
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

生产环境中，Nginx 读取的就是这个 `public/` 目录。

## 项目事实

- Node.js 版本要求来自 `package.json`：`node >=22`，`npm >=10.9.2`。
- 主配置文件是 `quartz.config.yaml`。
- Chats 插件来源是 `./.local-plugins/chats`。
- Chats 后端地址由 `quartz.config.yaml` 中的 `${CHAT_PROXY_URL:-/api}` 注入；生产构建时应显式使用 `CHAT_PROXY_URL=/api`，开发/预览模式如果绕过 Nginx 直接访问后端，应使用 `CHAT_PROXY_URL=http://192.168.8.8:8081/api`。
- `quartz.lock.json` 记录社区插件来源和提交，DGX 初始化时按它恢复插件状态。
- `public/`、`.quartz/plugins/`、`node_modules/`、`.local-plugins/chats/node_modules/` 都是 DGX 本机生成状态，不应从 Windows 复制过去。
- `.local-plugins/chats/dist/` 是当前本地插件的导出产物，已纳入仓库契约；改 Chats 源码后需要同步更新它。

## DGX 首次初始化

新 clone、清理过依赖，或换到一台新的 DGX 主机后执行：

```bash
npm ci

cd .local-plugins/chats
npm ci
npm run build
cd ../..

npx quartz plugin install --clean
npx quartz plugin install --from-config
```

然后按“开发/预览启动方式”临时预览，或按“生产环境：Nginx 托管 `public/`”启动长期服务。

命令边界：

- `npm ci` 安装 Quartz 主项目依赖。
- `.local-plugins/chats/npm ci` 安装 Chats 插件自己的构建依赖。
- `.local-plugins/chats/npm run build` 生成 `dist/`，Quartz 运行时优先加载这里的入口。
- `npx quartz plugin install --clean` 按 `quartz.lock.json` 恢复社区插件。
- `npx quartz plugin install --from-config` 按 `quartz.config.yaml` 链接本地插件。

## 日常更新流程

只更新 wiki 内容时，不需要重新安装插件。确认 `llm-wiki-agent/wiki` 已经是最新内容后，重新构建 `public/` 即可。

只更新 Quartz 配置、主题、布局或核心代码时，开发/预览模式可执行：

```bash
git pull
CHAT_PROXY_URL=http://192.168.8.8:8081/api npx quartz build --serve \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki \
  --port 8080 \
  --wsPort 3001
```

生产环境应执行：

```bash
git pull
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

更新 Chats 插件源码时，先刷新插件产物，再重新构建 Quartz：

```bash
git pull

cd .local-plugins/chats
npm run build
cd ../..

CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

原因是 Chats 页面不会直接加载 `.local-plugins/chats/src/`，Quartz 使用的是 `.local-plugins/chats/dist/` 和最终生成的 `public/chats.html`。

## 生产环境：Nginx 托管 `public/`

生产环境推荐让长期运行的进程只包括 Nginx 和 `wiki-backend`。Quartz 只负责构建静态文件，不使用 `build --serve` 长期驻留。

### 1. 构建静态站点

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz

CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

如果本次改动包含 Chats 插件源码，先构建插件：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz/.local-plugins/chats
npm run build

cd /home/dgx/Projects/knowledge_base_mkt/quartz
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

### 2. 给 Nginx 访问权限

如果 Nginx 直接读取 `/home/dgx/Projects/knowledge_base_mkt/quartz/public`，需要让 Nginx worker 用户能进入父目录并读取 `public/`。先确认 Nginx 用户：

```bash
ps -o user,group,comm -C nginx
grep -n '^user' /etc/nginx/nginx.conf
```

Ubuntu 常见用户是 `www-data`。如果实际用户不同，把下面命令中的 `www-data` 替换成真实用户：

```bash
sudo setfacl -m u:www-data:x /home/dgx
sudo setfacl -m u:www-data:x /home/dgx/Projects
sudo setfacl -m u:www-data:x /home/dgx/Projects/knowledge_base_mkt
sudo setfacl -m u:www-data:x /home/dgx/Projects/knowledge_base_mkt/quartz

sudo find /home/dgx/Projects/knowledge_base_mkt/quartz/public -type d -exec setfacl -m u:www-data:rx {} \;
sudo find /home/dgx/Projects/knowledge_base_mkt/quartz/public -type f -exec setfacl -m u:www-data:r {} \;
```

不要把目录改成 `777`，也不建议让 Nginx 以 `dgx` 用户运行。

每次重新构建 `public/` 后，如果 Nginx 又出现 `Permission denied`，重新执行：

```bash
sudo find /home/dgx/Projects/knowledge_base_mkt/quartz/public -type d -exec setfacl -m u:www-data:rx {} \;
sudo find /home/dgx/Projects/knowledge_base_mkt/quartz/public -type f -exec setfacl -m u:www-data:r {} \;
```

### 3. Nginx 配置

本项目后端真实接口路径本身带 `/api/`，例如：

```bash
curl -i "http://192.168.8.8:8081/api/ingest/jobs?limit=20"
```

因此 Nginx 反代时不要剥掉 `/api/` 前缀，`proxy_pass` 后面不要带结尾斜杠：

```nginx
server {
    listen 8080;
    server_name _;

    root /home/dgx/Projects/knowledge_base_mkt/quartz/public;
    index index.html;
    error_page 404 /404.html;

    location /api/ {
        proxy_pass http://192.168.8.8:8081;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        client_max_body_size 100m;
    }

    location / {
        try_files $uri $uri.html $uri/ $uri/index.html =404;
    }
}
```

配置检查和重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 生产更新命令

普通 wiki 内容、Quartz 配置或主题更新：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz
git pull

CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki

sudo find public -type d -exec setfacl -m u:www-data:rx {} \;
sudo find public -type f -exec setfacl -m u:www-data:r {} \;

sudo nginx -t
sudo systemctl reload nginx
```

Chats 插件源码更新：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz
git pull

cd .local-plugins/chats
npm run build
cd ../..

CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki

sudo find public -type d -exec setfacl -m u:www-data:rx {} \;
sudo find public -type f -exec setfacl -m u:www-data:r {} \;

sudo nginx -t
sudo systemctl reload nginx
```

### 5. 生产验证

```bash
curl --fail --silent --show-error http://127.0.0.1:8080/
curl --fail --silent --show-error http://127.0.0.1:8080/chats
curl --fail --silent --show-error http://127.0.0.1:8080/static/contentIndex.json
curl --fail --silent --show-error "http://127.0.0.1:8080/api/ingest/jobs?limit=20"
```

如果 `/`、`/chats`、`/static/contentIndex.json` 正常但 `/api/ingest/jobs` 返回 404，优先检查 Nginx 的 `location /api/` 和 `proxy_pass` 写法。对本项目，正确写法是：

```nginx
proxy_pass http://192.168.8.8:8081;
```

不是：

```nginx
proxy_pass http://192.168.8.8:8081/;
```

## 什么时候重新安装插件

平时改 wiki 内容、Quartz 配置或 Chats 源码，不需要反复执行插件安装命令。只有以下情况才需要重新安装插件：

- 新 clone 到 DGX 后首次初始化。
- 删除过 `.quartz/plugins/`。
- 修改了 `quartz.config.yaml` 中的插件列表或插件来源。
- 修改了 `quartz.lock.json`。
- 新增、删除、改名 `.local-plugins/*` 插件。

对应命令：

```bash
npx quartz plugin install --clean
npx quartz plugin install --from-config
```

## 后端与页面检查

开发/预览模式启动后先检查 Quartz 页面：

```bash
curl --fail --silent --show-error http://127.0.0.1:8080/
curl --fail --silent --show-error http://127.0.0.1:8080/chats
curl --fail --silent --show-error http://127.0.0.1:8080/static/contentIndex.json
```

再检查 `http://192.168.8.8:8081` 后端API是否可用。生产环境下浏览器会访问 Nginx 的 `/api/...`，Nginx 再原样转发到 `wiki-backend` 的 `/api/...`。Chats 插件会访问这些后端路径：

- `GET http://192.168.8.8:8081/api/chats`
- `POST http://192.168.8.8:8081/api/chats`
- `GET http://192.168.8.8:8081/api/chats/{chat_id}/messages`
- `POST http://192.168.8.8:8081/api/chats/{chat_id}/messages`
- `PATCH http://192.168.8.8:8081/api/chats/{chat_id}`
- `POST http://192.168.8.8:8081/api/synthesis`
- `GET http://192.168.8.8:8081/api/ingest/jobs`
- `POST http://192.168.8.8:8081/api/ingest/jobs`

如果页面能打开但 Chats 功能失败，优先检查 `http://192.168.8.8:8081` 后端API和 `wiki-backend`，不要先改 Quartz 插件源码。

## 仓库清洁边界

这些目录是本机状态或生成物，不作为迁移依据：

- `node_modules/`
- `.local-plugins/chats/node_modules/`
- `public/`
- `.quartz/plugins/`
- `.quartz-cache/`
- `content`
- `.agents/`
- `.codex/`
- `.sisyphus/`
- `*.log`

迁移到 DGX 时不要复制 Windows 的这些目录。正确做法是提交源码、锁文件和必要的插件 `dist/`，然后在 DGX 上用 `npm ci`、插件安装命令和当前启动命令重新生成运行状态。

## 常见定位顺序

Chats UI 不是最新：

1. 确认 `.local-plugins/chats/src/**` 的改动已经提交或同步到 DGX。
2. 在 `.local-plugins/chats` 执行 `npm run build`。
3. 回到 Quartz 根目录重新执行当前启动命令。
4. 检查 `public/chats.html` 和其引用的 `public/static/scripts/*` 是否已更新。

页面正常但聊天接口失败：

1. 生产构建时检查 `CHAT_PROXY_URL` 是否为 `/api`。
2. 检查 Nginx 是否把 `/api/` 原样反代到 `http://192.168.8.8:8081/api/`。
3. 通过浏览器实际访问入口请求 `<site-origin>/api/chats`，或直接请求 `http://192.168.8.8:8081/api/chats`。
4. 再看 `wiki-backend` 日志。

DGX 迁移验证不要只看 Windows 构建结果。最终停止条件应是 DGX 本机完成依赖安装、插件恢复、站点构建、Nginx 重载，并且 `/`、`/chats`、`/static/contentIndex.json`、`/api/ingest/jobs?limit=20` 都能按预期返回。
