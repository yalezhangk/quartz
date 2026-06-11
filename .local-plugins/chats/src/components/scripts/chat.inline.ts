// @ts-nocheck - Inline script runs in browser context

interface Conversation {
  id: string
  title: string
  lastMessage?: string
  updatedAt: string
  messageCount: number
  messages: Message[]
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  sources?: string[]
}

interface ChatConfig {
  proxyUrl: string
}

interface StoredChatIntent {
  mode?: "chat"
  id?: string
}

interface QueryResponse {
  answer?: string
  sources?: string[]
}

const CONVERSATIONS_KEY = "chats:conversations"
const CURRENT_CHAT_KEY = "chats:current"
const CHAT_INTENT_KEY = "chats:intent"
// NOTE: contentIndex 只用于把回答里的 [[wiki-link]] 解析成 Quartz 站内真实 slug。
// 如果未来站点索引输出路径或字段结构变化，这里会是优先排查点。
let contentIndexPromise: Promise<Record<string, any> | null> | null = null

function getChatConfig(el: HTMLElement): ChatConfig {
  return {
    // NOTE: 这里仍然保留了本地后端地址的硬编码兜底。
    // 当前 chats 插件依赖外部 wiki-backend 的 /api/query。
    // 若后续改成由 Quartz 反代、环境变量注入或运行时配置，这里必须同步调整。
    proxyUrl: el.getAttribute("data-proxy-url") || "http://127.0.0.1:8000",
  }
}

function readStoredIntent(remove: boolean): string | StoredChatIntent | null {
  const storedIntent = sessionStorage.getItem(CHAT_INTENT_KEY)
  if (!storedIntent) return null

  if (remove) {
    sessionStorage.removeItem(CHAT_INTENT_KEY)
  }

  try {
    return JSON.parse(storedIntent)
  } catch {
    return storedIntent
  }
}

function getChatsUrl(el: HTMLElement): URL {
  const relativePath = el.getAttribute("data-chats-path") || "/chats/"
  return new URL(relativePath, window.location.href)
}

function getCurrentChatId(): string | null {
  return sessionStorage.getItem(CURRENT_CHAT_KEY)
}

function setCurrentChatId(id: string | null) {
  if (id) {
    sessionStorage.setItem(CURRENT_CHAT_KEY, id)
  } else {
    sessionStorage.removeItem(CURRENT_CHAT_KEY)
  }
}

function loadConversations(): Conversation[] {
  // NOTE: 当前聊天历史完全保存在浏览器 localStorage，不在后端持久化。
  // 这意味着：
  // 1. 换浏览器/清缓存会丢历史
  // 2. 无法跨设备同步
  // 3. 不能作为正式会话存储方案
  // 若未来 wiki-backend 提供 chat/session API，这块应整体迁移。
  const raw = localStorage.getItem(CONVERSATIONS_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && typeof item.id === "string" && Array.isArray(item.messages))
  } catch {
    return []
  }
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))
}

function getConversationById(id: string): Conversation | null {
  return loadConversations().find((conversation) => conversation.id === id) ?? null
}

function saveConversation(conversation: Conversation) {
  const conversations = loadConversations()
  const next = conversations.filter((item) => item.id !== conversation.id)
  next.unshift(conversation)
  saveConversations(next)
}

function normalizeWikiKey(value: string): string {
  return value.trim().toLowerCase()
}

async function loadContentIndex(): Promise<Record<string, any> | null> {
  if (contentIndexPromise) {
    return contentIndexPromise
  }

  contentIndexPromise = (async () => {
    try {
      // NOTE: 这里依赖 Quartz 输出的静态索引文件。
      // 如果 build 配置关闭/改名了 content-index 插件，wiki-link 跳转会退化成拼接原始路径。
      const res = await fetch("/static/contentIndex.json")
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  })()

  return contentIndexPromise
}

async function resolveWikiHref(target: string): Promise<string> {
  const normalizedTarget = target.trim().replace(/^\/+|\/+$/g, "")
  if (!normalizedTarget) return "#"

  const lookup = normalizeWikiKey(normalizedTarget)
  const contentIndex = await loadContentIndex()

  if (contentIndex) {
    // NOTE: 当前匹配策略是“宽松匹配”：
    // slug、slug 最后一段、title、文件名任一命中就跳转。
    // 好处是 [[PIX]] 这类简写能落到 entities/pix。
    // 风险是未来若不同页面出现同名 title / basename，可能会命中到非预期页面。
    // 若后续发现跳错页面，优先在这里收紧匹配规则。
    for (const [slug, entry] of Object.entries(contentIndex)) {
      const basename = slug.split("/").pop() || slug
      const title = typeof entry?.title === "string" ? entry.title : ""
      const filePath = typeof entry?.filePath === "string" ? entry.filePath : ""
      const fileBase = filePath.split("/").pop()?.replace(/\.md$/i, "") || ""
      const candidates = [
        normalizeWikiKey(slug),
        normalizeWikiKey(basename),
        normalizeWikiKey(title),
        normalizeWikiKey(fileBase),
      ]

      if (candidates.includes(lookup)) {
        return `/${slug.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`
      }
    }
  }

  return `/${normalizedTarget.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderInlineMarkdown(input: string): string {
  let html = escapeHtml(input)

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  html = html.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, (_, target, label) => `<a class="chat-wikilink unresolved" data-wiki-target="${escapeHtml(target)}" href="#">${label}</a>`)
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_, target) => `<a class="chat-wikilink unresolved" data-wiki-target="${escapeHtml(target)}" href="#">${target}</a>`)

  return html
}

function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")
  const blocks: string[] = []
  let paragraphLines: string[] = []
  let listItems: string[] = []

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    blocks.push(`<p>${renderInlineMarkdown(paragraphLines.join(" "))}</p>`)
    paragraphLines = []
  }

  const flushList = () => {
    if (listItems.length === 0) return
    blocks.push(`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`)
    listItems = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.length === 0) {
      flushParagraph()
      flushList()
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      const level = headingMatch[1].length
      blocks.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`)
      continue
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/)
    if (listMatch) {
      flushParagraph()
      listItems.push(listMatch[1])
      continue
    }

    flushList()
    paragraphLines.push(line)
  }

  flushParagraph()
  flushList()

  return blocks.join("")
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
}

function createConversation(firstQuestion: string): Conversation {
  const title = firstQuestion.trim().slice(0, 36) || "New Chat"
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title,
    lastMessage: "",
    updatedAt: now,
    messageCount: 0,
    messages: [],
  }
}

function appendMessage(conversation: Conversation, message: Message) {
  conversation.messages.push(message)
  conversation.messageCount = conversation.messages.length
  conversation.lastMessage = stripMarkdown(message.content)
  conversation.updatedAt = new Date(message.timestamp).toISOString()
}

function getQueryEndpoint(proxyUrl: string): string {
  const normalized = proxyUrl.replace(/\/+$/, "")

  if (normalized.endsWith("/api/query")) {
    return normalized
  }

  if (normalized.endsWith("/api")) {
    return `${normalized}/query`
  }

  return `${normalized}/api/query`
}

async function queryWiki(proxyUrl: string, question: string): Promise<QueryResponse> {
  const res = await fetch(getQueryEndpoint(proxyUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API ${res.status}: ${text.substring(0, 200)}`)
  }

  return res.json()
}

function formatAssistantAnswer(response: QueryResponse): string {
  // NOTE: 当前后端约定是 answer 作为正文 markdown，sources 单独作为引用区展示。
  // 如果后端以后把 sources 也混回 answer 里，前端会出现重复展示。
  return (response.answer || "").trim() || "No answer returned."
}

function normalizeSources(response: QueryResponse): string[] {
  return Array.isArray(response.sources) ? response.sources.filter(Boolean).map((source) => source.trim()).filter(Boolean) : []
}

function composeAssistantMarkdown(content: string, sources?: string[]): string {
  // NOTE: Copy 按钮复制的不是渲染后的 HTML，而是这里重新拼装出来的 markdown。
  // 若未来调整回答卡片结构，请同时检查“页面显示内容”和“复制出的 markdown”是否仍一致。
  const trimmedContent = content.trim()
  const normalizedSources = Array.isArray(sources) ? sources.filter(Boolean).map((source) => source.trim()).filter(Boolean) : []

  if (normalizedSources.length === 0) {
    return trimmedContent
  }

  return `${trimmedContent}\n\n## Sources\n\n- ${normalizedSources.join("\n- ")}`
}

function renderSources(sourcesEl: HTMLElement | null, sources?: string[]) {
  if (!sourcesEl) return

  if (!sources || sources.length === 0) {
    sourcesEl.innerHTML = ""
    sourcesEl.style.display = "none"
    return
  }

  const items = sources
    .map((source) => `<li class="message-source-item">${renderInlineMarkdown(source)}</li>`)
    .join("")

  sourcesEl.innerHTML = `
    <div class="message-sources-title">Sources</div>
    <ul class="message-sources-list">${items}</ul>
  `
  sourcesEl.style.display = "block"
}

function removeAllChildren(el: HTMLElement) {
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
}

async function hydrateWikiLinks(root: ParentNode) {
  const links = Array.from(root.querySelectorAll(".chat-wikilink.unresolved")) as HTMLAnchorElement[]
  await Promise.all(
    links.map(async (link) => {
      const target = link.dataset.wikiTarget
      if (!target) return
      link.href = await resolveWikiHref(target)
      link.classList.remove("unresolved")
    }),
  )
}

function bindCopyButton(button: HTMLButtonElement | null, markdown: string) {
  if (!button) return

  button.dataset.copyMarkdown = markdown
  button.onclick = async () => {
    // NOTE: 这里依赖浏览器 Clipboard API。
    // 在某些受限环境、非安全上下文或权限受限时可能失败，目前仅做轻量失败态反馈。
    const text = button.dataset.copyMarkdown || ""
    try {
      await navigator.clipboard.writeText(text)
      button.classList.add("copied")
      window.setTimeout(() => button.classList.remove("copied"), 1200)
    } catch {
      button.classList.add("copy-failed")
      window.setTimeout(() => button.classList.remove("copy-failed"), 1200)
    }
  }
}

function setChatPageState(messagesEl: HTMLElement, hasMessages: boolean) {
  const chatPage = messagesEl.closest(".chat-page")
  if (!chatPage) return

  if (hasMessages) {
    chatPage.classList.add("has-messages")
  } else {
    chatPage.classList.remove("has-messages")
  }
}

function renderChatHistory(
  sidebarEl: HTMLElement,
  historyEl: HTMLElement,
  conversations: Conversation[],
  currentChatId: string | null,
) {
  removeAllChildren(historyEl)

  if (conversations.length === 0) {
    const empty = document.createElement("div")
    empty.className = "chats-empty-state"
    empty.textContent = "No conversations yet"
    historyEl.appendChild(empty)
    return
  }

  const template = document.getElementById("template-chat-item") as HTMLTemplateElement
  if (!template) return

  for (const conversation of conversations) {
    const clone = template.content.cloneNode(true) as DocumentFragment
    const link = clone.querySelector(".chat-history-item") as HTMLAnchorElement
    const titleEl = clone.querySelector(".chat-item-title") as HTMLElement
    const previewEl = clone.querySelector(".chat-item-preview") as HTMLElement

    if (link) {
      link.href = "#"
      link.setAttribute("data-chat-id", conversation.id)
      if (conversation.id === currentChatId) {
        link.classList.add("active")
      }
      link.addEventListener("click", (e) => {
        e.preventDefault()
        setCurrentChatId(conversation.id)
        sessionStorage.setItem(CHAT_INTENT_KEY, JSON.stringify({ mode: "chat", id: conversation.id }))
        window.spaNavigate(getChatsUrl(sidebarEl))
      })
    }

    if (titleEl) {
      titleEl.textContent = conversation.title || "Untitled"
    }

    if (previewEl) {
      previewEl.textContent = conversation.lastMessage || ""
    }

    historyEl.appendChild(clone)
  }
}

function renderNewChat(messagesEl: HTMLElement) {
  removeAllChildren(messagesEl)
  setChatPageState(messagesEl, false)
  const greeting = document.createElement("div")
  greeting.className = "message-greeting"
  greeting.innerHTML = `
    <div class="greeting-content">
      <h2>AI Chat</h2>
      <p>Start a conversation by typing a message below.</p>
    </div>
  `
  messagesEl.appendChild(greeting)
}

function renderMessages(messagesEl: HTMLElement, messages: Message[]) {
  removeAllChildren(messagesEl)
  setChatPageState(messagesEl, messages.length > 0)

  const userTemplate = document.getElementById("template-message-user") as HTMLTemplateElement
  const assistantTemplate = document.getElementById("template-message-assistant") as HTMLTemplateElement

  for (const message of messages) {
    if (message.role === "user") {
      if (!userTemplate) continue
      const clone = userTemplate.content.cloneNode(true) as DocumentFragment
      const contentEl = clone.querySelector(".message-content") as HTMLElement
      if (contentEl) contentEl.textContent = message.content
      messagesEl.appendChild(clone)
      continue
    }

    if (!assistantTemplate) continue
    const clone = assistantTemplate.content.cloneNode(true) as DocumentFragment
    const contentEl = clone.querySelector(".message-content") as HTMLElement
    const sourcesEl = clone.querySelector(".message-sources") as HTMLElement
    const copyButton = clone.querySelector(".message-copy-button") as HTMLButtonElement
    const loadingEl = clone.querySelector(".message-loading") as HTMLElement
    if (contentEl) contentEl.innerHTML = renderMarkdown(message.content)
    renderSources(sourcesEl, message.sources)
    bindCopyButton(copyButton, composeAssistantMarkdown(message.content, message.sources))
    if (loadingEl) loadingEl.style.display = "none"
    messagesEl.appendChild(clone)
    void hydrateWikiLinks(messagesEl)
  }
}

function appendUserMessage(messagesEl: HTMLElement, text: string) {
  setChatPageState(messagesEl, true)
  const template = document.getElementById("template-message-user") as HTMLTemplateElement
  if (!template) return
  const clone = template.content.cloneNode(true) as DocumentFragment
  const contentEl = clone.querySelector(".message-content") as HTMLElement
  if (contentEl) contentEl.textContent = text
  messagesEl.appendChild(clone)
}

function appendAssistantMessage(messagesEl: HTMLElement): { contentEl: HTMLElement; sourcesEl: HTMLElement; copyButton: HTMLButtonElement; loadingEl: HTMLElement } {
  const template = document.getElementById("template-message-assistant") as HTMLTemplateElement
  if (!template) {
    const fallback = document.createElement("div")
    fallback.className = "message message-assistant"
    messagesEl.appendChild(fallback)
    return { contentEl: fallback, sourcesEl: fallback, copyButton: fallback as unknown as HTMLButtonElement, loadingEl: fallback }
  }

  const clone = template.content.cloneNode(true) as DocumentFragment
  const contentEl = clone.querySelector(".message-content") as HTMLElement
  const sourcesEl = clone.querySelector(".message-sources") as HTMLElement
  const copyButton = clone.querySelector(".message-copy-button") as HTMLButtonElement
  const loadingEl = clone.querySelector(".message-loading") as HTMLElement
  messagesEl.appendChild(clone)
  return { contentEl, sourcesEl, copyButton, loadingEl }
}

function scrollToBottom(el: HTMLElement) {
  requestAnimationFrame(() => {
    el.scrollTop = el.scrollHeight
  })
}

function updateSendButton(input: HTMLTextAreaElement, button: HTMLButtonElement) {
  button.disabled = input.value.trim().length === 0
}

function autoResizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto"
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
}

type ChatMode =
  | { type: "new" }
  | { type: "chat"; id: string }

function detectChatMode(): ChatMode {
  const storedIntent = readStoredIntent(true)
  if (storedIntent) {
    if (storedIntent === "new") return { type: "new" }
    if (storedIntent.mode === "chat" && storedIntent.id) return { type: "chat", id: storedIntent.id }
  }

  const currentChatId = getCurrentChatId()
  if (currentChatId && getConversationById(currentChatId)) {
    return { type: "chat", id: currentChatId }
  }

  return { type: "new" }
}

const cleanupFns: Array<() => void> = []

function addCleanup(fn: () => void) {
  cleanupFns.push(fn)
}

function runCleanups() {
  cleanupFns.forEach((fn) => fn())
  cleanupFns.length = 0
}

function refreshSidebars() {
  const currentChatId = getCurrentChatId()
  const conversations = loadConversations()

  for (const sidebarEl of Array.from(document.querySelectorAll(".chats-sidebar"))) {
    const historyEl = sidebarEl.querySelector(".chats-history") as HTMLElement
    if (historyEl) {
      renderChatHistory(sidebarEl as HTMLElement, historyEl, conversations, currentChatId)
    }
  }
}

async function setupChatPage(pageEl: HTMLElement) {
  const config = getChatConfig(pageEl)
  const messagesEl = pageEl.querySelector(".chat-messages") as HTMLElement
  const inputEl = pageEl.querySelector(".chat-input") as HTMLTextAreaElement
  const sendButton = pageEl.querySelector(".chat-send-button") as HTMLButtonElement

  if (!messagesEl || !inputEl || !sendButton) return

  const mode = detectChatMode()
  let currentConversation = mode.type === "chat" ? getConversationById(mode.id) : null
  let isSending = false

  if (currentConversation) {
    setCurrentChatId(currentConversation.id)
    renderMessages(messagesEl, currentConversation.messages)
  } else {
    renderNewChat(messagesEl)
  }

  scrollToBottom(messagesEl)

  const onInput = () => {
    updateSendButton(inputEl, sendButton)
    autoResizeTextarea(inputEl)
  }

  inputEl.addEventListener("input", onInput)
  addCleanup(() => inputEl.removeEventListener("input", onInput))

  const doSend = async () => {
    const text = inputEl.value.trim()
    if (!text || isSending) return

    isSending = true
    sendButton.disabled = true
    inputEl.disabled = true

    const greeting = messagesEl.querySelector(".message-greeting")
    if (greeting) greeting.remove()

    if (!currentConversation) {
      // NOTE: 当前“New Chat”仅在前端本地创建一个 conversation id，
      // 后端并不知道这个会话概念；后端仍然只处理单次 /api/query。
      currentConversation = createConversation(text)
      setCurrentChatId(currentConversation.id)
    }

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    }

    appendMessage(currentConversation, userMessage)
    saveConversation(currentConversation)
    refreshSidebars()

    appendUserMessage(messagesEl, text)
    inputEl.value = ""
    inputEl.style.height = "auto"
    scrollToBottom(messagesEl)

    const { contentEl, sourcesEl, copyButton, loadingEl } = appendAssistantMessage(messagesEl)
    if (loadingEl) loadingEl.style.display = "block"
    scrollToBottom(messagesEl)

    try {
      const response = await queryWiki(config.proxyUrl, text)
      const assistantText = formatAssistantAnswer(response)
      const assistantSources = normalizeSources(response)
      if (contentEl) contentEl.innerHTML = renderMarkdown(assistantText)
      renderSources(sourcesEl, assistantSources)
      bindCopyButton(copyButton, composeAssistantMarkdown(assistantText, assistantSources))
      void hydrateWikiLinks(messagesEl)
      if (loadingEl) loadingEl.style.display = "none"

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantText,
        timestamp: Date.now(),
        sources: assistantSources,
      }

      appendMessage(currentConversation, assistantMessage)
      saveConversation(currentConversation)
      refreshSidebars()
    } catch (err) {
      const errorText = err instanceof Error ? err.message : String(err)
      if (contentEl) contentEl.textContent = `Error: ${errorText}`
      if (loadingEl) loadingEl.style.display = "none"
    } finally {
      isSending = false
      inputEl.disabled = false
      inputEl.focus()
      updateSendButton(inputEl, sendButton)
    }
  }

  const onSendClick = () => doSend()
  sendButton.addEventListener("click", onSendClick)
  addCleanup(() => sendButton.removeEventListener("click", onSendClick))

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      doSend()
    }
  }

  inputEl.addEventListener("keydown", onKeydown)
  addCleanup(() => inputEl.removeEventListener("keydown", onKeydown))
}

async function setupSidebar(sidebarEl: HTMLElement) {
  const historyEl = sidebarEl.querySelector(".chats-history") as HTMLElement
  const newChatBtn = sidebarEl.querySelector("[data-new-chat]") as HTMLButtonElement

  if (!historyEl || !newChatBtn) return

  renderChatHistory(sidebarEl, historyEl, loadConversations(), getCurrentChatId())

  const onNewChat = (e: Event) => {
    e.preventDefault()
    setCurrentChatId(null)
    sessionStorage.setItem(CHAT_INTENT_KEY, "new")
    window.spaNavigate(getChatsUrl(sidebarEl))
  }

  newChatBtn.addEventListener("click", onNewChat)
  addCleanup(() => newChatBtn.removeEventListener("click", onNewChat))
}

async function handleNav() {
  runCleanups()

  const sidebars = document.querySelectorAll(".chats-sidebar")
  for (const el of Array.from(sidebars)) {
    await setupSidebar(el as HTMLElement)
  }

  const pages = document.querySelectorAll(".chat-page")
  for (const el of Array.from(pages)) {
    await setupChatPage(el as HTMLElement)
  }
}

document.addEventListener("nav", handleNav)
document.addEventListener("render", handleNav)
