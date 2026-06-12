import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"
import { i18n } from "../i18n"
// @ts-expect-error - inline script loaded as text by esbuild
import script from "./scripts/chat.inline.ts"
import style from "./styles/chat.scss"

export interface ChatPageOptions {
  proxyUrl: string
}

const defaultOptions: ChatPageOptions = {
  // NOTE: 当前后端地址是直接写死到本地开发地址的。
  // 后续若接入正式 wiki-backend、反向代理或多环境配置，优先把它改成可配置项，
  // 不要继续依赖这里的硬编码默认值。
  proxyUrl: "/api",
}

export default ((userOpts?: Partial<ChatPageOptions>) => {
  const opts: ChatPageOptions = { ...defaultOptions, ...userOpts }

  const ChatPage: QuartzComponent = (props: QuartzComponentProps) => {
    const locale = props.cfg?.locale ?? "en-US"
    const strings = i18n(locale)
    // NOTE: 这里必须继续使用 Quartz 的相对链接生成规则。
    // 之前 chats 页标题/入口跳转异常，核心原因就是写死了绝对路径。
    // 如果未来调整 chats 路由，优先检查这里和 chat.inline.ts 里的导航逻辑是否一致。
    const chatsHref = resolveRelative(props.fileData.slug!, "chats" as FullSlug)

    return (
      <div class="chat-shell" data-proxy-url={opts.proxyUrl} data-chats-path={chatsHref}>
        <aside class="chats-sidebar chat-page-sidebar" data-proxy-url={opts.proxyUrl} data-chats-path={chatsHref}>
          <div class="chats-sidebar-top">
            <div class="chats-brand">
              <span class="chats-brand-title">MVC WIKI</span>
            </div>
            <button type="button" class="new-chat-button" data-new-chat aria-label={strings.newChat}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{strings.newChat}</span>
            </button>
          </div>
          <div class="chats-history-panel">
            <div class="chats-header">
              <h2>{strings.title}</h2>
            </div>
            <div class="chats-history">
              <div class="chats-empty-state">{strings.emptyHistory}</div>
            </div>
          </div>
          <template id="template-chat-item">
            <a class="chat-history-item" href="#" data-chat-id="">
              <div class="chat-item-title"></div>
              <div class="chat-item-preview"></div>
            </a>
          </template>
        </aside>
        <div class="chat-page" data-proxy-url={opts.proxyUrl}>
          <div class="chat-stage">
            <div class="chat-hero">
              <h1 class="chat-hero-title">Welcome, how can I help?</h1>
              <p class="chat-hero-subtitle">Ask about your wiki knowledge base, sources, entities, and relationships.</p>
            </div>
            <div class="chat-messages" id="chat-messages">
              {/* Messages rendered dynamically by chat.inline.ts */}
            </div>
          </div>
          <div class="chat-input-wrap">
            <div class="chat-input-card">
              <label class="chat-input-label" for="chat-input-box">Message Wiki Copilot</label>
              <div class="chat-input-area">
                <button type="button" class="chat-attach-button" aria-label="Add attachment" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
                <textarea
                  id="chat-input-box"
                  class="chat-input"
                  placeholder={strings.placeholder}
                  rows={1}
                  aria-label={strings.placeholder}
                />
                <button class="chat-send-button" disabled aria-label={strings.send}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <template id="template-message-user">
            <div class="message message-user">
              <div class="message-content"></div>
            </div>
          </template>
          <template id="template-message-assistant">
            <div class="message message-assistant">
              <div class="message-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M17 17a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4"/></svg>
              </div>
              <div class="message-body">
                <div class="message-content"></div>
                <div class="message-sources"></div>
                <div class="message-actions">
                  <button type="button" class="message-copy-button" aria-label="Copy answer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="3" ry="3" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  </button>
                </div>
                <div class="message-loading">{strings.loading}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    )
  }

  ChatPage.css = style
  ChatPage.afterDOMLoaded = script
  return ChatPage
}) satisfies QuartzComponentConstructor
