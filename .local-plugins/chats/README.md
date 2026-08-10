# Chats Plugin Notes

这个插件为 Quartz 增加独立的 `/chats` 与 `/ingest` 页面，并接入 `wiki-backend` 的聊天、模型档案、Synthesis、文档入库和 Quartz 发布 API。

## 目录重点

- `src/api/chatApi.ts`：集中处理 Chat API URL、请求和错误信息。
- `src/components/ChatPage.tsx`：问答历史、知识回答、引用来源和输入区模板。
- `src/components/scripts/chat.inline.ts`：会话交互、回答模型选择、消息渲染、引用映射、wiki-link、Copy 和 Synthesis 状态。
- `src/components/styles/chat.scss`：Chats 页面布局和样式。
- `src/types.ts`：Quartz 当前消费的 `wiki-backend` 响应类型。
- `src/components/IngestPage.tsx`：文档提交、任务台账、任务检验单和发布说明模板。
- `src/components/scripts/ingest.inline.ts`：文件上传、任务列表、详情请求、发布状态与进行中任务轮询。
- `src/pageType.ts`：注册虚拟页 `/chats`、`/ingest`，并让它们不进入 Explorer。

## 后端约定

后端基础地址由 `proxyUrl` 配置。生产和集成预览都使用同源 `/api`：

```powershell
$env:CHAT_PROXY_URL="/api"
npx.cmd quartz build -d ..\llm-wiki-agent\wiki
npm.cmd run serve:integrated
```

`serve:integrated` 将 `/api/*` 转发到 `QUARTZ_API_TARGET`，默认目标为 `http://127.0.0.1:8081`。只有使用 Quartz 自带 `--serve` 且明确接受跨源开发请求时，才把 `CHAT_PROXY_URL` 设为完整后端地址；生产构建不得这样做。

任务详情轮询间隔由 Quartz 的 Chats 插件 `ingestPollIntervalMs` 配置，单位为毫秒，当前值为 `30000`。该值同时适用于 `/chats` 和 `/ingest` 中处于 `queued` 或 `running` 状态的任务。

`chatApi.ts` 支持以下基础地址：

- `http://127.0.0.1:8081` -> `http://127.0.0.1:8081/api/chats`
- `/api` -> `/api/chats`

Chats 页面使用以下接口：

- `GET /api/model-profiles`
- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/{chat_id}/messages`
- `POST /api/chats/{chat_id}/messages`
- `PATCH /api/chats/{chat_id}`

页面不再调用无状态的 `POST /api/query`。

每次发送都提交服务端白名单中的 `model_profile_id`。浏览器只保存档案 ID，不接收 provider、模型服务地址、凭据或任意 LiteLLM 参数；助手消息按后端返回的档案标签显示，原始 reasoning 不展示也不保存。

文档入库页面复用以下接口：

- `POST /api/ingest/jobs`
- `GET /api/ingest/jobs?limit=20`
- `GET /api/ingest/jobs/{job_id}`
- `GET /api/publish/status`
- `POST /api/publish/jobs`

页面只显示 `queued`、`running`、`succeeded`、`failed` 四种 Ingest 状态，不推算处理百分比。`succeeded` 只表示知识文件已经写入；后端随后把变更加入 Quartz 发布批次，并通过独立的 `publication.status` 表示 `pending`、`running`、`published` 或 `failed`。页面可以读取发布状态，并在有权限时提前触发当前批次或重建当前 Wiki。

## 状态与持久化

- 会话列表和消息以 `wiki-backend` 的 MySQL 数据为准。
- 页面刷新后重新请求后端，不使用 `localStorage` 保存会话或消息。
- `sessionStorage` 保存当前选中的服务端 `chat_id`、回答模型档案、SPA 跳转意图和页面重载期间的待发送消息；会话与消息正文仍以 MySQL 为准。
- 点击“发起问答”只清空当前页面；首次发送时才创建后端问答会话。
- 发送成功后使用服务端返回的会话和消息更新页面。
- 发送失败时移除临时消息、显示错误并恢复输入内容。

## 前端渲染约定

- `assistant_message.content` 作为 Markdown 正文渲染。
- 回答正文继续按 `content` 的 Markdown 渲染；右侧“引用来源”使用 `sources` 和 `relevant_pages`。
- 引用来源通过 `/static/contentIndex.json` 映射真实标题、知识类型和 Quartz 页面链接；当前接口没有片段和相关度时不伪造这些字段。
- Copy 按钮直接复制 `content` 的 Markdown 原文，不额外追加来源。
- wiki-link 通过 `/static/contentIndex.json` 映射到 Quartz 页面。
- Synthesis 保存继续只提交助手消息 ID，刷新后根据 `synthesis_path` 恢复状态。

## 验证

```powershell
cd .local-plugins\chats
npm.cmd run build

cd ..\..
npm.cmd run check
```
