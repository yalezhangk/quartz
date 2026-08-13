# Quartz 知识库前端

本项目基于 Quartz v5，将同级 `llm-wiki-agent/wiki` 中的 Markdown 构建为静态知识库，并通过同源 `/api` 使用 `wiki-backend` 的问答、模型档案、文档入库、Synthesis、质量快照和发布能力。

## 项目边界

- `.local-plugins/knowledge-ui`：唯一主导航、首页 `/`、知识库 `/library`、知识质量 `/quality` 和只读设置 `/settings`。
- `.local-plugins/chats`：知识问答 `/chats`、回答模型选择、文档入库 `/ingest`、Synthesis 和发布状态。
- `.local-plugins/source-files`：仅发布已发布 Source 页面引用的 manual 原文件；不会把整个 `raw/` 纳入 Quartz 内容输入。
- `.local-plugins/source-reference`：将 `knowledge-ui` 的 Source 原文卡片挂载到知识正文；这是 Quartz 单组件布局约束下的最小适配层。
- `.local-plugins/footer`：站点页脚。
- `llm-wiki-agent/wiki`：唯一知识内容源；Quartz 不保存知识正文。
- `wiki-backend`：保存 Chat、Ingest、Maintenance、Publish 状态，并在业务流程中读写 Wiki 数据。
- `public/`：当前在线构建入口，禁止手工修补，也不提交 Git。

仓库内 `docs/` 是 Quartz v5 上游通用文档。其中默认 `content/`、GitHub Pages 和通用托管示例不适用于本项目；本项目始终使用显式 `-d <llm-wiki-agent/wiki>`。

## 运行架构

```text
浏览器 -> DGX Nginx :8080
             |- 静态页面 -> quartz/public
             `- /api/* -> 127.0.0.1:8081 -> wiki-backend

ECS Nginx -> ECS 127.0.0.1:18080 -> FRP -> DGX Nginx :8080
```

必须保持：

- Quartz 部署在根路径 `/`，不是 `/quartz/`。
- 生产构建使用 `CHAT_PROXY_URL=/api`，浏览器不直连 `8081` 或 Ollama `11434`。
- 只保留 ECS `18080` 到 DGX `8080` 的一条业务隧道，不恢复 `18081` 后端直通。
- DGX Nginx 的 `proxy_pass http://127.0.0.1:8081;` 后不加 `/`，保留后端 `/api/` 前缀。
- `/api/` 不缓存；`/api/publish/` 和 `/api/maintenance/` 还必须使用 HTTPS、认证和限流。
- `public/graph` 是无扩展名 HTML，Nginx 必须让 `/graph` 返回 `text/html`。
- `source_file` 只能引用 `raw/uploads/manual/`；构建时必须通过 `WIKI_SOURCE_ROOT` 指向真实的 `llm-wiki-agent` 根目录。`source_url` 仅作为受限的 HTTP(S) 外链，不生成静态文件。

## 环境要求

- Node.js `>=22`
- npm `>=10.9.2`
- 最终运行环境：DGX Spark Ubuntu ARM64
- Quartz：`/home/dgx/Projects/knowledge_base_mkt/quartz`
- Wiki：`/home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki`

版本要求以 `package.json` 为准。不要把 Windows 的 `node_modules/`、`.quartz/plugins/`、`.publish/` 或 `public/` 复制到 DGX。

## DGX 首次初始化

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz
npm ci

for plugin in knowledge-ui chats source-reference source-files footer; do
  npm --prefix ".local-plugins/$plugin" ci
  npm --prefix ".local-plugins/$plugin" run build
done

npx quartz plugin install --clean
npx quartz plugin install --from-config
```

五个本地插件的 `dist/` 都是 Quartz 实际包入口并由 Git 追踪。只修改一个插件时，只安装和构建该插件即可。

## DGX 打包与发布

### 手工构建

Quartz 配置、插件、部署方式变化，或需要运维重建时执行：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz

WIKI_SOURCE_ROOT=/home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent \
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

修改本地插件源码后，先构建对应插件，再构建 Quartz：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz

npm --prefix .local-plugins/knowledge-ui run build
npm --prefix .local-plugins/chats run build
npm --prefix .local-plugins/source-reference run build
npm --prefix .local-plugins/source-files run build
npm --prefix .local-plugins/footer run build

WIKI_SOURCE_ROOT=/home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent \
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

未修改的插件不需要重复构建。

`source-files` 只复制已发布 `sources/*.md` 中 `source_file: raw/uploads/manual/...` 实际引用的普通文件到 `public/source-files/manual/`。它会拒绝路径穿越、绝对路径、符号链接逃逸、目录和缺失文件；历史 scheduled 的旧平铺 `raw/uploads/...` 不会被发布。自动发布构建的是 Wiki 快照，`wiki-backend` 必须显式传入 `WIKI_SOURCE_ROOT`，不得依赖快照路径推导。

### 自动发布

Ingest 或 Synthesis 成功后，`wiki-backend` 会把知识变更加入 Quartz 发布批次：

```text
Wiki 变更
-> 默认合并等待 120 秒，连续变更最长等待 600 秒
-> 复制 Wiki 快照
-> 构建到 .publish/releases/<job-id>
-> 验证关键页面、/quartz/ 前缀和同源 /api
-> 原子切换 public 符号链接
```

Ingest 的 `succeeded` 只表示知识已写入；只有 `publication.status=published` 才表示静态站已更新。发布失败时上一版站点继续可用。有权限的用户可在 `/ingest` 提前触发 `POST /api/publish/jobs`。

自动发布切换 `public` 后不需要重启或 reload Nginx。ECS 静态缓存仍可能在短 TTL 到期后才显示新内容。

## DGX 启动与重启

Quartz 生产站点是静态文件，没有独立的 Quartz 常驻进程；生产入口是 DGX Nginx，动态 API 和自动发布 worker 位于 `wiki-backend`。

### 启动或重载 Nginx

```bash
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
```

仅修改 `public/` 内容或自动发布成功时不需要 reload。只有 Nginx 配置变化时，先 `nginx -t`，再 `reload`；服务异常且 reload 无法恢复时才使用：

```bash
sudo systemctl restart nginx
```

### 启动或重启 wiki-backend
后端代码、`.env`、模型配置或 systemd 配置变化后：

```bash
sudo systemctl restart wiki-backend.service
sudo systemctl status wiki-backend.service --no-pager
sudo journalctl -u wiki-backend.service -n 100 --no-pager
```

随后验证后端和同源代理：

```bash
curl --fail --silent --show-error http://127.0.0.1:8081/api/health
curl --fail --silent --show-error http://127.0.0.1:8081/api/chats > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
```

`/api/health` 只证明 FastAPI 进程可达；`/api/chats` 才能基本验证 MySQL 路径。模型、Ingest 和 Publish 仍需各自验证。

## 构建后验证

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz

for file in \
  index.html library.html chats.html ingest.html quality.html settings.html graph \
  static/contentIndex.json; do
  test -f "public/$file"
done

grep -R '/quartz/' public/index.html public/chats.html public/ingest.html && exit 1 || true
grep -n 'data-proxy-url="/api"' public/chats.html
grep -n 'data-proxy-url="/api"' public/ingest.html

for path in / /library /chats /ingest /quality /settings /graph /static/contentIndex.json; do
  curl --fail --silent --show-error "http://127.0.0.1:8080$path" > /dev/null
done

curl --fail --silent --show-error http://127.0.0.1:8080/api/model-profiles > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/api/quality/latest > /dev/null
```

带认证检查 `GET /api/publish/status`。只有获得运维授权时才调用手动发布或 Maintenance 写接口。

## Windows 本地同源预览

先用 `wiki-backend` 自己的虚拟环境启动后端：

```powershell
cd ..\wiki-backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8081
```

再回到 Quartz：

```powershell
$env:CHAT_PROXY_URL="/api"
npx.cmd quartz build -d ..\llm-wiki-agent\wiki
npm.cmd run serve:integrated
```

打开 `http://127.0.0.1:8080/`。`serve:integrated` 只监听回环地址，把 `/api/*` 转发到 `QUARTZ_API_TARGET`（默认 `http://127.0.0.1:8081`），并正确处理 `/graph` 的 HTML 类型。

## 常见问题

### 页面或资源 404

依次检查：请求是否错误包含 `/quartz/`、`public/` 中是否存在目标文件、本次构建是否成功、DGX Nginx `root/try_files`、ECS 与浏览器缓存。

### Chats 或设置页 API 失败

检查构建产物中的 `data-proxy-url="/api"`、DGX Nginx `/api/` 转发、`127.0.0.1:8081/api/health`、后端/Nginx 日志。不要把生产构建改成浏览器直连 `8081`。

### Ingest 成功但页面没有新文档

确认 Wiki 已更新，再检查任务的 `publication`、`GET /api/publish/status` 和发布日志。不要把 Ingest 的 `succeeded` 当作静态站已经发布。

### 插件源码更新但 UI 仍是旧版本

构建对应 `.local-plugins/*/dist`，再构建 Quartz，并检查实际服务的 `public/`、ECS 缓存和浏览器缓存。

### Graph 被下载

确认 `public/graph` 是 HTML，并为 Nginx 精确路径 `/graph` 配置 `default_type text/html`。不要手工修改生成物。

## Git 与生成物

需要同步和审查：本地插件 `src/`、`dist/`、`package.json`、lockfile、Quartz 配置、脚本和文档。

不要提交：`node_modules/`、`.quartz/plugins/`、`.quartz-cache/`、`.publish/`、`public/`、`.env`、密码、Token、证书私钥或服务器私有配置。
