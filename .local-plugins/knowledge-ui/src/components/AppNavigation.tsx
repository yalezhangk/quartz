import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"
import { getKnowledgeObjects } from "../knowledge"

interface NavigationItem {
  label: string
  code: string
  target?: string
  phase?: string
  active: (slug: string) => boolean
}

function getAreaLabel(slug: string): string {
  if (slug === "index") return "首页"
  if (slug === "library") return "知识库"
  if (slug === "chats" || slug.startsWith("chats/")) return "知识问答"
  if (slug === "ingest") return "文档入库"
  if (slug === "quality") return "知识质量"
  if (slug === "graph" || slug.startsWith("graph/")) return "知识图谱"
  return "知识正文"
}

const navigationScript = `
document.addEventListener("nav", () => {
  const mainContent = document.querySelector("#quartz-body > .center")
  if (mainContent instanceof HTMLElement) mainContent.id = "main-content"

  const topbar = document.querySelector("[data-app-topbar]")
  if (!(topbar instanceof HTMLElement) || topbar.dataset.bound === "true") return
  topbar.dataset.bound = "true"

  const searchTrigger = topbar.querySelector("[data-app-search]")
  if (searchTrigger instanceof HTMLButtonElement) {
    searchTrigger.addEventListener("click", () => {
      const quartzSearch = document.querySelector(".search > .search-button")
      if (quartzSearch instanceof HTMLButtonElement) quartzSearch.click()
    })
  }

  const copyTrigger = topbar.querySelector("[data-copy-page-link]")
  if (copyTrigger instanceof HTMLButtonElement) {
    copyTrigger.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        copyTrigger.textContent = "链接已复制"
      } catch {
        copyTrigger.textContent = "复制失败"
      }
      window.setTimeout(() => { copyTrigger.textContent = "复制链接" }, 1600)
    })
  }

  const health = topbar.querySelector("[data-platform-health]")
  if (health instanceof HTMLElement) {
    fetch("/api/health", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        health.textContent = "后端可用"
        health.classList.add("is-healthy")
      })
      .catch(() => {
        health.textContent = "后端不可用"
        health.classList.add("is-unavailable")
      })
  }
})
`

const navigationItems: NavigationItem[] = [
  { label: "首页", code: "01", target: "index", active: (slug) => slug === "index" },
  {
    label: "知识库",
    code: "02",
    target: "library",
    active: (slug) =>
      slug === "library" || /^(sources|entities|concepts|syntheses)(\/|$)/.test(slug),
  },
  {
    label: "知识问答",
    code: "03",
    target: "chats",
    active: (slug) => slug === "chats" || slug.startsWith("chats/"),
  },
  {
    label: "文档入库",
    code: "04",
    target: "ingest",
    active: (slug) => slug === "ingest",
  },
  {
    label: "知识图谱",
    code: "05",
    target: "graph",
    active: (slug) => slug === "graph" || slug.startsWith("graph/"),
  },
]

export default (() => {
  const AppNavigation: QuartzComponent = (props: QuartzComponentProps) => {
    const currentSlug = String(props.fileData.slug ?? "index")
    const objects = getKnowledgeObjects(props.allFiles)
    const currentObject = objects.find((object) => object.slug === currentSlug)
    const areaLabel = getAreaLabel(currentSlug)
    const pageTitle =
      currentObject?.title ??
      (typeof props.fileData.frontmatter?.title === "string"
        ? props.fileData.frontmatter.title
        : areaLabel)
    const homeHref = resolveRelative(currentSlug as FullSlug, "index" as FullSlug)
    const chatsHref = resolveRelative(currentSlug as FullSlug, "chats" as FullSlug)
    const graphHref = resolveRelative(currentSlug as FullSlug, "graph" as FullSlug)
    const objectCount = objects.length

    return (
      <div class="app-navigation">
        <a class="app-skip-link" href="#main-content">
          跳到主要内容
        </a>
        <header class="app-topbar" data-app-topbar>
          <div class="app-breadcrumb" aria-label="当前位置">
            <strong>{areaLabel}</strong>
            {pageTitle !== areaLabel && <span aria-hidden="true">/</span>}
            {pageTitle !== areaLabel && <span title={pageTitle}>{pageTitle}</span>}
          </div>
          <button type="button" class="app-topbar-search" data-app-search>
            <span>全局搜索</span>
            <kbd>Ctrl K</kbd>
          </button>
          {currentObject && (
            <div class="app-page-actions" aria-label="当前知识页面操作">
              <a href={chatsHref}>知识问答</a>
              <button type="button" data-copy-page-link>
                复制链接
              </button>
              <a href={graphHref}>查看图谱</a>
            </div>
          )}
          <span class="app-health-status" data-platform-health aria-live="polite">
            后端检查中
          </span>
        </header>
        <a class="app-brand" href={homeHref} aria-label="中压-市场部 样本知识库首页">
          <span class="app-brand-mark" aria-hidden="true">
            MK
          </span>
          <span class="app-brand-copy">
            <strong>
              中压-市场部
              <br />
              样本知识库
            </strong>
            <small>MKT / TECHNICAL ARCHIVE</small>
          </span>
        </a>
        <p class="app-navigation-label">主要功能</p>
        <nav class="app-navigation-items" aria-label="产品主导航">
          {navigationItems.map((item) => {
            const active = item.active(currentSlug)
            if (!item.target) {
              return (
                <span class="app-navigation-item is-disabled" aria-disabled="true">
                  <span class="app-navigation-code">{item.code}</span>
                  <span>{item.label}</span>
                  <small>{item.phase}</small>
                </span>
              )
            }

            const href = resolveRelative(currentSlug as FullSlug, item.target as FullSlug)
            return (
              <a
                class={`app-navigation-item${active ? " is-active" : ""}`}
                href={href}
                aria-current={active ? "page" : undefined}
              >
                <span class="app-navigation-code">{item.code}</span>
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>
        <div class="app-index-status">
          <span>STATIC INDEX</span>
          <strong>{objectCount.toLocaleString("zh-CN")} 个知识对象</strong>
          <small>运行状态需通过后端检查</small>
        </div>
      </div>
    )
  }

  AppNavigation.afterDOMLoaded = navigationScript
  return AppNavigation
}) satisfies QuartzComponentConstructor
