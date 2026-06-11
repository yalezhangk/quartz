interface ChatsStrings {
  title: string
  newChat: string
  placeholder: string
  send: string
  loading: string
  emptyHistory: string
  newChatGreeting: string
}

const localeStrings: Record<string, ChatsStrings> = {
  "en-US": {
    title: "Chats",
    newChat: "New Chat",
    placeholder: "Type a message...",
    send: "Send",
    loading: "AI is thinking...",
    emptyHistory: "No conversations yet",
    newChatGreeting: "Start a new conversation!",
  },
  "zh-CN": {
    title: "聊天",
    newChat: "新对话",
    placeholder: "输入消息...",
    send: "发送",
    loading: "AI 正在思考...",
    emptyHistory: "暂无聊天记录",
    newChatGreeting: "开始一段新对话！",
  },
}

export function i18n(locale: string): ChatsStrings {
  return localeStrings[locale] ?? localeStrings["en-US"]
}
