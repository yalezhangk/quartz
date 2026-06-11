# Chats Plugin Notes

这个插件为 Quartz 增加了一个独立的 `Chats` 页面，用来调用外部 AI 后端并在前端展示聊天记录。

## 目录重点

- `src/components/ChatPage.tsx`
  `Chats` 页面骨架、左侧历史区、消息区、输入区模板。
- `src/components/scripts/chat.inline.ts`
  核心前端逻辑：
  会话状态、本地存储、调用后端 `/api/query`、Markdown 渲染、wiki-link 解析、Copy 按钮。
- `src/components/styles/chat.scss`
  `Chats` 页专用布局和样式，同时覆盖 Quartz 默认三列布局，让聊天区尽量铺满。
- `src/pageType.ts`
  注册虚拟页 `/chats`，并让它不进入 Explorer。

## 当前实现约定

- 后端接口当前只接了单个问答接口：
  `POST /api/query`
- 当前默认后端地址是硬编码本地地址：
  `http://127.0.0.1:8000`
- `answer` 作为正文 Markdown 渲染。
- `sources` 单独显示为回答底部引用区。
- 左侧聊天历史目前完全保存在浏览器 `localStorage` / `sessionStorage`，没有后端持久化会话。

## 后续维护最需要注意的点

### 1. 后端 URL 目前是写死的

位置：

- `src/components/ChatPage.tsx`
- `src/components/scripts/chat.inline.ts`

如果后续改成：

- 反向代理
- 环境变量
- 多环境配置
- 正式 `wiki-backend` 服务发现

不要只改一处，至少要同时检查页面模板里的 `data-proxy-url` 和脚本里的默认兜底值。

### 2. 聊天历史不是真正后端会话

当前位置：

- `chat.inline.ts` 里的 `CONVERSATIONS_KEY`
- `CURRENT_CHAT_KEY`
- `CHAT_INTENT_KEY`

当前“New Chat”只是前端本地概念。
后端并不知道这些会话 id，也不会存储聊天历史。

如果未来后端提供：

- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/{id}`
- `POST /api/chats/{id}/messages`

那这里应该整体迁移，不建议继续叠加本地临时状态。

### 3. wiki-link 跳转依赖 Quartz 的 content index

当前位置：

- `loadContentIndex()`
- `resolveWikiHref()`

当前做法是读取：

- `/static/contentIndex.json`

然后用宽松匹配把 `[[PIX]]` 这类词映射到真实 slug，如：

- `/entities/PIX`
- `/sources/...`

风险：

- 如果 `content-index` 插件关闭、改路径、改结构，会影响跳转。
- 如果多个页面标题或 basename 重名，可能跳到错误页面。

### 4. Markdown 渲染是轻量自定义实现

当前位置：

- `renderInlineMarkdown()`
- `renderMarkdown()`

当前只覆盖了常用格式：

- 标题
- 列表
- 粗体/斜体
- 行内 code
- 普通链接
- `[[wiki-link]]`

这不是完整 Markdown 解析器。
如果后端后续开始返回更复杂的 Markdown，比如：

- 表格
- fenced code block
- blockquote
- task list
- HTML 片段

需要升级这里，不要默认认为已经完整支持。

### 5. Copy 按钮复制的是 Markdown 原文

当前位置：

- `composeAssistantMarkdown()`
- `bindCopyButton()`

复制逻辑不是从页面 HTML 反推，而是把：

- `answer`
- `sources`

重新拼装成 Markdown。

如果未来调整回答卡片结构或后端字段，需要一起核对：

- 页面显示内容
- 复制出的 Markdown

二者是否仍一致。

### 6. Chats 页面布局有意覆盖 Quartz 默认页面框架

当前位置：

- `src/components/styles/chat.scss`

这个页面不是普通文档页，而是“应用页”。
样式里有针对 `.page:has(.chat-shell)` 的覆盖，用来：

- 去掉右侧栏留白
- 放大聊天区
- 隐藏默认 page header

如果未来 Quartz 升级后布局类名或 frame 行为变化，优先检查这里。

## 修改建议

如果以后要继续开发，建议优先按这个顺序排查：

1. 链接/跳转异常：
   先看 `ChatPage.tsx` 的 `data-chats-path` 和 `chat.inline.ts` 的 `resolveWikiHref()`
2. 请求地址异常：
   先看 `proxyUrl`、`getQueryEndpoint()`
3. 历史会话异常：
   先看 `localStorage/sessionStorage` 相关逻辑
4. Markdown 显示异常：
   先看 `renderMarkdown()`
5. 聊天页变窄或右侧留白：
   先看 `chat.scss` 对 Quartz 页面布局的覆盖
