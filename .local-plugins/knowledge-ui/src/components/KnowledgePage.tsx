import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import HomePageBody from "./HomePage"
import LibraryPageBody from "./LibraryPage"
import QualityPageBody from "./QualityPage"

const HomePage = HomePageBody()
const LibraryPage = LibraryPageBody()
const QualityPage = QualityPageBody()

export default (() => {
  const KnowledgePage: QuartzComponent = (props: QuartzComponentProps) => {
    if (props.fileData.slug === "library") return LibraryPage(props)
    if (props.fileData.slug === "quality") return QualityPage(props)
    return HomePage(props)
  }

  KnowledgePage.afterDOMLoaded = [HomePage.afterDOMLoaded, LibraryPage.afterDOMLoaded]
    .filter((script): script is string => typeof script === "string")
    .join("\n")

  return KnowledgePage
}) satisfies QuartzComponentConstructor
