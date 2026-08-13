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
  model_profile_id?: string | null
  model_profile_label?: string | null
}

export interface ModelProfile {
  id: string
  label: string
  location: "cloud" | "local"
  reasoning_mode: "direct" | "thinking" | null
  available: boolean
  is_default?: boolean
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
  publication?: Publication | null
}

export type PublicationStatus = "pending" | "running" | "published" | "failed"

export interface Publication {
  status: PublicationStatus
  job_id: string | null
  published_at: string | null
  error: string | null
}

export type PublishJobStatus = "queued" | "running" | "succeeded" | "failed"

export interface PublishJobResponse {
  job_id: string
  status: PublishJobStatus
  trigger: "automatic" | "manual"
  change_count: number
  scheduled_at: string
  created_at: string
  updated_at: string
  started_at: string | null
  finished_at: string | null
  published_at: string | null
  error: string | null
}

export interface PublishStatusResponse {
  pending_change_count: number
  active_job: PublishJobResponse | null
  last_successful_job: PublishJobResponse | null
}

export type IngestJobStatus = "queued" | "running" | "succeeded" | "failed"
export type IngestTrigger = "manual" | "scheduled"

export interface IngestJobResponse {
  job_id: string
  status: IngestJobStatus
  original_filename: string
  trigger?: IngestTrigger
  source_path: string
  document_name_key?: string | null
  source_url?: string | null
  created_pages: string[]
  updated_pages: string[]
  contradictions: string[]
  validation: {
    broken_links: Array<[string, string]>
    unindexed: string[]
  }
  error: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
  publication?: Publication | null
}

export interface ChatSessionData {
  intent?: "new" | { mode: "chat"; id: string }
}
