// @ts-nocheck - Inline script runs in browser context

import {
  ChatApiError,
  createChat,
  getChatMessages,
  getIngestJob,
  listIngestJobs,
  listChats,
  saveMessageAsSynthesis,
  sendChatMessage,
  uploadIngestDocument,
} from "../../api/chatApi"
import type { Chat, ChatMessage, IngestJobResponse } from "../../types"
import { renderMarkdown } from "./markdown"

interface ChatConfig {
  proxyUrl: string
}

interface StoredChatIntent {
  mode?: "chat"
  id?: string
}

const CURRENT_CHAT_KEY = "chats:current"
const CHAT_INTENT_KEY = "chats:intent"
// NOTE: contentIndex 只用于把回答里的 [[wiki-link]] 解析成 Quartz 站内真实 slug。
// 如果未来站点索引输出路径或字段结构变化，这里会是优先排查点。
let contentIndexPromise: Promise<Record<string, any> | null> | null = null

function getChatConfig(el: HTMLElement): ChatConfig {
  return {
    // 页面模板通过 CHAT_PROXY_URL 注入后端地址，默认回退到 Quartz 的 /api 反代。
    proxyUrl: el.getAttribute("data-proxy-url") || "/api",
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
        return `/${slug
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/")}`
      }
    }
  }

  return `/${normalizedTarget
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`
}

function removeAllChildren(el: HTMLElement) {
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
}

async function hydrateWikiLinks(root: ParentNode) {
  const links = Array.from(
    root.querySelectorAll(".chat-wikilink.unresolved"),
  ) as HTMLAnchorElement[]
  await Promise.all(
    links.map(async (link) => {
      const target = link.dataset.wikiTarget
      if (!target) return
      link.href = await resolveWikiHref(target)
      link.classList.remove("unresolved")
    }),
  )
}

async function copyText(text: string): Promise<void> {
  let clipboardError: unknown

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (error) {
      clipboardError = error
    }
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.readOnly = true
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  textarea.style.pointerEvents = "none"
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  try {
    if (!document.execCommand("copy")) {
      throw new Error("The browser rejected the clipboard fallback", {
        cause: clipboardError,
      })
    }
  } finally {
    textarea.remove()
  }
}

function bindCopyButton(button: HTMLButtonElement | null, markdown: string) {
  if (!button) return

  button.dataset.copyMarkdown = markdown
  button.onclick = async () => {
    // Clipboard API 在非安全上下文或权限受限时可能不可用，copyText 会尝试兼容回退。
    const text = button.dataset.copyMarkdown || ""
    try {
      await copyText(text)
      button.classList.add("copied")
      window.setTimeout(() => button.classList.remove("copied"), 1200)
    } catch (error) {
      console.error("[Chats] Failed to copy answer:", error)
      button.classList.add("copy-failed")
      window.setTimeout(() => button.classList.remove("copy-failed"), 1200)
    }
  }
}

function syncSynthesisButtonState(button: HTMLButtonElement, message: ChatMessage) {
  const isSaved = Boolean(message.synthesis_path)
  button.disabled = isSaved
  button.classList.toggle("saved", isSaved)
  button.classList.remove("saving", "save-failed")
  button.title = isSaved ? "Saved as Synthesis" : "Save as Synthesis"
  button.setAttribute("aria-label", button.title)
}

function bindSynthesisButton(
  button: HTMLButtonElement | null,
  message: ChatMessage,
  proxyUrl: string,
) {
  if (!button) return

  syncSynthesisButtonState(button, message)
  button.onclick = async () => {
    if (button.disabled || message.synthesis_path) return

    button.disabled = true
    button.classList.add("saving")
    button.classList.remove("save-failed")
    button.title = "Saving as Synthesis"
    button.setAttribute("aria-label", button.title)

    try {
      const response = await saveMessageAsSynthesis(proxyUrl, message.chat_id, message.id)
      message.synthesis_path = response.path
      message.synthesized_at = response.created_at
      syncSynthesisButtonState(button, message)
    } catch (error) {
      const detail = error instanceof ChatApiError ? error.message : ""
      if (error instanceof ChatApiError && error.status === 409 && detail.includes("path")) {
        const existingPath = detail.match(/syntheses\/[^:\s]+\.md/)?.[0] || "syntheses/unknown.md"
        message.synthesis_path = message.synthesis_path || existingPath
        message.synthesized_at = message.synthesized_at || new Date().toISOString()
        syncSynthesisButtonState(button, message)
        return
      }

      console.error("[Chats] Failed to save synthesis:", error)
      button.disabled = false
      button.classList.remove("saving")
      button.classList.add("save-failed")
      button.title = "Save failed. Try again"
      button.setAttribute("aria-label", button.title)
      window.setTimeout(() => {
        button.classList.remove("save-failed")
        button.title = "Save as Synthesis"
        button.setAttribute("aria-label", button.title)
      }, 1600)
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
  chats: Chat[],
  currentChatId: string | null,
  errorMessage?: string,
) {
  removeAllChildren(historyEl)

  if (errorMessage || chats.length === 0) {
    const empty = document.createElement("div")
    empty.className = "chats-empty-state"
    empty.textContent = errorMessage || "No conversations yet"
    historyEl.appendChild(empty)
    return
  }

  const template = document.getElementById("template-chat-item") as HTMLTemplateElement
  if (!template) return

  for (const chat of chats) {
    const clone = template.content.cloneNode(true) as DocumentFragment
    const link = clone.querySelector(".chat-history-item") as HTMLAnchorElement
    const titleEl = clone.querySelector(".chat-item-title") as HTMLElement
    const previewEl = clone.querySelector(".chat-item-preview") as HTMLElement

    if (link) {
      link.href = "#"
      link.setAttribute("data-chat-id", chat.id)
      if (chat.id === currentChatId) {
        link.classList.add("active")
      }
      link.addEventListener("click", (e) => {
        e.preventDefault()
        setCurrentChatId(chat.id)
        sessionStorage.setItem(CHAT_INTENT_KEY, JSON.stringify({ mode: "chat", id: chat.id }))
        window.spaNavigate(getChatsUrl(sidebarEl))
      })
    }

    if (titleEl) {
      titleEl.textContent = chat.title || "Untitled"
    }

    if (previewEl) {
      previewEl.textContent = chat.last_message_preview || ""
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

function renderMessages(messagesEl: HTMLElement, messages: ChatMessage[], proxyUrl: string) {
  removeAllChildren(messagesEl)
  setChatPageState(messagesEl, messages.length > 0)

  const userTemplate = document.getElementById("template-message-user") as HTMLTemplateElement
  const assistantTemplate = document.getElementById(
    "template-message-assistant",
  ) as HTMLTemplateElement

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
    const copyButton = clone.querySelector(".message-copy-button") as HTMLButtonElement
    const synthesisButton = clone.querySelector(".message-synthesis-button") as HTMLButtonElement
    const loadingEl = clone.querySelector(".message-loading") as HTMLElement
    if (contentEl) contentEl.innerHTML = renderMarkdown(message.content)
    bindCopyButton(copyButton, message.content.trim())
    bindSynthesisButton(synthesisButton, message, proxyUrl)
    if (loadingEl) loadingEl.style.display = "none"
    messagesEl.appendChild(clone)
  }

  void hydrateWikiLinks(messagesEl)
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

function appendAssistantMessage(messagesEl: HTMLElement): {
  contentEl: HTMLElement
  copyButton: HTMLButtonElement
  synthesisButton: HTMLButtonElement
  loadingEl: HTMLElement
} {
  const template = document.getElementById("template-message-assistant") as HTMLTemplateElement
  if (!template) {
    const fallback = document.createElement("div")
    fallback.className = "message message-assistant"
    messagesEl.appendChild(fallback)
    return {
      contentEl: fallback,
      copyButton: fallback as unknown as HTMLButtonElement,
      synthesisButton: fallback as unknown as HTMLButtonElement,
      loadingEl: fallback,
    }
  }

  const clone = template.content.cloneNode(true) as DocumentFragment
  const contentEl = clone.querySelector(".message-content") as HTMLElement
  const copyButton = clone.querySelector(".message-copy-button") as HTMLButtonElement
  const synthesisButton = clone.querySelector(".message-synthesis-button") as HTMLButtonElement
  const loadingEl = clone.querySelector(".message-loading") as HTMLElement
  if (copyButton) copyButton.style.display = "none"
  if (synthesisButton) synthesisButton.style.display = "none"
  messagesEl.appendChild(clone)
  return { contentEl, copyButton, synthesisButton, loadingEl }
}

function renderRequestError(messagesEl: HTMLElement, error: unknown) {
  const greeting = messagesEl.querySelector(".message-greeting")
  if (greeting) greeting.remove()
  setChatPageState(messagesEl, true)

  const { contentEl, copyButton, synthesisButton, loadingEl } = appendAssistantMessage(messagesEl)
  const message = error instanceof Error ? error.message : String(error)
  if (contentEl) contentEl.textContent = `Error: ${message}`
  if (copyButton) copyButton.style.display = "none"
  if (synthesisButton) synthesisButton.style.display = "none"
  if (loadingEl) loadingEl.style.display = "none"
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

type ChatMode = { type: "new" } | { type: "chat"; id: string }

function detectChatMode(): ChatMode {
  const storedIntent = readStoredIntent(true)
  if (storedIntent) {
    if (storedIntent === "new") return { type: "new" }
    if (storedIntent.mode === "chat" && storedIntent.id)
      return { type: "chat", id: storedIntent.id }
  }

  const currentChatId = getCurrentChatId()
  if (currentChatId) {
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

let chats: Chat[] = []
let chatsLoadError: string | null = null
let ingestJobs: IngestJobResponse[] = []
let ingestLoadError: string | null = null
const ingestPollTimers = new Map<string, number>()

function sortChats(items: Chat[]): Chat[] {
  return [...items].sort((left, right) => right.updated_at.localeCompare(left.updated_at))
}

function upsertChat(chat: Chat) {
  chatsLoadError = null
  chats = sortChats([chat, ...chats.filter((item) => item.id !== chat.id)])
}

function sortIngestJobs(items: IngestJobResponse[]): IngestJobResponse[] {
  return [...items].sort((left, right) => right.created_at.localeCompare(left.created_at))
}

function upsertIngestJob(job: IngestJobResponse) {
  ingestLoadError = null
  ingestJobs = sortIngestJobs([job, ...ingestJobs.filter((item) => item.job_id !== job.job_id)]).slice(
    0,
    20,
  )
}

function isIngestPending(job: IngestJobResponse): boolean {
  return job.status === "queued" || job.status === "running"
}

function renderIngestJobs(listEl: HTMLElement, jobs: IngestJobResponse[], errorMessage?: string) {
  removeAllChildren(listEl)

  if (errorMessage || jobs.length === 0) {
    const empty = document.createElement("div")
    empty.className = "ingests-empty-state"
    empty.textContent = errorMessage || "No ingests yet"
    listEl.appendChild(empty)
    return
  }

  for (const job of jobs.slice(0, 3)) {
    const item = document.createElement("div")
    item.className = `ingest-item ingest-${job.status}`

    const title = document.createElement("div")
    title.className = "ingest-item-title"
    title.textContent = job.original_filename

    const status = document.createElement("div")
    status.className = "ingest-item-status"
    if (job.status === "succeeded") {
      status.textContent = "已导入，可以开始提问"
    } else if (job.status === "failed") {
      status.textContent = job.error ? `failed: ${job.error}` : "failed"
    } else {
      status.textContent = job.status
    }

    item.append(title, status)
    listEl.appendChild(item)
  }
}

function refreshSidebars() {
  const currentChatId = getCurrentChatId()

  for (const sidebarEl of Array.from(document.querySelectorAll(".chats-sidebar"))) {
    const historyEl = sidebarEl.querySelector(".chats-history") as HTMLElement
    if (historyEl) {
      renderChatHistory(
        sidebarEl as HTMLElement,
        historyEl,
        chats,
        currentChatId,
        chatsLoadError || undefined,
      )
    }
    const ingestsEl = sidebarEl.querySelector(".ingests-list") as HTMLElement
    if (ingestsEl) {
      renderIngestJobs(ingestsEl, ingestJobs, ingestLoadError || undefined)
    }
  }
}

function stopIngestPolling(jobId: string) {
  const timer = ingestPollTimers.get(jobId)
  if (timer !== undefined) {
    window.clearTimeout(timer)
    ingestPollTimers.delete(jobId)
  }
}

function pollIngestJob(proxyUrl: string, jobId: string) {
  if (ingestPollTimers.has(jobId)) return

  const poll = async () => {
    try {
      const job = await getIngestJob(proxyUrl, jobId)
      upsertIngestJob(job)
      refreshSidebars()
      if (!isIngestPending(job)) {
        ingestPollTimers.delete(jobId)
        return
      }
    } catch (error) {
      console.error("[Chats] Failed to poll ingest job:", error)
    }

    ingestPollTimers.set(jobId, window.setTimeout(poll, 2000))
  }

  ingestPollTimers.set(jobId, window.setTimeout(poll, 800))
}

async function setupChatPage(pageEl: HTMLElement) {
  const config = getChatConfig(pageEl)
  const messagesEl = pageEl.querySelector(".chat-messages") as HTMLElement
  const inputEl = pageEl.querySelector(".chat-input") as HTMLTextAreaElement
  const sendButton = pageEl.querySelector(".chat-send-button") as HTMLButtonElement
  const attachButton = pageEl.querySelector(".chat-attach-button") as HTMLButtonElement

  if (!messagesEl || !inputEl || !sendButton) return

  const mode = detectChatMode()
  let currentChatId = mode.type === "chat" ? mode.id : null
  let currentMessages: ChatMessage[] = []
  let isSending = false

  if (!currentChatId) {
    renderNewChat(messagesEl)
  } else {
    try {
      const response = await getChatMessages(config.proxyUrl, currentChatId)
      currentMessages = response.messages
      upsertChat(response.chat)
      setCurrentChatId(response.chat.id)
      renderMessages(messagesEl, currentMessages, config.proxyUrl)
      refreshSidebars()
    } catch (error) {
      renderNewChat(messagesEl)
      renderRequestError(messagesEl, error)
      if (error instanceof ChatApiError && error.status === 404) {
        chats = chats.filter((chat) => chat.id !== currentChatId)
        currentChatId = null
        setCurrentChatId(null)
        refreshSidebars()
      }
    }
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

    appendUserMessage(messagesEl, text)
    inputEl.value = ""
    inputEl.style.height = "auto"
    scrollToBottom(messagesEl)

    const { loadingEl } = appendAssistantMessage(messagesEl)
    if (loadingEl) loadingEl.style.display = "block"
    scrollToBottom(messagesEl)

    try {
      if (!currentChatId) {
        const createdChat = await createChat(config.proxyUrl)
        currentChatId = createdChat.id
        setCurrentChatId(createdChat.id)
        upsertChat(createdChat)
        refreshSidebars()
      }

      const response = await sendChatMessage(config.proxyUrl, currentChatId, text)
      currentMessages = [...currentMessages, response.user_message, response.assistant_message]
      upsertChat(response.chat)
      renderMessages(messagesEl, currentMessages, config.proxyUrl)
      refreshSidebars()
      scrollToBottom(messagesEl)
    } catch (error) {
      if (currentMessages.length > 0) {
        renderMessages(messagesEl, currentMessages, config.proxyUrl)
      } else {
        renderNewChat(messagesEl)
      }
      renderRequestError(messagesEl, error)
      inputEl.value = text
      autoResizeTextarea(inputEl)
      scrollToBottom(messagesEl)
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

  if (attachButton) {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.style.display = "none"
    fileInput.accept = ".md,.pdf,.docx,.pptx,.xlsx,.xls,.html,.htm,.txt,.csv,.json,.xml,.rst,.rtf,.epub,.ipynb,.yaml,.yml,.tsv,.wav,.mp3"
    document.body.appendChild(fileInput)
    attachButton.disabled = false

    const onAttachClick = () => {
      fileInput.value = ""
      fileInput.click()
    }

    const onFileChange = async () => {
      const file = fileInput.files?.[0]
      if (!file) return

      attachButton.disabled = true
      attachButton.classList.add("uploading")
      try {
        const job = await uploadIngestDocument(config.proxyUrl, file)
        upsertIngestJob(job)
        refreshSidebars()
        if (isIngestPending(job)) {
          pollIngestJob(config.proxyUrl, job.job_id)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed"
        ingestLoadError = `Upload failed: ${message}`
        refreshSidebars()
      } finally {
        attachButton.disabled = false
        attachButton.classList.remove("uploading")
      }
    }

    attachButton.addEventListener("click", onAttachClick)
    fileInput.addEventListener("change", onFileChange)
    addCleanup(() => {
      attachButton.removeEventListener("click", onAttachClick)
      fileInput.removeEventListener("change", onFileChange)
      fileInput.remove()
    })
  }

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      doSend()
    }
  }

  inputEl.addEventListener("keydown", onKeydown)
  addCleanup(() => inputEl.removeEventListener("keydown", onKeydown))
}

function setupSidebar(sidebarEl: HTMLElement) {
  const historyEl = sidebarEl.querySelector(".chats-history") as HTMLElement
  const ingestsEl = sidebarEl.querySelector(".ingests-list") as HTMLElement
  const newChatBtn = sidebarEl.querySelector("[data-new-chat]") as HTMLButtonElement

  if (!historyEl || !newChatBtn) return

  renderChatHistory(sidebarEl, historyEl, chats, getCurrentChatId(), chatsLoadError || undefined)
  if (ingestsEl) {
    renderIngestJobs(ingestsEl, ingestJobs, ingestLoadError || undefined)
  }

  const onNewChat = (e: Event) => {
    e.preventDefault()
    setCurrentChatId(null)
    sessionStorage.setItem(CHAT_INTENT_KEY, "new")
    window.spaNavigate(getChatsUrl(sidebarEl))
  }

  newChatBtn.addEventListener("click", onNewChat)
  addCleanup(() => newChatBtn.removeEventListener("click", onNewChat))
}

function setupSidebarToggle(shellEl: HTMLElement) {
  const toggleButton = shellEl.querySelector("[data-sidebar-toggle]") as HTMLButtonElement
  if (!toggleButton) return

  const updateToggleState = (collapsed: boolean) => {
    const label = collapsed
      ? toggleButton.dataset.expandLabel || "Expand sidebar"
      : toggleButton.dataset.collapseLabel || "Collapse sidebar"

    shellEl.classList.toggle("sidebar-collapsed", collapsed)
    toggleButton.setAttribute("aria-expanded", String(!collapsed))
    toggleButton.setAttribute("aria-label", label)
    toggleButton.title = label
  }

  const onToggle = () => {
    updateToggleState(!shellEl.classList.contains("sidebar-collapsed"))
  }

  updateToggleState(false)
  toggleButton.addEventListener("click", onToggle)
  addCleanup(() => toggleButton.removeEventListener("click", onToggle))
}

async function handleNav() {
  runCleanups()
  for (const jobId of Array.from(ingestPollTimers.keys())) {
    stopIngestPolling(jobId)
  }

  const configEl = document.querySelector(
    ".chat-shell, .chats-sidebar, .chat-page",
  ) as HTMLElement | null
  if (configEl) {
    const proxyUrl = getChatConfig(configEl).proxyUrl
    try {
      chats = sortChats(await listChats(proxyUrl))
      chatsLoadError = null
    } catch (error) {
      chats = []
      chatsLoadError =
        error instanceof Error
          ? `Unable to load conversations: ${error.message}`
          : "Unable to load conversations"
    }

    try {
      ingestJobs = sortIngestJobs(await listIngestJobs(proxyUrl, 20))
      ingestLoadError = null
    } catch (error) {
      ingestJobs = []
      ingestLoadError =
        error instanceof Error ? `Unable to load ingests: ${error.message}` : "Unable to load ingests"
    }
  }

  const sidebars = document.querySelectorAll(".chats-sidebar")
  for (const el of Array.from(sidebars)) {
    setupSidebar(el as HTMLElement)
  }

  const shells = document.querySelectorAll(".chat-shell")
  for (const el of Array.from(shells)) {
    setupSidebarToggle(el as HTMLElement)
  }

  const pages = document.querySelectorAll(".chat-page")
  for (const el of Array.from(pages)) {
    await setupChatPage(el as HTMLElement)
  }

  if (configEl) {
    const proxyUrl = getChatConfig(configEl).proxyUrl
    for (const job of ingestJobs) {
      if (isIngestPending(job)) {
        pollIngestJob(proxyUrl, job.job_id)
      }
    }
  }
}

document.addEventListener("nav", handleNav)
document.addEventListener("render", handleNav)
