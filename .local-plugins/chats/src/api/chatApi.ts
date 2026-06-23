import type { Chat, ChatMessagesResponse, ChatTurnResponse, SynthesisResponse } from "../types"

export class ChatApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "ChatApiError"
  }
}

function getApiBaseUrl(proxyUrl: string): string {
  const normalized = proxyUrl.replace(/\/+$/, "")

  if (normalized.endsWith("/api/chats")) {
    return normalized.slice(0, -"/chats".length)
  }
  if (normalized.endsWith("/api")) return normalized
  return `${normalized}/api`
}

function getChatsEndpoint(proxyUrl: string): string {
  return `${getApiBaseUrl(proxyUrl)}/chats`
}

function getSynthesisEndpoint(proxyUrl: string): string {
  return `${getApiBaseUrl(proxyUrl)}/synthesis`
}

function getErrorDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) return null

  const detail = payload.detail
  if (typeof detail === "string") return detail
  if (detail && typeof detail === "object") {
    const message =
      "message" in detail && typeof detail.message === "string" ? detail.message : null
    const path = "path" in detail && typeof detail.path === "string" ? detail.path : null
    if (message && path) return `${message}: ${path}`
    if (message) return message
    if (path) return path
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") {
          return item.msg
        }
        return null
      })
      .filter((message): message is string => message !== null)
      .join("; ")
  }

  return null
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = getErrorDetail(payload)
    throw new ChatApiError(
      response.status,
      detail || `Request failed with status ${response.status}`,
    )
  }

  return payload as T
}

function jsonRequest(method: "POST" | "PATCH", body?: object): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }
}

export function listChats(proxyUrl: string): Promise<Chat[]> {
  return request<Chat[]>(getChatsEndpoint(proxyUrl))
}

export function createChat(proxyUrl: string, title?: string): Promise<Chat> {
  const body = title ? { title } : undefined
  return request<Chat>(getChatsEndpoint(proxyUrl), jsonRequest("POST", body))
}

export function getChatMessages(proxyUrl: string, chatId: string): Promise<ChatMessagesResponse> {
  return request<ChatMessagesResponse>(
    `${getChatsEndpoint(proxyUrl)}/${encodeURIComponent(chatId)}/messages`,
  )
}

export function sendChatMessage(
  proxyUrl: string,
  chatId: string,
  content: string,
): Promise<ChatTurnResponse> {
  return request<ChatTurnResponse>(
    `${getChatsEndpoint(proxyUrl)}/${encodeURIComponent(chatId)}/messages`,
    jsonRequest("POST", { content }),
  )
}

export function renameChat(proxyUrl: string, chatId: string, title: string): Promise<Chat> {
  return request<Chat>(
    `${getChatsEndpoint(proxyUrl)}/${encodeURIComponent(chatId)}`,
    jsonRequest("PATCH", { title }),
  )
}

export function saveMessageAsSynthesis(
  proxyUrl: string,
  chatId: string,
  assistantMessageId: number,
  title?: string,
): Promise<SynthesisResponse> {
  return request<SynthesisResponse>(
    getSynthesisEndpoint(proxyUrl),
    jsonRequest("POST", {
      chat_id: chatId,
      assistant_message_id: assistantMessageId,
      ...(title ? { title } : {}),
    }),
  )
}
