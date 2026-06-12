import type {
  QuartzPageTypePlugin,
  PageMatcher,
  FullSlug,
  VirtualPage,
  GlobalConfiguration,
  QuartzComponentConstructor,
} from "@quartz-community/types"
import ChatPageBody, { type ChatPageOptions } from "./components/ChatPage"
import { i18n } from "./i18n"

export interface ChatPageTypeOptions {
  title?: string
  proxyUrl?: string
}

const chatMatcher: PageMatcher = ({ slug }) => {
  return slug === "chats" || slug.startsWith("chats/")
}

const createChatPageBody = (opts?: Partial<ChatPageOptions>): QuartzComponentConstructor => {
  return (bodyOpts?: Partial<ChatPageOptions>) => ChatPageBody({ ...opts, ...bodyOpts })
}

export const ChatPageType: QuartzPageTypePlugin<ChatPageTypeOptions> = (opts) => ({
  name: "ChatPageType",
  priority: 10,
  match: chatMatcher,
  generate({ cfg }: { cfg: GlobalConfiguration }) {
    const locale = cfg?.locale ?? "en-US"
    const title = opts?.title ?? i18n(locale).title
    const virtualPages: VirtualPage[] = [
      {
        slug: "chats" as unknown as FullSlug,
        title,
        data: {
          unlisted: true,
        },
      },
    ]
    return virtualPages
  },
  layout: "chats",
  frame: "default",
  body: createChatPageBody({
    proxyUrl: opts?.proxyUrl,
  }),
})
