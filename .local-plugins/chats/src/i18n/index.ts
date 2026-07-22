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
    title: "知识问答",
    newChat: "新建问题",
    placeholder: "继续追问，或输入一个需要基于知识库回答的问题…",
    send: "发送",
    loading: "正在检索并整理知识库内容…",
    emptyHistory: "暂无问题记录",
    newChatGreeting: "建立一个新的问题记录",
  },
}

export function i18n(locale: string): ChatsStrings {
  return localeStrings[locale] ?? localeStrings["en-US"]
}
