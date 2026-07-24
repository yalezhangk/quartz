import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import ChatPageBody, { type ChatPageOptions } from "./ChatPage"
import IngestPage, { type IngestPageOptions } from "./IngestPage"

type WorkspacePageOptions = Partial<Pick<ChatPageOptions, "proxyUrl" | "ingestPollIntervalMs">>

export default ((opts?: WorkspacePageOptions) => {
  const ChatPage = ChatPageBody(opts)
  const IngestPageBody = IngestPage({
    proxyUrl: opts?.proxyUrl,
    ingestPollIntervalMs: opts?.ingestPollIntervalMs,
  } satisfies Partial<IngestPageOptions>)

  const WorkspacePage: QuartzComponent = (props: QuartzComponentProps) => {
    const slug = String(props.fileData.slug ?? "")
    return slug === "ingest" ? IngestPageBody(props) : ChatPage(props)
  }

  WorkspacePage.css = `${ChatPage.css ?? ""}\n${IngestPageBody.css ?? ""}`
  WorkspacePage.afterDOMLoaded = `(() => {\n${ChatPage.afterDOMLoaded ?? ""}\n})();\n(() => {\n${IngestPageBody.afterDOMLoaded ?? ""}\n})();`
  return WorkspacePage
}) satisfies QuartzComponentConstructor
