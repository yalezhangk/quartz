# Quartz 项目协作规范

本文件适用于 `quartz/` 目录。上级 `../AGENTS.md` 继续生效；若有冲突，以本文件中更具体的 Quartz 约定为准。

## 项目定位

Quartz 负责把 `llm-wiki-agent/wiki` 构建为静态网站，并通过本地插件提供知识浏览、知识问答和文档入库界面。它不是文档解析服务，也不负责保存聊天数据。

当前运行架构：

```text
浏览器 -> DGX Nginx :8080
             |- 静态页面 -> quartz/public
             `- /api/* -> 127.0.0.1:8081

ECS Nginx -> ECS 127.0.0.1:18080 -> FRP -> DGX Nginx :8080
```

只有一条 FRP 业务隧道。不得增加或恢复 ECS `18081` 到 `wiki-backend:8081` 的直通配置。

## 必须保持的运行约定

1. Quartz 部署在站点根路径 `/`，不是 `/quartz/`。
2. 局域网与 ECS 公网入口必须使用同一套 `public/` 和相对资源路径。
3. Chats 生产构建必须使用 `CHAT_PROXY_URL=/api`。
4. DGX Nginx 将 `/api/` 转发到 `http://127.0.0.1:8081`；`proxy_pass` 后不加 `/`。
5. `wiki-backend` 不由浏览器直接访问，也不通过第二条 FRP 隧道暴露。
6. `public/` 是生成物，禁止手工修补。
7. 内容源是实际的 `../llm-wiki-agent/wiki`，不要假设仓库内存在可用的 `content/`。
8. `baseUrl` 当前使用 `192.168.8.8:8080`，用于避免把 ECS 公网地址写入构建产物；修改它前必须同时验证局域网、公网、sitemap、RSS 和资源路径。
9. `public/graph` 是由 Wiki 中的 `graph.html` 发射出的无扩展名 HTML；生产 Nginx 必须为 `/graph` 返回 `text/html`，不能让浏览器下载文件。

## 目录职责

- `quartz.config.yaml`：站点和插件配置。
- `.local-plugins/knowledge-ui/src/`：全局应用壳、首页 `/`、知识库 `/library` 与知识质量 `/quality`。
- `.local-plugins/knowledge-ui/dist/`：Knowledge UI 插件运行入口和类型声明；与源码一起由 Git 追踪，源码变化后必须同步更新。
- `.local-plugins/chats/src/`：Chats 插件源码。
- `.local-plugins/chats/dist/`：Chats/Ingest 插件运行入口和类型声明；与源码一起由 Git 追踪，源码变化后必须同步更新。
- `scripts/serve-with-api.mjs`：仅 Windows 本地验证使用的回环静态服务器和同源 `/api` 代理，不参与 DGX 生产服务。
- `quartz.lock.json`：社区插件来源和版本状态。
- `public/`：Quartz 最终静态产物。
- `.quartz/plugins/`、`node_modules/`：本机依赖状态，不作为迁移产物。

## 修改原则

- 只修改任务直接涉及的文件，不顺手重构 Quartz 上游代码。
- 优先在 `.local-plugins/knowledge-ui` 或 `.local-plugins/chats` 内完成本项目定制，避免无必要修改 Quartz 核心。
- `dist/` 是本地插件的实际包入口，不是可忽略的临时目录：提交源码改动时必须一并提交对应的 `dist/`、`package.json` 与 lockfile；绝不提交 `node_modules/` 或 `public/`。
- 不把真实 FRP token、密码、ECS 公网 IP、域名或服务器私有配置提交到仓库。
- 不在文档或默认配置中新增 Windows 绝对路径。
- 所有脚本和文本以 Linux Ubuntu ARM64、LF 换行及 Linux 权限为最终标准。
- 不修改 `llm-wiki-agent` 的代码；业务运行时对其 `wiki/` 的预期写入不等于获得源码修改权限。

## 构建与验证

Node 和 npm 版本必须满足 `package.json`：Node.js `>=22`、npm `>=10.9.2`。

普通内容或 Quartz 配置变化：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

任一本地插件源码变化：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz/.local-plugins/knowledge-ui
npm run build

cd ../chats
npm run build

cd ../..
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

只改其中一个插件时，只构建该插件；修改 `src` 后不得跳过对应 `dist/` 的同步。

验证至少包括：

```bash
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

curl --fail --silent --show-error http://127.0.0.1:8080/ > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/library > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/chats > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/ingest > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/quality > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/graph > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/static/contentIndex.json > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
```

若只是文档修改，可以不执行完整构建，但必须检查 Markdown、命令、路径和当前部署约定是否一致。

## 发布语义

- `ingest` 成功表示文档处理流程完成，并可能更新 `llm-wiki-agent/wiki`。
- Quartz 页面和 `static/contentIndex.json` 只有重新构建 `public/` 后才更新。
- `/quality` 只检查构建期可确认的标题、摘要、标签和更新时间缺口；不得把它扩展为虚假的实时健康分数、断链结论或发布状态。
- 未经明确需求，不要擅自把 ingest、Quartz build、Nginx reload 和 ECS 缓存清理耦合成一个自动流程。
- 如果实现自动发布，必须处理并发构建、失败回滚、旧 `public/` 可用性、Nginx 读取权限和缓存失效。

## Nginx 与缓存边界

- DGX Nginx 从本地磁盘提供 `public/`，无需再配置代理缓存。
- ECS Nginx 可以缓存 Quartz 静态响应以降低 FRP 往返延迟。
- `/api/` 在 ECS 和 DGX 都不得缓存；流式响应需要关闭代理缓冲。
- `static/contentIndex.json` 应使用短 TTL，其他带可靠内容哈希的资源才适合较长缓存。
- 不修改或覆盖 ECS 现有 `/research_report_library/` 等独立路由。

## 问题定位顺序

资源 404：

1. 检查请求路径是否错误包含 `/quartz/`。
2. 检查 `public/` 中实际文件名。
3. 检查本次 Quartz 构建是否成功。
4. 检查 DGX Nginx `root`、`try_files` 和读取权限。
5. 最后检查 ECS 与浏览器缓存。

Chats 失败：

1. 检查构建产物中的 `data-proxy-url` 是否为 `/api`。
2. 检查 DGX Nginx `/api/` 转发。
3. 检查 `wiki-backend` 的 `127.0.0.1:8081`。
4. 检查后端、DGX Nginx、ECS Nginx 日志。

UI 没有反映插件源码变化：

1. 确认变更属于 `knowledge-ui` 还是 `chats`，构建对应 `dist/`。
2. 重建 `public/`。
3. 检查实际服务的产物和缓存。

Graph 下载而不是渲染：

1. 确认 `public/graph` 存在且内容是 HTML。
2. 检查 DGX Nginx 是否为精确路径 `/graph` 设定 `default_type text/html`。
3. 再检查 ECS 代理和浏览器缓存；不要手工改 `public/graph` 或重做 Graph 算法。

## 完成标准

Quartz 变更只有在以下条件满足后才算完成：

- 变更范围与任务一致，未覆盖用户已有修改。
- 必要的 `knowledge-ui`、`chats` 插件构建和 Quartz 构建已完成，且相应 `dist/` 已同步。
- `public/` 不含错误的 `/quartz/` 资源前缀。
- Chats 使用同源 `/api`。
- DGX 根页面、知识库、Chats、Ingest、质量页、Graph、内容索引和 `/api/health` 按任务风险验证通过。
- 局域网与 ECS 入口均按任务风险完成验证。
- 未提交依赖目录、缓存、密钥或服务器私有配置。
