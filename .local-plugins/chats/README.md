# Chats Plugin Notes

这个插件为 Quartz 增加独立的 `/chats` 与 `/ingest` 页面，并接入 `wiki-backend` 的聊天和文档入库 API。

## 目录重点

- `src/api/chatApi.ts`：集中处理 Chat API URL、请求和错误信息。
- `src/components/ChatPage.tsx`：问答历史、知识回答、引用来源和输入区模板。
- `src/components/scripts/chat.inline.ts`：会话交互、消息渲染、引用映射、wiki-link、Copy 和 Synthesis 状态。
- `src/components/styles/chat.scss`：Chats 页面布局和样式。
- `src/types.ts`：与 `wiki-backend` 响应一致的前端类型。
- `src/components/IngestPage.tsx`：文档提交、任务台账、任务检验单和发布说明模板。
- `src/components/scripts/ingest.inline.ts`：文件上传、任务列表、详情请求与进行中任务轮询。
- `src/pageType.ts`：注册虚拟页 `/chats`、`/ingest`，并让它们不进入 Explorer。

## 后端约定

后端基础地址由 `proxyUrl` 配置，本地开发通过 `CHAT_PROXY_URL` 注入：

```powershell
$env:CHAT_PROXY_URL="http://127.0.0.1:8081"
```

`chatApi.ts` 支持以下基础地址：

- `http://127.0.0.1:8081` -> `http://127.0.0.1:8081/api/chats`
- `/api` -> `/api/chats`

Chats 页面使用以下接口：

- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/{chat_id}/messages`
- `POST /api/chats/{chat_id}/messages`
- `PATCH /api/chats/{chat_id}`

页面不再调用无状态的 `POST /api/query`。

文档入库页面复用以下接口：

- `POST /api/ingest/jobs`
- `GET /api/ingest/jobs?limit=20`
- `GET /api/ingest/jobs/{job_id}`

页面只显示 `queued`、`running`、`succeeded`、`failed` 四种后端状态，不推算处理百分比。`succeeded` 表示知识文件已经写入，但仍需单独执行 Quartz build 才会更新静态页面。

## 状态与持久化

- 会话列表和消息以 `wiki-backend` 的 MySQL 数据为准。
- 页面刷新后重新请求后端，不使用 `localStorage` 保存会话或消息。
- `sessionStorage` 只保存当前选中的服务端 `chat_id` 和 SPA 跳转意图。
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
cd C:\job_docs\knowledge_base\mvc_sample\quartz\.local-plugins\chats
npm.cmd run build

cd C:\job_docs\knowledge_base\mvc_sample\quartz
npm.cmd run check
```
