# Quartz v5

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/

[Join the Discord Community](https://discord.gg/cRFFHYye7t)

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/jackyzha0">
    <img src="https://cdn.jsdelivr.net/gh/jackyzha0/jackyzha0/sponsorkit/sponsors.svg" />
  </a>
</p>

## 运行
```bash
npx quartz build --serve
```

## Chats Backend Config

使用 `CHAT_PROXY_URL` 控制 chats 插件的后端基础地址。

- 本地开发：设置为 `http://127.0.0.1:8081`
- 线上部署：不设置，默认回退到 `/api`

Git Bash 示例：

```bash
export CHAT_PROXY_URL="http://127.0.0.1:8081"
npx quartz build --serve
```

如果未来本地后端端口或地址变更，只需要修改 `CHAT_PROXY_URL`，不要再改 chats 插件源码或 `proxyUrl` 默认值。

## DGX Spark 插件开发与启动流程

本仓库在 Windows 上修改代码，通过 Git 同步到 DGX Spark。DGX Spark 上不要复用 Windows 的
`node_modules/`、`public/`、`content` symlink 或 `.quartz/plugins/` 缓存；这些都应该在
DGX 上重新生成。

以下示例假设：

- Quartz 仓库路径：`/home/xxx/quartz`
- wiki 内容仓库路径：`/home/xxx/llm-wiki-agent/wiki`
- Quartz 页面端口：`8080`
- Quartz 热更新 WebSocket 端口：`3001`
- 后端 API 通过同源反代暴露为：`/api`

### 首次在 DGX 初始化

新 clone 或清理过依赖后执行：

```bash
cd /home/xxx/quartz
git pull
npm ci

cd .local-plugins/chats
npm ci
npm run build
cd ../..

npx quartz plugin install --clean
npx quartz plugin install --from-config
```

命令说明：

- `npm ci`：按 `package-lock.json` 精确安装依赖，适合部署和验证环境。
- `.local-plugins/chats/npm ci`：安装 Chats 插件自己的构建依赖。
- `.local-plugins/chats/npm run build`：把 Chats 插件源码编译到 `dist/`。
- `npx quartz plugin install --clean`：按 `quartz.lock.json` 恢复社区插件。
- `npx quartz plugin install --from-config`：按 `quartz.config.yaml` 链接本地插件，例如 `chats`。

### 修改 Chats 插件后刷新 UI

如果只改了 `.local-plugins/chats/src/**`、样式或 Chats 插件配置，执行：

```bash
cd /home/xxx/quartz
git pull

cd .local-plugins/chats
npm run build
cd ../..

CHAT_PROXY_URL=/api npx quartz build --serve \
  -d /home/xxx/llm-wiki-agent/wiki \
  --port 8080 \
  --wsPort 3001
```

注意：Chats 页面不会直接加载 `src/`，Quartz 使用的是 `.local-plugins/chats/dist/`。所以改
Chats 源码后必须先执行 `npm run build`，再重新执行 Quartz build/serve，浏览器 UI 才会是最新版本。

如果 8080 已经有旧服务在运行，先停止旧进程，再执行上面的 `build --serve` 命令。

### 修改其他本地插件后刷新 UI

未来如果新增了其他本地插件，例如 `.local-plugins/example`，流程和 Chats 一样：

```bash
cd /home/xxx/quartz/.local-plugins/example
npm ci
npm run build

cd /home/xxx/quartz
npx quartz plugin install --from-config

CHAT_PROXY_URL=/api npx quartz build --serve \
  -d /home/xxx/llm-wiki-agent/wiki \
  --port 8080 \
  --wsPort 3001
```

如果只是改已有本地插件源码，通常只需要该插件的 `npm run build`，然后重新跑 Quartz
`build --serve`。只有新增、删除、改名插件，或者修改 `quartz.config.yaml` 的插件来源时，才需要再跑
`npx quartz plugin install --from-config`。

### 什么时候需要重新安装插件

平时改 Chats 源码不需要反复安装插件。只有下面几种情况需要：

- 新 clone 到 DGX 后首次初始化。
- 删除过 `.quartz/plugins/`。
- 修改了 `quartz.config.yaml` 中的插件列表或插件来源。
- 修改了 `quartz.lock.json`。
- 新增、删除、改名 `.local-plugins/*` 插件。

### 只构建不启动服务

如果只想生成 `public/`，不启动 8080 服务：

```bash
cd /home/xxx/quartz
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/xxx/llm-wiki-agent/wiki
```

生成后检查关键文件：

```bash
test -s public/index.html
test -s public/chats.html
test -s public/static/contentIndex.json
```
