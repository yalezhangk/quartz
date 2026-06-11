# 在 Quartz 添加 Chats 功能

## TL;DR
> **Summary**: 在 Quartz 静态网站中添加一个完整的 AI 聊天功能。左侧栏新增「Chats」区域（含聊天历史列表 + New Chat 按钮），点击后 `/chats/` 页面渲染完整聊天界面，所有数据通过后端代理 API 获取。
> **Deliverables**: 1 个本地插件（`.local-plugins/chats/`）+ 1 个配置项修改
> **Effort**: Medium
> **Parallel**: NO — 严格串行，后一步依赖前一步
> **Critical Path**: 插件骨架 → pageType → Sidebar → ChatPage → inline script → styles → config → build

## Context
### Original Request
在 Quartz 左侧栏新增「Chats」栏目，功能类似 AI 聊天工具：
- 侧栏显示聊天历史列表、New Chat 按钮
- 点击后进入独立聊天页面，支持对话
- 数据不存 localStorage，全部通过后端代理 API 获取

### Interview Summary
- 后端代理服务独立部署，Quartz 只负责调 API
- 聊天历史、聊天内容均由后端代理 API 返回
- 聊天界面使用「独立页面模式」— 在 `/chats/` 路径下渲染
- 用户选择「自建后端代理」方案

## Work Objectives
### Core Objective
在 Quartz 中建立一个完整可用的 AI 聊天子应用，包含侧栏入口和独立聊天页面。

### Deliverables
- `.local-plugins/chats/` — 完整的本地插件，含 7 个源码文件
- `quartz.config.yaml` — 1 处新增插件声明

### Definition of Done
- `npx quartz build --serve` 编译无错误
- 访问 `/chats/` 页面正常渲染聊天界面骨架（消息区域 + 输入框）
- 侧栏显示 "Chats" 标题和 "New Chat" 按钮
- 侧栏聊天历史从 API 获取并展示 mock 数据
- "New Chat" 按钮能导航到 `/chats/` 页面并渲染新对话

### Must Have
- 侧栏 ChatsSidebar 组件（历史列表 + New Chat 按钮）
- 聊天页面 ChatPage 组件（消息列表 + 输入框 + 发送按钮）
- 后端代理 API 调用能力（fetch + streaming）
- `/chats/` URL 路由（通过 pageType 实现）

### Must NOT Have
- 不修改 Quartz core 代码（`quartz/` 目录下的文件）
- 不依赖任何外部 npm 包（用原生 `fetch` 即可）
- 不在 localStorage 存储聊天数据

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- **Test decision**: No unit tests (plugin is UI-heavy, no business logic)
- **QA policy**: Build verification + smoke test via `--serve`
- **Evidence**: Console output + page content inspection via LSP

## Execution Strategy

### Dependency Chain
```
Task 1 (skeleton)
  └─→ Task 2 (pageType) ──→ Task 4 (ChatPage — needs body component)
  └─→ Task 3 (sidebar) ──→ Task 5 (inline script — needs both)
  └─→ Task 6 (styles)
  └─→ Task 7 (config)
  └─→ Task 8 (build)
```

### Wave Plan
```
Wave 1: [Task 1] — 创建目录和基础配置文件
Wave 2: [Task 2, Task 3] — 页面类型 + 侧栏组件（独立并行）
Wave 3: [Task 4] — 聊天页面组件
Wave 4: [Task 5] — 核心客户端逻辑（依赖 T2+T3+T4）
Wave 5: [Task 6, Task 7] — 样式 + 配置（可并行）
Wave 6: [Task 8] — 构建验证
```

## TODOs

### 插件架构概览

```
.local-plugins/chats/                    # 本地插件根目录
├── package.json                          # 插件元数据
├── tsup.config.ts                        # 构建配置
├── src/
│   ├── index.ts                          # 插件导出
│   ├── pageType.ts                       # PageTypePlugin：匹配 /chats/ 路由
│   ├── types.ts                          # 类型定义
│   ├── i18n/
│   │   └── index.ts                      # 国际化文本
│   └── components/
│       ├── index.ts                      # 组件导出
│       ├── ChatsSidebar.tsx              # Preact: 侧栏组件
│       ├── ChatPage.tsx                  # Preact: 聊天页面主体
│       ├── scripts/
│       │   └── chat.inline.ts            # 客户端核心逻辑（API 调用、DOM 操作）
│       └── styles/
│           └── chat.scss                 # 所有聊天相关样式
```

---

- [ ] **1. 创建插件骨架**

  **What to do**:
  1. 创建目录结构：`mkdir -p .local-plugins/chats/src/{components/{scripts,styles},i18n}`
  2. 创建 `package.json`：
     ```json
     {
       "name": "@local/chats",
       "version": "0.1.0",
       "type": "module",
       "main": "./dist/index.js",
       "types": "./dist/index.d.ts",
       "exports": {
         ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
         "./components": { "types": "./dist/components/index.d.ts", "import": "./dist/components/index.js" }
       },
       "scripts": { "build": "tsup" },
       "peerDependencies": {
         "preact": "^10.28.2",
         "@quartz-community/types": "github:quartz-community/types",
         "@quartz-community/utils": "github:quartz-community/utils"
       },
       "quartz": {
         "name": "chats",
         "displayName": "Chats",
         "category": ["component", "pageType"],
         "version": "1.0.0",
         "quartzVersion": ">=5.0.0",
         "defaultOrder": 30,
         "defaultEnabled": true,
         "defaultOptions": {
           "proxyUrl": "/api/chat",
           "title": "Chats"
         },
         "components": {
           "ChatsSidebar": { "displayName": "Chats Sidebar", "defaultPosition": "left", "defaultPriority": 40 },
           "ChatPage": { "displayName": "Chat Page" }
         }
       }
     }
     ```
  3. 创建 `tsup.config.ts` — 参考 `.quartz/plugins/search/tsup.config.ts` 配置，输出格式 esm，target es2022。

  **Recommend Agent Profile**:
  - Category: `quick` — 纯文件创建
  - Skills: `[]`
  - Omitted: N/A

  **Parallelization**: Wave 1 | Blocks: all

  **Acceptance Criteria**:
  - [ ] `.local-plugins/chats/package.json` 存在且格式正确
  - [ ] `.local-plugins/chats/tsup.config.ts` 存在
  - [ ] 目录结构完整

  **Commit**: YES | Message: `feat(chats): add local plugin skeleton`

---

- [ ] **2. 实现页面类型插件 (pageType.ts)**

  **What to do**:
  创建 `.local-plugins/chats/src/pageType.ts`，实现 QuartzPageTypePlugin：

  ```typescript
  // 核心逻辑
  import { QuartzPageTypePlugin } from "@quartz-community/types"
  import ChatPageBody from "./components/ChatPage"

  export const ChatPageType: QuartzPageTypePlugin = (opts) => ({
    name: "ChatPageType",
    priority: 10,
    match({ slug }) {
      // 匹配 /chats/ 开头的所有路径
      return slug === "chats" || slug.startsWith("chats/")
    },
    generate({ content, cfg }) {
      // 只生成一个虚拟页面 /chats/
      // 其余子路径 (/chats/new, /chats/:id) 由客户端 JS 处理
      return [{
        slug: "chats",
        title: opts?.title ?? "Chats",
        data: {},
      }]
    },
    layout: "default",      // 使用三栏布局（侧栏可见）
    body: ChatPageBody,
  })
  ```

  **关键设计说明**：
  - `match` 匹配 `/chats` 和 `/chats/*` 路径
  - `generate` 只返回一个虚拟页面（slug: `chats`）
  - 子路由（new, :id）由 inline script 在客户端处理
  - layout 用 `"default"` 而非 `"full-width"`，保留侧栏中的 ChatsSidebar 组件

  **Recommend Agent Profile**:
  - Category: `unspecified-low` — 单一文件，模式清晰
  - Skills: `[]`
  - Omitted: N/A

  **Reference**:
  - Pattern: `.quartz/plugins/tag-page/src/pageType.ts` — 虚拟页面生成 + match 逻辑
  - Type: `.quartz/plugins/search/src/components/Search.tsx` — SearchOptions 模式

  **Parallelization**: Wave 2 | Blocked By: Task 1

  **Acceptance Criteria**:
  - [ ] pageType.ts 编译通过（tsup --noEmit）

  **Commit**: YES | Message: `feat(chats): add page type plugin`

---

- [ ] **3. 实现侧栏组件 (ChatsSidebar.tsx)**

  **What to do**:
  创建 `.local-plugins/chats/src/components/ChatsSidebar.tsx`：

  **Preact 组件结构**：
  ```tsx
  <div class="chats-sidebar">
    <div class="chats-header">
      <h2>Chats</h2>
      <button class="new-chat-button">+ New Chat</button>
    </div>
    <div class="chats-history" id="chats-history-list">
      {/* 由 inline script 动态填充 */}
    </div>
    <template id="template-chat-item">
      <a class="chat-history-item" href="#">
        <span class="chat-title"></span>
        <span class="chat-preview"></span>
        <span class="chat-time"></span>
      </a>
    </template>
  </div>
  ```

  **组件 Props**：
  - `proxyUrl`: string — 后端代理地址
  - `title`: string — 侧栏标题（默认 "Chats"）

  **数据流设计**：
  Preact 只负责初始渲染结构（标题 + 按钮 + 容器 + template）。运行时数据填充和事件绑定全部在 `chat.inline.ts` 中通过 DOM API 完成。

  这是因为：
  - 聊天历史是动态的（每次页面加载从 API 获取）
  - 需要遵循 Quartz 社区插件模式（如 Explorer）
  - Preact 渲染的只是"骨骼"，inline script 负责"血肉"

  **ChatsSidebar.tsx 代码要点**：

  ```typescript
  export interface ChatsSidebarOptions {
    proxyUrl: string
    title: string
  }

  const defaultOptions: ChatsSidebarOptions = {
    proxyUrl: "/api",
    title: "Chats",
  }

  export default ((userOpts?: Partial<ChatsSidebarOptions>) => {
    const opts = { ...defaultOptions, ...userOpts }
    
    const ChatsSidebar: QuartzComponent = (props) => {
      const displayClass = props.displayClass
      return (
        <div class={classNames(displayClass, "chats-sidebar")} data-proxy-url={opts.proxyUrl}>
          <div class="chats-header">
            <h2>{opts.title}</h2>
            <button type="button" class="new-chat-button" data-new-chat>
              <svg>...</svg>
              New Chat
            </button>
          </div>
          <div class="chats-history" id="chats-history-list"></div>
          <template id="template-chat-item">
            <a class="chat-history-item" href="#" data-chat-id="">
              <div class="chat-item-title"></div>
              <div class="chat-item-preview"></div>
            </a>
          </template>
        </div>
      )
    }

    ChatsSidebar.css = style
    ChatsSidebar.afterDOMLoaded = script
    return ChatsSidebar
  }) satisfies QuartzComponentConstructor
  ```

  **Recommend Agent Profile**:
  - Category: `visual-engineering` — 需要 Preact 组件 UI
  - Skills: `[]`
  - Omitted: N/A (no external skills needed)

  **Reference**:
  - Pattern: `.quartz/plugins/explorer/src/components/Explorer.tsx` — template + inline script + data attributes
  - Test: N/A

  **Parallelization**: Wave 2 | Blocked By: Task 1

  **Acceptance Criteria**:
  - [ ] Preact 组件编译通过
  - [ ] 组件将 proxyUrl 通过 data-proxy-url 传递到 DOM

  **Commit**: YES | Message: `feat(chats): add sidebar component`

---

- [ ] **4. 实现聊天页面组件 (ChatPage.tsx)**

  **What to do**:
  创建 `.local-plugins/chats/src/components/ChatPage.tsx`，作为 `/chats/` 页面的 Body 组件。

  **UI 结构（从上到下）**：
  ```
  ┌─ /chats/ 页面 ────────────────────┐
  │                                    │
  │  ┌─ 消息列表区域 ───────────────┐   │
  │  │  [消息气泡]                  │   │
  │  │  [消息气泡]                  │   │
  │  │  [消息气泡]                  │   │
  │  │  ── 加载更多 / 底部 ──      │   │
  │  └──────────────────────────────┘   │
  │                                    │
  │  ┌─ 底部输入区域 ───────────────┐   │
  │  │  [文本输入框]    [发送按钮]   │   │
  │  └──────────────────────────────┘   │
  │                                    │
  └────────────────────────────────────-┘
  ```

  **组件代码要点**：
  ```tsx
  <div class="chat-page" data-proxy-url={proxyUrl}>
    <div class="chat-messages" id="chat-messages">
      {/* 由 inline script 动态渲染 */}
    </div>
    <div class="chat-input-area">
      <textarea class="chat-input" placeholder="输入消息..." rows="1"></textarea>
      <button class="chat-send-button" disabled>
        <svg>发送图标</svg>
      </button>
    </div>
    {/* 消息气泡模版 */}
    <template id="template-message-user">
      <div class="message message-user">
        <div class="message-content"></div>
      </div>
    </template>
    <template id="template-message-assistant">
      <div class="message message-assistant">
        <div class="message-avatar"><svg>AI 图标</svg></div>
        <div class="message-content"></div>
        <div class="message-loading">正在输入...</div>
      </div>
    </template>
  </div>
  ```

  **Recommend Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `[]`

  **Reference**:
  - Pattern: `.quartz/plugins/explorer/src/components/Explorer.tsx` — template 模式
  - Pattern: `.quartz/plugins/search/src/components/Search.tsx` — data attribute 传参

  **Parallelization**: Wave 3 | Blocked By: Task 2

  **Acceptance Criteria**:
  - [ ] ChatPage.tsx 编译通过
  - [ ] 聊天界面有消息容器、输入框、发送按钮

  **Commit**: YES | Message: `feat(chats): add chat page body component`

---

- [ ] **5. 实现核心客户端逻辑 (chat.inline.ts)**

  **What to do**:
  这是整个功能最核心的文件。创建 `.local-plugins/chats/src/components/scripts/chat.inline.ts`，负责所有客户端运行时行为。

  **功能清单**：

  ```
  chat.inline.ts
  ├─ 1. 数据获取
  │   ├─ fetchConversations()      — GET /api/chats — 获取聊天列表
  │   └─ fetchConversation(id)     — GET /api/chats/:id — 获取单条对话
  │
  ├─ 2. 侧栏管理 (renders in sidebar)
  │   ├─ renderChatHistory()       — 渲染历史列表到侧栏
  │   └─ attachSidebarEvents()     — 绑定 New Chat + 历史点击事件
  │
  ├─ 3. 聊天页面管理 (renders in chat page)
  │   ├─ renderMessages(msgs)      — 渲染消息到聊天区域
  │   ├─ appendMessage(msg)        — 追加单条消息
  │   ├─ scrollToBottom()          — 滚动到底部
  │   └─ showLoading() / hideLoading()
  │
  ├─ 4. 消息发送
  │   ├─ sendMessage(text, convId) — POST /api/chats/:id/messages
  │   ├─ handleStream(response)    — 流式读取 SSE 响应
  │   └─ handleSendClick()         — 点击发送/Enter 事件
  │
  ├─ 5. 导航与状态管理
  │   ├─ handleNav()               — 监听 nav 事件
  │   ├─ getChatMode()             — 判断当前处于什么模式
  │   │   ├─ "hub"                 — 显示聊天列表
  │   │   ├─ "new"                 — 新对话
  │   │   └─ "chat"                — 已有对话
  │   └─ updateUrl(mode, id)      — 用 history.replaceState 更新 URL
  │
  └─ 6. 初始化与清理
      ├─ setup()                   — 入口函数（监听 nav + render）
      └─ cleanup()                 — 清理事件监听
  ```

  **核心逻辑流程**：

  ```
  setup() 监听 "nav" 事件
       ↓
  handleNav() 触发：
       ↓
  1. 清理旧的事件监听（cleanup）
  2. 检查当前页面是否有 chat 组件
  3. 如果有侧栏（.chats-sidebar）
     → fetchConversations() → renderChatHistory() → attachSidebarEvents()
  4. 如果有聊天页面（.chat-page）
     → getChatMode():
       ├─ "hub"   → fetchConversations() → 渲染对话列表页
       ├─ "new"   → 显示空对话（输入框 + "开始新对话" 提示）
       └─ "chat"  → fetchConversation(id) → renderMessages()
     → 绑定输入框事件
  ```

  **状态管理方案**：
  - 不依赖 React/Vue 状态管理
  - 使用 `sessionStorage` 作为侧栏 → 页面的通信渠道
  - 会话 ID 通过 URL 路径传递 (`/chats/abc123` → 提取 `abc123`)
  - 状态在事件回调中用闭包维护

  **API 调用方案**：

  ```typescript
  async function sendMessage(text: string, conversationId?: string): Promise<void> {
    const proxyUrl = getProxyUrl()  // 从 data 属性读取
    const response = await fetch(`${proxyUrl}/chats/${conversationId ?? ""}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    })

    // 流式读取
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""  // 保留最后一个不完整行
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6))
          appendToLastMessage(data.content)  // 追加到正在渲染的消息
        }
      }
    }
  }
  ```

  **导航流程**：

  ```
  用户点击 "New Chat"
       ↓
  sessionStorage.setItem("chats:intent", "new")
  window.spaNavigate("/chats/")
       ↓
  SPA 路由器加载 /chats/ 页面
       ↓
  页面 inline script 读取 sessionStorage
       ↓
  渲染空对话 → history.replaceState(null, "", "/chats/new")


  用户点击历史对话
       ↓
  sessionStorage.setItem("chats:intent", JSON.stringify({mode:"chat", id:"abc123"}))
  window.spaNavigate("/chats/")
       ↓
  页面 inline script 读取 sessionStorage
       ↓
  fetchConversation("abc123") → renderMessages() → history.replaceState(null, "", "/chats/abc123")
  ```

  **Recommend Agent Profile**:
  - Category: `ultrabrain` — 最复杂的逻辑，需要流式处理、状态管理、事件协调
  - Skills: `[]`

  **Reference**:
  - Pattern: `.quartz/plugins/search/src/components/scripts/search.inline.ts` — nav 事件监听、cleanup 模式、DOM 操作
  - Pattern: `.quartz/plugins/explorer/src/components/scripts/explorer.inline.ts` — data 属性读取、localStorage 使用

  **Parallelization**: Wave 4 | Blocked By: Task 3, Task 4

  **Acceptance Criteria**:
  - [ ] 脚本可以读取 data-proxy-url 等配置属性
  - [ ] nav 事件触发时正确初始化
  - [ ] 发送消息时调用了 fetch API
  - [ ] 流式响应被正确解析和渲染

  **Commit**: YES | Message: `feat(chats): add core client-side chat logic`

---

- [ ] **6. 实现聊天样式 (chat.scss)**

  **What to do**:
  创建 `.local-plugins/chats/src/components/styles/chat.scss`。

  **需要覆盖的样式模块**：

  | 模块 | 说明 | 关键 CSS |
  |------|------|---------|
  | `.chats-sidebar` | 侧栏容器 | 固定宽度，与 Explorer 一致 |
  | `.chats-header` | 标题 + New Chat 按钮 | flex 布局，下边框 |
  | `.new-chat-button` | 新建按钮 | 带 `+` 图标，hover 效果 |
  | `.chats-history` | 历史列表滚动区 | max-height, overflow-y |
  | `.chat-history-item` | 单条历史记录 | hover 高亮，点击态 |
  | `.chat-page` | 聊天页面容器 | flex column, full height |
  | `.chat-messages` | 消息列表 | flex-grow: 1, overflow-y: auto |
  | `.message` | 消息气泡基类 | max-width: 80%, margin |
  | `.message-user` | 用户消息 | 右对齐，secondary 背景色 |
  | `.message-assistant` | AI 消息 | 左对齐，默认背景色 |
  | `.message-content` | 消息文本 | 行内格式支持 |
  | `.message-avatar` | AI 头像 | 圆形图标 |
  | `.message-loading` | 加载动画 | 闪烁/旋转 |
  | `.chat-input-area` | 底部输入区 | sticky bottom, border-top |
  | `.chat-input` | 文本输入框 | auto-resize, 圆角 |
  | `.chat-send-button` | 发送按钮 | 禁用态（空输入）vs 激活态 |

  **关键样式约束**：
  ```scss
  // 侧栏与其他组件对齐
  .chats-sidebar {
    min-width: fit-content;
    max-width: 14rem;
    padding: 0.5rem 0;
  }

  // 聊天页面占满内容区
  .chat-page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 8rem); // 减去 header + footer
  }

  // 消息气泡
  .message {
    max-width: 80%;
    margin: 0.5rem 1rem;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    line-height: 1.6;
    word-wrap: break-word;

    &.message-user {
      align-self: flex-end;
      background: var(--secondary);
      color: var(--light);
    }

    &.message-assistant {
      align-self: flex-start;
      background: var(--lightgray);
      color: var(--dark);
    }
  }

  // 消息列表
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
  }

  // 输入区固定在底部
  .chat-input-area {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--lightgray);
    background: var(--light);
  }
  ```

  **Recommend Agent Profile**:
  - Category: `visual-engineering` — 纯样式
  - Skills: `[]`

  **Reference**:
  - Style: `quartz/styles/variables.scss` — CSS 变量引用模式
  - Style: `.quartz/plugins/search/src/components/styles/search.scss` — 全屏弹窗样式模式

  **Parallelization**: Wave 5 | Blocked By: Task 3, Task 4

  **Acceptance Criteria**:
  - [ ] 所有 chat- 相关 class 有样式定义
  - [ ] 使用 `var(--dark)`, `var(--lightgray)` 等 Quartz 主题变量
  - [ ] 侧栏和页面布局兼容移动端

  **Commit**: YES | Message: `feat(chats): add chat styles`

---

- [ ] **7. 插件导出 + 配置注册**

  **What to do**:

  **7a. 创建导出文件 `src/index.ts`**：
  ```typescript
  export { ChatPageType } from "./pageType"
  export { default as ChatsSidebar } from "./components/ChatsSidebar"
  export { default as ChatPage } from "./components/ChatPage"
  export type { ChatsSidebarOptions } from "./components/ChatsSidebar"
  ```

  **7b. 创建 `src/components/index.ts`**：
  ```typescript
  export { default as ChatsSidebar } from "./ChatsSidebar"
  export { default as ChatPage } from "./ChatPage"
  ```

  **7c. 创建 `src/i18n/index.ts`** — 国际化文本占位：
  ```typescript
  // 目前只支持 en-US
  const localeStrings = {
    "en-US": {
      components: {
        chats: {
          title: "Chats",
          newChat: "New Chat",
          placeholder: "Type a message...",
          send: "Send",
        },
      },
    },
  }

  export function i18n(locale: string) {
    return localeStrings[locale] ?? localeStrings["en-US"]
  }
  ```

  **7d. 修改 `quartz.config.yaml`**，在 `layout: byPageType` 中添加 chats 页面类型配置：

  ```yaml
  # 在 plugins 列表末尾添加
  - source: .local-plugins/chats
    enabled: true
    options:
      proxyUrl: /api
      title: Chats
    layout:
      position: left
      priority: 40
      group: toolbar

  # 在 layout.byPageType 中添加 chats 页面的布局覆盖
  layout:
    groups:
      toolbar:
        priority: 35
        direction: row
        gap: 0.5rem
    byPageType:
      "404":
        positions:
          beforeBody: []
          left: []
          right: []
      content: {}
      folder:
        exclude:
          - reader-mode
        positions:
          right: []
      tag:
        exclude:
          - reader-mode
        positions:
          right: []
      canvas: {}
      bases: {}
      # ↓ 新增：chats 页面使用全宽布局（隐藏侧栏和不必要的组件）
      chats:
        template: full-width
        exclude:
          - reader-mode
          - table-of-contents
  ```

  **Recommend Agent Profile**:
  - Category: `quick` — 多个小文件导出 + YAML 编辑
  - Skills: `[]`

  **Reference**:
  - Pattern: `.quartz/plugins/search/src/index.ts` — export 模式
  - Pattern: `quartz.config.yaml` 已有内容 — layout.byPageType 部分

  **Parallelization**: Wave 5 | Blocked By: Task 2, Task 3, Task 4

  **Acceptance Criteria**:
  - [ ] `src/index.ts` 导出所有必要类型
  - [ ] `quartz.config.yaml` 格式正确（YAML lint 通过）
  - [ ] `npx tsc --noEmit` 无错误

  **Commit**: YES | Message: `feat(chats): add plugin exports and config registration`

---

- [ ] **8. 构建验证**

  **What to do**:
  1. 安装插件依赖：
     ```bash
     cd .local-plugins/chats && npm install && npm run build
     ```
  2. 验证 Quartz 编译：
     ```bash
     cd [project root] && npx tsc --noEmit
     ```
  3. 构建并启动：
     ```bash
     npx quartz build --serve
     ```
  4. 检查：
     - 控制台无编译错误
     - 访问 http://localhost:8080/ 页面正常
     - 访问 http://localhost:8080/chats/ 显示聊天页面骨架
     - 侧栏显示 "Chats" 区域
  5. 若后端代理未部署，API 调用会失败但不影响 UI 渲染

  **Recommend Agent Profile**:
  - Category: `quick` — 运行命令 + 检查结果
  - Skills: `[]`

  **Parallelization**: Wave 6 | Blocked By: Task 7

  **Acceptance Criteria**:
  - [ ] `npm run build` 在插件目录成功
  - [ ] 项目根目录 `npx tsc --noEmit` 无类型错误
  - [ ] `npx quartz build --serve` 成功启动
  - [ ] 浏览器访问 `/chats/` 显示完整聊天界面骨架

  **Commit**: NO (已包含在其他任务中)

## 关键设计决策总结

| 决策 | 选择 | 理由 |
|------|------|-------|
| URL 架构 | 单页 `/chats/` + 客户端路由 | 动态对话无法预生成页面，用 `history.replaceState` 管理子路由 |
| 侧栏 → 页面通信 | `sessionStorage` | 原生 API，SPA 导航后不丢失，无需额外依赖 |
| 聊天渲染方式 | Inline script DOM 操作 | 符合 Quartz 社区插件模式，性能更好，状态生命周期可控 |
| 数据获取 | `fetch` + ReadableStream | 原生支持，零依赖，SSE 流式兼容 |
| 页面布局 | `full-width` frame | 聊天界面需要最大宽度，不需要侧栏（侧栏已显示 chats 入口） |
| 插件类型 | 本地插件（路径引用） | 独立于社区插件，不被 `npx quartz plugin update` 覆盖 |

## API 接口协议（与后端代理约定）

Quartz 前端期望后端代理提供以下 REST 接口：

```yaml
GET  /api/chats                    → Conversation[]    # 获取全部对话列表
POST /api/chats                    → { id: string }    # 新建对话（可选）
GET  /api/chats/:id                → Conversation      # 获取单条对话及消息
POST /api/chats/:id/messages       → SSE Stream        # 发送消息（流式返回）
DELETE /api/chats/:id              → void              # 删除对话
```

**Conversation 数据模型**：
```json
{
  "id": "conv_abc123",
  "title": "关于JavaScript...",
  "lastMessage": "JavaScript 是一种...",
  "updatedAt": "2026-06-10T12:00:00Z",
  "messageCount": 5
}
```

**SSE 流式消息格式**：
```
event: message
data: {"content": "你好", "type": "text"}

event: message
data: {"content": "！有什么可以帮你的？", "type": "text"}

event: done
data: {"id": "msg_xyz", "usage": {...}}
```

## 后端代理注意事项

- 本项目不开发后端代理，只预留 `/api/` 路径的调用
- 开发测试时可以先 mock API 响应，确保 UI 正常工作
- 建议后端代理使用 Cloudflare Workers 或 Vercel Edge Functions
- API 路径通过 `quartz.config.yaml` 的 `proxyUrl` 配置，可灵活修改
