import type {
  QuartzPageTypePlugin,
  PageMatcher,
  FullSlug,
  VirtualPage,
  GlobalConfiguration,
  QuartzComponentConstructor,
} from "@quartz-community/types"
import type { ChatPageOptions } from "./components/ChatPage"
import WorkspacePage from "./components/WorkspacePage"
import { i18n } from "./i18n"

export interface ChatPageTypeOptions {
  title?: string
  proxyUrl?: string
}

const workspaceMatcher: PageMatcher = ({ slug }) => {
  return slug === "ingest" || slug === "chats" || slug.startsWith("chats/")
}

const createWorkspacePageBody = (opts?: Partial<ChatPageOptions>): QuartzComponentConstructor => {
  return (bodyOpts?: Partial<ChatPageOptions>) => WorkspacePage({ ...opts, ...bodyOpts })
}

export const ChatPageType: QuartzPageTypePlugin<ChatPageTypeOptions> = (opts) => ({
  name: "ChatPageType",
  priority: 10,
  match: workspaceMatcher,
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
      {
        slug: "ingest" as unknown as FullSlug,
        title: "文档入库",
        data: {
          unlisted: true,
        },
      },
    ]
    return virtualPages
  },
  layout: "workspace",
  frame: "default",
  body: createWorkspacePageBody({
    proxyUrl: opts?.proxyUrl,
  }),
})
