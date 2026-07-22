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
    const collapseSidebarLabel = locale.startsWith("zh") ? "收起侧边栏" : "Collapse sidebar"
    const expandSidebarLabel = locale.startsWith("zh") ? "展开侧边栏" : "Expand sidebar"
    // NOTE: 这里必须继续使用 Quartz 的相对链接生成规则。
    // 之前 chats 页标题/入口跳转异常，核心原因就是写死了绝对路径。
    // 如果未来调整 chats 路由，优先检查这里和 chat.inline.ts 里的导航逻辑是否一致。
    const chatsHref = resolveRelative(props.fileData.slug!, "chats" as FullSlug)

    return (
      <div class="chat-shell" data-proxy-url={opts.proxyUrl} data-chats-path={chatsHref}>
        <button
          type="button"
          class="chat-sidebar-toggle"
          data-sidebar-toggle
          data-collapse-label={collapseSidebarLabel}
          data-expand-label={expandSidebarLabel}
          aria-controls="chat-page-sidebar"
          aria-expanded="true"
          aria-label={collapseSidebarLabel}
          title={collapseSidebarLabel}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <polyline class="chat-sidebar-toggle-chevron" points="15 8 11 12 15 16" />
          </svg>
        </button>
        <aside
          id="chat-page-sidebar"
          class="chats-sidebar chat-page-sidebar"
          data-proxy-url={opts.proxyUrl}
          data-chats-path={chatsHref}
        >
          <div class="chats-sidebar-top">
            <div class="chats-record-heading">
              <span>研究记录</span>
              <h2>问题记录</h2>
            </div>
            <button
              type="button"
              class="new-chat-button"
              data-new-chat
              aria-label={strings.newChat}
            >
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
              <span>新建问题</span>
            </button>
          </div>
          <div class="chats-history-panel">
            <div class="chats-header">
              <span>按最近活动排序</span>
            </div>
            <div class="chats-history">
              <div class="chats-empty-state">{strings.emptyHistory}</div>
            </div>
          </div>
          <details class="ingests-panel">
            <summary class="ingests-summary">
              <span>临时上传状态</span>
            </summary>
            <div class="ingests-list">
              <div class="ingests-empty-state">暂无上传任务</div>
            </div>
          </details>
          <template id="template-chat-item">
            <a class="chat-history-item" href="#" data-chat-id="">
              <div class="chat-item-title"></div>
              <div class="chat-item-preview"></div>
            </a>
          </template>
        </aside>
        <div class="chat-page" data-proxy-url={opts.proxyUrl}>
          <header class="chat-workbench-header">
            <div>
              <span>知识研究工作区</span>
              <h1>知识问答</h1>
            </div>
            <p>范围：全部已发布知识</p>
          </header>
          <div class="chat-stage">
            <div class="chat-messages" id="chat-messages">
              {/* Messages rendered dynamically by chat.inline.ts */}
            </div>
          </div>
          <div class="chat-input-wrap">
            <div class="chat-input-card">
              <label class="chat-input-label" for="chat-input-box">
                继续追问
              </label>
              <div class="chat-input-area">
                <button
                  type="button"
                  class="chat-attach-button"
                  aria-label="临时上传资料"
                  title="临时上传资料；完整任务请在后续入库中心查看"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
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
            <p class="chat-input-note">回答基于已发布知识生成，请通过引用依据核对关键结论。</p>
          </div>
          <template id="template-message-user">
            <div class="message message-user">
              <div class="message-document-label">问题</div>
              <div class="message-content"></div>
            </div>
          </template>
          <template id="template-message-assistant">
            <div class="message message-assistant">
              <div class="message-document-label">答复</div>
              <div class="message-body">
                <div class="message-document-meta">
                  <span>研究备忘录</span>
                  <small>基于已发布知识</small>
                </div>
                <div class="message-content"></div>
                <div class="message-actions">
                  <button
                    type="button"
                    class="message-action-button message-copy-button"
                    aria-label="Copy answer"
                    title="Copy answer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.9"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="3" ry="3" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span class="message-action-label">复制回答</span>
                  </button>
                  <button
                    type="button"
                    class="message-action-button message-synthesis-button"
                    aria-label="Save as Synthesis"
                    title="Save as Synthesis"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.9"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      <path d="M12 11v6" />
                      <path d="M9 14h6" />
                    </svg>
                    <span class="message-action-label">保存为 Synthesis</span>
                  </button>
                </div>
                <div class="message-loading">{strings.loading}</div>
              </div>
            </div>
          </template>
        </div>
        <aside class="chat-evidence" aria-labelledby="chat-evidence-title" data-chat-evidence>
          <header>
            <div>
              <span>出处</span>
              <h2 id="chat-evidence-title">引用依据</h2>
            </div>
            <strong data-evidence-count>0</strong>
          </header>
          <div class="chat-evidence-list" data-evidence-list>
            <div class="chat-evidence-empty">
              提交问题后，这里会列出回答返回的来源与相关知识页面。
            </div>
          </div>
          <p class="chat-evidence-scope">当前范围：全部已发布 Wiki 页面</p>
        </aside>
      </div>
    )
  }

  ChatPage.css = style
  ChatPage.afterDOMLoaded = script
  return ChatPage
}) satisfies QuartzComponentConstructor
