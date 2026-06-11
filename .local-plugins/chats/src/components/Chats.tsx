import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"
import style from "./styles/chat.scss"

export interface ChatsSidebarOptions {
  title: string
}

const defaultOptions: ChatsSidebarOptions = {
  title: "Chats",
}

export default ((userOpts?: Partial<ChatsSidebarOptions>) => {
  const opts: ChatsSidebarOptions = { ...defaultOptions, ...userOpts }

  const ChatsSidebar: QuartzComponent = (props: QuartzComponentProps) => {
    const displayClass = props.displayClass
    const chatsHref = resolveRelative(props.fileData.slug!, "chats" as FullSlug)

    return (
      <div class={displayClass}>
        <a class="chat-nav-link" href={chatsHref} aria-label={opts.title}>
          {opts.title}
        </a>
      </div>
    )
  }

  ChatsSidebar.css = style
  return ChatsSidebar
}) satisfies QuartzComponentConstructor
