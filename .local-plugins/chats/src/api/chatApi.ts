import type { Chat, ChatMessagesResponse, ChatTurnResponse } from "../types"

export class ChatApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "ChatApiError"
  }
}

function getChatsEndpoint(proxyUrl: string): string {
  const normalized = proxyUrl.replace(/\/+$/, "")

  if (normalized.endsWith("/api/chats")) return normalized
  if (normalized.endsWith("/api")) return `${normalized}/chats`
  return `${normalized}/api/chats`
}

function getErrorDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) return null

  const detail = payload.detail
  if (typeof detail === "string") return detail
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
