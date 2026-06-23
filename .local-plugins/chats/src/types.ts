export interface Chat {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  last_message_at: string | null
  last_message_preview: string | null
}

export interface ChatMessage {
  id: number
  chat_id: string
  role: "user" | "assistant"
  content: string
  sources: string[]
  relevant_pages: string[]
  created_at: string
  synthesis_path: string | null
  synthesized_at: string | null
}

export interface ChatMessagesResponse {
  chat: Chat
  messages: ChatMessage[]
}

export interface ChatTurnResponse {
  chat: Chat
  user_message: ChatMessage
  assistant_message: ChatMessage
}

export interface SynthesisResponse {
  chat_id: string
  assistant_message_id: number
  question_message_id: number
  title: string
  path: string
  created_at: string
}

export interface ChatSessionData {
  intent?: "new" | { mode: "chat"; id: string }
}
