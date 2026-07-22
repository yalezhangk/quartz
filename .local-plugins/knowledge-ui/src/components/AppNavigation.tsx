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
  icon: "home" | "library" | "chat" | "ingest" | "graph" | "quality" | "settings"
  target: string
  active: (slug: string) => boolean
}

function getAreaLabel(slug: string): string {
  if (slug === "index") return "首页"
  if (slug === "library") return "知识库"
  if (slug === "chats" || slug.startsWith("chats/")) return "知识问答"
  if (slug === "ingest") return "文档入库"
  if (slug === "quality") return "知识质量"
  if (slug === "settings") return "系统设置"
  if (slug === "graph" || slug.startsWith("graph/")) return "知识图谱"
  return "知识正文"
}

function NavigationIcon({ name }: { name: NavigationItem["icon"] }) {
  const common = {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.55",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }

  if (name === "home") {
    return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-7h6v7" /></svg>
  }
  if (name === "library") {
    return <svg {...common}><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
  }
  if (name === "chat") {
    return <span class="app-question-mark">?</span>
  }
  if (name === "ingest") {
    return <svg {...common}><path d="M12 3v12" /><path d="m8 7 4-4 4 4" /><path d="M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /></svg>
  }
  if (name === "graph") {
    return <svg {...common}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 7.2 7.6 3.6M8.2 16.8l7.6-3.6M6 8.5v7" /></svg>
  }
  if (name === "quality") {
    return <svg {...common}><path d="m5 12 4 4L19 5" /></svg>
  }
  return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.3 2.3-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.3-2.3.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.3-2.3.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3.5h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.3 2.3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" /></svg>
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
  const healthCard = document.querySelector("[data-platform-health-card]")
  const healthCardDetail = document.querySelector("[data-platform-health-detail]")
  if (health instanceof HTMLElement) {
    fetch("/api/health", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        health.textContent = "后端可用"
        health.classList.add("is-healthy")
        if (healthCard instanceof HTMLElement) {
          healthCard.textContent = "系统运行正常"
          healthCard.classList.add("is-healthy")
        }
        if (healthCardDetail instanceof HTMLElement) healthCardDetail.textContent = "后端健康检查已通过"
      })
      .catch(() => {
        health.textContent = "后端不可用"
        health.classList.add("is-unavailable")
        if (healthCard instanceof HTMLElement) {
          healthCard.textContent = "需要检查系统"
          healthCard.classList.add("is-unavailable")
        }
        if (healthCardDetail instanceof HTMLElement) healthCardDetail.textContent = "无法连接 /api/health"
      })
  }
})
`

const navigationItems: NavigationItem[] = [
  { label: "首页", icon: "home", target: "index", active: (slug) => slug === "index" },
  {
    label: "知识库",
    icon: "library",
    target: "library",
    active: (slug) =>
      slug === "library" || /^(sources|entities|concepts|syntheses)(\/|$)/.test(slug),
  },
  {
    label: "知识问答",
    icon: "chat",
    target: "chats",
    active: (slug) => slug === "chats" || slug.startsWith("chats/"),
  },
  {
    label: "文档入库",
    icon: "ingest",
    target: "ingest",
    active: (slug) => slug === "ingest",
  },
  {
    label: "知识图谱",
    icon: "graph",
    target: "graph",
    active: (slug) => slug === "graph" || slug.startsWith("graph/"),
  },
  { label: "知识质量", icon: "quality", target: "quality", active: (slug) => slug === "quality" },
]

const managementItems: NavigationItem[] = [
  { label: "系统设置", icon: "settings", target: "settings", active: (slug) => slug === "settings" },
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
            MKT
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
            const href = resolveRelative(currentSlug as FullSlug, item.target as FullSlug)
            return (
              <a
                class={`app-navigation-item${active ? " is-active" : ""}`}
                href={href}
                aria-current={active ? "page" : undefined}
              >
                <span class="app-navigation-icon"><NavigationIcon name={item.icon} /></span>
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>
        <div class="app-sidebar-footer">
          <div class="app-management">
            <p class="app-navigation-label">管理</p>
            <nav class="app-navigation-items" aria-label="系统管理">
              {managementItems.map((item) => {
                const active = item.active(currentSlug)
                const href = resolveRelative(currentSlug as FullSlug, item.target as FullSlug)
                return (
                  <a class={`app-navigation-item${active ? " is-active" : ""}`} href={href} aria-current={active ? "page" : undefined}>
                    <span class="app-navigation-icon"><NavigationIcon name={item.icon} /></span>
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </nav>
          </div>
          <div class="app-index-status" aria-live="polite">
            <span class="app-index-status-title" data-platform-health-card>系统检查中</span>
            <strong>{objectCount.toLocaleString("zh-CN")} 个知识对象</strong>
            <small data-platform-health-detail>正在连接后端健康检查</small>
          </div>
        </div>
      </div>
    )
  }

  AppNavigation.afterDOMLoaded = navigationScript
  return AppNavigation
}) satisfies QuartzComponentConstructor
