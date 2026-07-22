import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import ChatPageBody, { type ChatPageOptions } from "./ChatPage"
import IngestPage from "./IngestPage"

export default ((opts?: Partial<ChatPageOptions>) => {
  const ChatPage = ChatPageBody(opts)
  const IngestPageBody = IngestPage({ proxyUrl: opts?.proxyUrl })

  const WorkspacePage: QuartzComponent = (props: QuartzComponentProps) => {
    const slug = String(props.fileData.slug ?? "")
    return slug === "ingest" ? IngestPageBody(props) : ChatPage(props)
  }

  WorkspacePage.css = `${ChatPage.css ?? ""}\n${IngestPageBody.css ?? ""}`
  WorkspacePage.afterDOMLoaded = `(() => {\n${ChatPage.afterDOMLoaded ?? ""}\n})();\n(() => {\n${IngestPageBody.afterDOMLoaded ?? ""}\n})();`
  return WorkspacePage
}) satisfies QuartzComponentConstructor
