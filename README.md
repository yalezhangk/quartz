# Quartz v5

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/



# MKT Sample Quartz 运行手册

本仓库是基于 Quartz v5 的知识库前端，运行目标是 DGX Spark / Linux ARM64。Windows 侧主要用于代码编辑和提交；DGX 侧负责安装依赖、恢复插件状态、读取真实 wiki 内容目录并启动服务。

本文只记录当前项目的运行和维护流程，不覆盖 Quartz 官方教程、静态托管流程或单独生成 `public/` 的纯构建流程。

## 当前启动方式

在 DGX 上进入 Quartz 仓库根目录后，服务按下面的方式启动：

```bash
CHAT_PROXY_URL=http://192.168.8.8:8081 npx quartz build --serve \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki \
  --port 8080 \
  --wsPort 3001
```

关键约定：

- `CHAT_PROXY_URL=http://192.168.8.8:8081`：让 Chats 插件通过API `http://192.168.8.8:8081` 访问 `wiki-backend`。
- `-d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki`：显式指定真实 wiki 内容目录；DGX 仓库内不依赖 `content/`。
- `--port 8080`：Quartz HTTP 页面服务端口。
- `--wsPort 3001`：Quartz 热更新 WebSocket 端口。
- `build --serve` 会先生成当前站点输出，再启动本地预览服务并监听内容变化。

如果 `8080` 或 `3001` 已被占用，先停止旧 Quartz 进程，或者显式换端口。

## 项目事实

- Node.js 版本要求来自 `package.json`：`node >=22`，`npm >=10.9.2`。
- 主配置文件是 `quartz.config.yaml`。
- Chats 插件来源是 `./.local-plugins/chats`。
- Chats 后端地址由 `quartz.config.yaml` 中的 `${CHAT_PROXY_URL:-http://192.168.8.8:8081}` 注入；没有设置环境变量时默认回退到 `http://192.168.8.8:8081`。
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

然后使用“当前启动方式”里的命令启动服务。

命令边界：

- `npm ci` 安装 Quartz 主项目依赖。
- `.local-plugins/chats/npm ci` 安装 Chats 插件自己的构建依赖。
- `.local-plugins/chats/npm run build` 生成 `dist/`，Quartz 运行时优先加载这里的入口。
- `npx quartz plugin install --clean` 按 `quartz.lock.json` 恢复社区插件。
- `npx quartz plugin install --from-config` 按 `quartz.config.yaml` 链接本地插件。

## 日常更新流程

只更新 wiki 内容时，不需要重新安装插件。确认 `llm-wiki-agent/wiki` 已经是最新内容后，重新执行当前启动命令即可。

只更新 Quartz 配置、主题、布局或核心代码时：

```bash
git pull
CHAT_PROXY_URL=http://192.168.8.8:8081 npx quartz build --serve \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki \
  --port 8080 \
  --wsPort 3001
```

更新 Chats 插件源码时，先刷新插件产物，再启动 Quartz：

```bash
git pull

cd .local-plugins/chats
npm run build
cd ../..

CHAT_PROXY_URL=http://192.168.8.8:8081 npx quartz build --serve \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki \
  --port 8080 \
  --wsPort 3001
```

原因是 Chats 页面不会直接加载 `.local-plugins/chats/src/`，Quartz 使用的是 `.local-plugins/chats/dist/` 和最终生成的 `public/chats.html`。

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

启动后先检查 Quartz 页面：

```bash
curl --fail --silent --show-error http://127.0.0.1:8080/
curl --fail --silent --show-error http://127.0.0.1:8080/chats
curl --fail --silent --show-error http://127.0.0.1:8080/static/contentIndex.json
```

再检查 `http://192.168.8.8:8081` 后端API是否可用。Chats 插件会访问这些后端路径：

- `GET http://192.168.8.8:8081/chats`
- `POST http://192.168.8.8:8081/chats`
- `GET http://192.168.8.8:8081/chats/{chat_id}/messages`
- `POST http://192.168.8.8:8081/chats/{chat_id}/messages`
- `PATCH http://192.168.8.8:8081/chats/{chat_id}`
- `POST http://192.168.8.8:8081/synthesis`
- `GET http://192.168.8.8:8081/ingest/jobs`
- `POST http://192.168.8.8:8081/ingest/jobs`

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

1. 检查 `CHAT_PROXY_URL` 是否为 `http://192.168.8.8:8081`。
2. 检查 Quartz 前面是否有反代把 `http://192.168.8.8:8081` 转到 `wiki-backend`。
3. 通过浏览器实际访问入口请求 `<site-origin>http://192.168.8.8:8081/chats`，或直接请求反代后的真实后端地址。
4. 再看 `wiki-backend` 日志。

DGX 迁移验证不要只看 Windows 构建结果。最终停止条件应是 DGX 本机完成依赖安装、插件恢复、服务启动，并且 `/`、`/chats`、`/static/contentIndex.json`、`http://192.168.8.8:8081/chats` 都能按预期返回。
