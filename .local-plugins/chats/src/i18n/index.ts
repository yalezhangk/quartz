interface ChatsStrings {
  title: string
  newChat: string
  newChatPlaceholder: string
  followUpPlaceholder: string
  newChatInputLabel: string
  followUpInputLabel: string
  send: string
  loading: string
  emptyHistory: string
  untitledChat: string
  historyLoadFailed: string
  historyEyebrow: string
  historyTitle: string
  historySort: string
  workbenchEyebrow: string
  workbenchDescription: string
  newChatGreetingTitle: string
  newChatGreetingDescription: string
  referenceEyebrow: string
  referenceTitle: string
  referenceDescription: string
  inputNote: string
}

const localeStrings: Record<string, ChatsStrings> = {
  "en-US": {
    title: "Chats",
    newChat: "New Chat",
    newChatPlaceholder: "Ask a question to get an answer from the enterprise knowledge base",
    followUpPlaceholder: "Continue the conversation or ask a related question",
    newChatInputLabel: "Start a conversation",
    followUpInputLabel: "Continue the conversation",
    send: "Send",
    loading: "AI is thinking...",
    emptyHistory: "No conversations yet",
    untitledChat: "Untitled Q&A session",
    historyLoadFailed: "Could not load Q&A history",
    historyEyebrow: "Knowledge Q&A",
    historyTitle: "Q&A history",
    historySort: "Recent Q&A",
    workbenchEyebrow: "Enterprise knowledge base",
    workbenchDescription: "Retrieve from the enterprise knowledge base and generate traceable answers",
    newChatGreetingTitle: "Start a knowledge Q&A",
    newChatGreetingDescription:
      "Enter a question you want to look up or analyze. The system will answer based on published enterprise knowledge and provide related knowledge entries and source references.",
    referenceEyebrow: "Reference materials",
    referenceTitle: "Source references",
    referenceDescription: "After you submit a question, related sources and knowledge pages will appear here.",
    inputNote: "Answers are generated from published knowledge. Verify key conclusions using source references.",
  },
  "zh-CN": {
    title: "知识问答",
    newChat: "发起问答",
    newChatPlaceholder: "输入问题，基于企业知识库获取答案",
    followUpPlaceholder: "继续追问，或输入新的相关问题",
    newChatInputLabel: "发起问答",
    followUpInputLabel: "继续追问",
    send: "发送",
    loading: "正在检索并整理知识库内容…",
    emptyHistory: "暂无问答会话",
    untitledChat: "未命名问答会话",
    historyLoadFailed: "问答历史加载失败",
    historyEyebrow: "知识问答",
    historyTitle: "问答历史",
    historySort: "最近问答",
    workbenchEyebrow: "企业知识库",
    workbenchDescription: "基于企业知识库检索并生成可追溯答案",
    newChatGreetingTitle: "发起知识问答",
    newChatGreetingDescription:
      "输入您希望查询或分析的问题。系统将基于已发布的企业知识内容生成回答，并提供相关知识条目和来源依据。",
    referenceEyebrow: "参考资料",
    referenceTitle: "引用来源",
    referenceDescription: "提交问题后，这里会列出回答返回的来源与相关知识条目。",
    inputNote: "回答基于已发布的企业知识内容生成，请通过引用来源核对关键结论。",
  },
}

export function i18n(locale: string): ChatsStrings {
  return localeStrings[locale] ?? localeStrings["en-US"]
}
