export interface Conversation {
  id: string
  title: string
  lastMessage?: string
  updatedAt: string
  messageCount: number
}

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
}

export interface ChatSessionData {
  intent?: "new" | { mode: "chat"; id: string }
}
