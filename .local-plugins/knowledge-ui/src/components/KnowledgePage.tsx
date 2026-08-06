import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import HomePageBody from "./HomePage"
import LibraryPageBody from "./LibraryPage"
import QualityPageBody from "./QualityPage"
import SettingsPageBody from "./SettingsPage"

const HomePage = HomePageBody()
const LibraryPage = LibraryPageBody()
const QualityPage = QualityPageBody()
const SettingsPage = SettingsPageBody()

export default (() => {
  const KnowledgePage: QuartzComponent = (props: QuartzComponentProps) => {
    if (props.fileData.slug === "library") return LibraryPage(props)
    if (props.fileData.slug === "quality") return QualityPage(props)
    if (props.fileData.slug === "settings") return SettingsPage(props)
    return HomePage(props)
  }

  KnowledgePage.afterDOMLoaded = [
    HomePage.afterDOMLoaded,
    LibraryPage.afterDOMLoaded,
    QualityPage.afterDOMLoaded,
    SettingsPage.afterDOMLoaded,
  ]
    .filter((script): script is string => typeof script === "string")
    .join("\n")

  return KnowledgePage
}) satisfies QuartzComponentConstructor
