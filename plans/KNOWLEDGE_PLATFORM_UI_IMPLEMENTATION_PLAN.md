# 中压市场部知识库：Quartz 前端实施记录与交接

> 状态：现有 UI 已实施。本文记录 2026-08-10 的代码事实、维护边界和验收基线，不再作为待开发 Phase 清单。
> 产品规格：`../UI_PRODUCT_SPEC.md`  
> 视觉原型：`../design/ui-prototypes/`

## 1. 当前目标与架构

Quartz 继续负责 Markdown 静态发布，不被 React、Next.js 或其他 SPA 替代：

```text
llm-wiki-agent/wiki Markdown
→ Quartz 解析 frontmatter、WikiLink 和 Markdown
→ 生成静态 HTML、contentIndex、Search、Explorer、Graph、Backlinks 和 TOC
→ wiki-backend 发布服务校验 release 并切换 quartz/public
→ DGX Nginx 提供静态页面和同源 /api
```

浏览器不直接访问 `wiki-backend:8081` 或 Ollama `11434`。动态问答、模型档案、Ingest、Synthesis、质量快照和发布状态统一通过同源 `/api`。

## 2. 已实现页面

| 路径        | 代码归属       | 当前数据来源与边界                                     |
| ----------- | -------------- | ------------------------------------------------------ |
| `/`         | `knowledge-ui` | 构建期 `allFiles`；展示真实知识统计和最近更新。        |
| `/library`  | `knowledge-ui` | 构建期知识对象；支持类型筛选、当前结果搜索和排序。     |
| `/chats`    | `chats`        | MySQL 会话/消息、受控模型档案、Wiki 引用和 Synthesis。 |
| `/ingest`   | `chats`        | Ingest 任务、Publication 状态及有权限的手动发布入口。  |
| `/quality`  | `knowledge-ui` | `GET /api/quality/latest` 加构建期 metadata 缺口。     |
| `/settings` | `knowledge-ui` | `GET /api/model-profiles/overview`；只读展示模型边界。 |
| `/graph`    | Wiki 构建产物  | Wiki 的 `graph.html` 被发射为无扩展名 `public/graph`。 |

`AppNavigation` 是唯一产品主导航；Quartz Explorer 只在知识正文中承担二级目录。`.local-plugins/footer` 提供站点页脚。

## 3. 本地插件职责

```text
.local-plugins/knowledge-ui/
  ├─ AppNavigation
  ├─ HomePage / LibraryPage / QualityPage / SettingsPage
  ├─ 构建期知识对象与质量 metadata 适配
  └─ quality 和 settings 浏览器交互

.local-plugins/chats/
  ├─ ChatPage / IngestPage
  ├─ chat、model-profiles、synthesis、ingest、publish API 封装
  ├─ Markdown、WikiLink、引用和回答模型状态
  └─ Ingest 与 Publication 双状态展示

.local-plugins/footer/
  └─ Footer 组件
```

三个插件的 `dist/` 都是 Quartz 实际包入口并由 Git 追踪。修改 `src/` 后必须构建对应 `dist/`；不要提交 `node_modules/`、`.quartz/plugins/`、`.publish/` 或 `public/`。

## 4. 当前 API 契约

| 功能           | 接口                                |
| -------------- | ----------------------------------- |
| 健康检查       | `GET /api/health`                   |
| 回答模型档案   | `GET /api/model-profiles`           |
| 设置页模型概览 | `GET /api/model-profiles/overview`  |
| 会话列表/创建  | `GET/POST /api/chats`               |
| 问答历史/发送  | `GET/POST /api/chats/{id}/messages` |
| 会话重命名     | `PATCH /api/chats/{id}`             |
| 保存 Synthesis | `POST /api/synthesis`               |
| 上传和创建任务 | `POST /api/ingest/jobs`             |
| 最近任务       | `GET /api/ingest/jobs?limit=20`     |
| 任务详情       | `GET /api/ingest/jobs/{job_id}`     |
| 发布状态       | `GET /api/publish/status`           |
| 立即发布       | `POST /api/publish/jobs`            |
| 最近质量快照   | `GET /api/quality/latest`           |
| 静态知识索引   | `GET /static/contentIndex.json`     |

Chat 每次发送都提交服务端白名单中的 `model_profile_id`。浏览器不能提交 provider、模型名、`api_base`、凭据或任意 LiteLLM 参数。当前 Chat 接口返回普通 JSON，不是流式响应。

`/api/publish/*` 会启动 Quartz 构建，`/api/maintenance/*` 会创建维护任务并可能写报告或调用 LLM。两类路径必须在 DGX 与 ECS 入口使用 HTTPS、认证、限流且不缓存；质量页当前不会调用 maintenance 写接口。

## 5. 发布语义

```text
Ingest 或 Synthesis 成功
→ wiki-backend 记录待发布变更
→ 默认静默合并 120 秒，连续变更最长等待 600 秒
→ 复制 llm-wiki-agent/wiki 快照
→ CHAT_PROXY_URL=/api 构建到 .publish/releases/<job-id>
→ 校验关键页面、/quartz/ 前缀和 data-proxy-url
→ 原子切换 public 符号链接
```

Ingest 的 `succeeded` 与 Publication 的 `published` 是两个状态。发布失败时上一版 `public` 继续可用；`POST /api/publish/jobs` 可提前执行当前批次或重建当前 Wiki。切换符号链接不需要 reload DGX Nginx，ECS 静态缓存仍按 TTL 到期或由受控运维清理。

## 6. 必须保持的边界

- 内容源是 `../llm-wiki-agent/wiki`，DGX 构建使用显式 `-d <wiki-path>`。
- 不复制 Markdown 正文到 MySQL 或前端数据仓库。
- 不手工修改 `public/`，不把 Windows 生成状态复制到 DGX。
- 生产 `CHAT_PROXY_URL` 必须是 `/api`，站点部署在根路径 `/`。
- 不增加第二条 FRP 隧道，不让浏览器直连后端或 Ollama。
- 不修改 `llm-wiki-agent` 源码；后端业务流程对其 Wiki 数据的预期写入除外。
- `/quality` 对缺失、过期、解析失败和 partial 报告明确降级，不把旧报告伪装成当前结论。
- `/settings` 是只读概览，不提供模型、Prompt、用户或权限写操作。

仓库内 `docs/` 是 Quartz v5 上游通用文档；其中默认 `content/` 和通用托管示例不覆盖本项目的外部 Wiki 内容源与 DGX/ECS 部署约定。

## 7. 构建与验证

Windows 开发环境优先使用 `npm.cmd` / `npx.cmd`：

```powershell
cd .local-plugins\knowledge-ui
npm.cmd test
npm.cmd run build

cd ..\chats
npm.cmd run build

cd ..\footer
npm.cmd run build

cd ..\..
npm.cmd test
npm.cmd run check
$env:CHAT_PROXY_URL="/api"
npx.cmd quartz build -d ..\llm-wiki-agent\wiki
```

只修改一个插件时只构建对应插件。DGX 最终构建：

```bash
CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

产物至少检查：

```bash
test -f public/index.html
test -f public/library.html
test -f public/chats.html
test -f public/ingest.html
test -f public/quality.html
test -f public/settings.html
test -f public/graph
test -f public/static/contentIndex.json
grep -R '/quartz/' public/index.html public/chats.html public/ingest.html && exit 1 || true
grep -n 'data-proxy-url="/api"' public/chats.html
grep -n 'data-proxy-url="/api"' public/ingest.html
```

浏览器验收覆盖唯一主导航、知识筛选、Chat 模型选择、消息与引用、Synthesis、Ingest/Publication 双状态、质量快照降级、只读设置页和 Graph HTML 类型。

## 8. 当前明确未实现

- `/quality` 的“运行新一轮检查”不会创建 `/api/maintenance/workflows/quality`；它只说明需要管理授权。
- `/settings` 不允许修改模型、Prompt、默认配置、用户或权限。
- Chat 不提供 token 流式输出，也不显示或持久化模型原始 reasoning。
- 前端不负责自动清理 ECS 缓存，也不把 Ingest、发布、Nginx reload 和缓存清理合成单一事务。
