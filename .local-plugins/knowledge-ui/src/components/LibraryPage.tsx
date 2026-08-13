import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"
import { getKnowledgeObjects, type KnowledgeObject, type KnowledgeObjectType } from "../knowledge"
import { getSourceReference } from "./SourceReference"

const TYPE_META: Record<KnowledgeObjectType, { label: string; pluralLabel: string }> = {
  source: { label: "来源", pluralLabel: "Sources" },
  entity: { label: "实体", pluralLabel: "Entities" },
  concept: { label: "概念", pluralLabel: "Concepts" },
  synthesis: { label: "分析", pluralLabel: "Syntheses" },
}

const TYPE_ORDER: KnowledgeObjectType[] = ["source", "entity", "concept", "synthesis"]

function formatDate(date: Date | null): string {
  if (!date) return "更新时间未知"
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function sortByUpdatedAt(objects: KnowledgeObject[]): KnowledgeObject[] {
  return [...objects].sort((left, right) => {
    const dateDifference = (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0)
    return dateDifference || left.title.localeCompare(right.title, "zh-CN")
  })
}

const libraryScript = `
document.addEventListener("nav", () => {
  const root = document.querySelector("[data-knowledge-library]")
  if (!(root instanceof HTMLElement) || root.dataset.bound === "true") return
  root.dataset.bound = "true"

  const rows = Array.from(root.querySelectorAll("[data-library-row]"))
  const tabs = Array.from(root.querySelectorAll("[data-library-type]"))
  const searchInput = root.querySelector("[data-library-search]")
  const sortSelect = root.querySelector("[data-library-sort]")
  const resultCount = root.querySelector("[data-library-result-count]")
  const resultList = root.querySelector("[data-library-results]")
  const emptyState = root.querySelector("[data-library-empty]")
  const clearButtons = Array.from(root.querySelectorAll("[data-library-clear]"))

  if (!(searchInput instanceof HTMLInputElement)) return
  if (!(sortSelect instanceof HTMLSelectElement)) return
  if (!(resultList instanceof HTMLElement)) return

  const validTypes = new Set(["all", "source", "entity", "concept", "synthesis"])
  const validSorts = new Set(["updated", "title", "type"])
  const params = new URLSearchParams(window.location.search)
  let selectedType = params.get("type") ?? "all"
  let selectedSort = params.get("sort") ?? "updated"
  if (!validTypes.has(selectedType)) selectedType = "all"
  if (!validSorts.has(selectedSort)) selectedSort = "updated"
  searchInput.value = params.get("q") ?? ""
  sortSelect.value = selectedSort

  const compareRows = (left, right) => {
    if (!(left instanceof HTMLElement) || !(right instanceof HTMLElement)) return 0
    if (selectedSort === "title") {
      return (left.dataset.title ?? "").localeCompare(right.dataset.title ?? "", "zh-CN")
    }
    if (selectedSort === "type") {
      return (left.dataset.typeOrder ?? "").localeCompare(right.dataset.typeOrder ?? "") ||
        (left.dataset.title ?? "").localeCompare(right.dataset.title ?? "", "zh-CN")
    }
    return Number(right.dataset.updated ?? 0) - Number(left.dataset.updated ?? 0) ||
      (left.dataset.title ?? "").localeCompare(right.dataset.title ?? "", "zh-CN")
  }

  const updateUrl = () => {
    const nextParams = new URLSearchParams()
    const query = searchInput.value.trim()
    if (selectedType !== "all") nextParams.set("type", selectedType)
    if (query) nextParams.set("q", query)
    if (selectedSort !== "updated") nextParams.set("sort", selectedSort)
    const queryString = nextParams.toString()
    window.history.replaceState({}, "", window.location.pathname + (queryString ? "?" + queryString : ""))
  }

  const render = () => {
    const query = searchInput.value.trim().toLocaleLowerCase("zh-CN")
    let visibleCount = 0

    rows.sort(compareRows).forEach((row) => {
      if (!(row instanceof HTMLElement)) return
      const matchesType = selectedType === "all" || row.dataset.type === selectedType
      const matchesQuery = !query || (row.dataset.search ?? "").includes(query)
      const visible = matchesType && matchesQuery
      row.hidden = !visible
      if (visible) visibleCount += 1
      resultList.append(row)
    })

    tabs.forEach((tab) => {
      if (!(tab instanceof HTMLButtonElement)) return
      const active = tab.dataset.libraryType === selectedType
      tab.classList.toggle("is-active", active)
      tab.setAttribute("aria-selected", String(active))
      tab.tabIndex = active ? 0 : -1
    })

    if (resultCount) resultCount.textContent = String(visibleCount)
    if (emptyState instanceof HTMLElement) emptyState.hidden = visibleCount !== 0
    resultList.hidden = visibleCount === 0
    updateUrl()
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (!(tab instanceof HTMLButtonElement)) return
      selectedType = tab.dataset.libraryType ?? "all"
      render()
    })
    tab.addEventListener("keydown", (event) => {
      if (!(event instanceof KeyboardEvent) || !(tab instanceof HTMLButtonElement)) return
      const currentIndex = tabs.indexOf(tab)
      let nextIndex = currentIndex
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length
      if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
      if (event.key === "Home") nextIndex = 0
      if (event.key === "End") nextIndex = tabs.length - 1
      if (nextIndex === currentIndex) return
      event.preventDefault()
      const nextTab = tabs[nextIndex]
      if (!(nextTab instanceof HTMLButtonElement)) return
      selectedType = nextTab.dataset.libraryType ?? "all"
      render()
      nextTab.focus()
    })
  })
  searchInput.addEventListener("input", render)
  sortSelect.addEventListener("change", () => {
    selectedSort = sortSelect.value
    render()
  })
  clearButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedType = "all"
      selectedSort = "updated"
      searchInput.value = ""
      sortSelect.value = selectedSort
      render()
      searchInput.focus()
    })
  })

  render()
})
`

export default (() => {
  const LibraryPage: QuartzComponent = (props: QuartzComponentProps) => {
    const currentSlug = "library" as FullSlug
    const objects = sortByUpdatedAt(getKnowledgeObjects(props.allFiles))
    const counts = Object.fromEntries(
      TYPE_ORDER.map((type) => [type, objects.filter((object) => object.type === type).length]),
    ) as Record<KnowledgeObjectType, number>

    return (
      <main class="knowledge-library" data-knowledge-library>
        <header class="knowledge-library-header">
          <div>
            <p>{objects.length.toLocaleString("zh-CN")} 个可检索对象</p>
            <h1>知识库</h1>
            <span>按来源资料、知识实体、核心概念和专题分析浏览已发布内容。</span>
          </div>
          <a class="knowledge-library-ask" href={resolveRelative(currentSlug, "chats" as FullSlug)}>
            询问知识库
          </a>
        </header>

        <section class="knowledge-library-controls" aria-label="知识库筛选与排序">
          <div class="knowledge-library-tabs" role="tablist" aria-label="知识对象类型">
            <button type="button" class="is-active" data-library-type="all" role="tab">
              全部 <span>{objects.length}</span>
            </button>
            {TYPE_ORDER.map((type) => (
              <button type="button" data-library-type={type} role="tab" tabindex={-1}>
                {TYPE_META[type].label} <span>{counts[type]}</span>
              </button>
            ))}
          </div>
          <div class="knowledge-library-tools">
            <label>
              <span>当前结果搜索</span>
              <input
                type="search"
                placeholder="标题、摘要或标签"
                autocomplete="off"
                data-library-search
              />
            </label>
            <label>
              <span>排序</span>
              <select data-library-sort>
                <option value="updated">最近更新</option>
                <option value="title">标题 A–Z</option>
                <option value="type">对象类型</option>
              </select>
            </label>
          </div>
        </section>

        <section
          class="knowledge-library-register"
          aria-labelledby="knowledge-library-results-title"
        >
          <header>
            <div>
              <h2 id="knowledge-library-results-title">资产清单</h2>
              <p aria-live="polite">
                当前显示 <strong data-library-result-count>{objects.length}</strong> 个知识对象
              </p>
            </div>
            <button type="button" data-library-clear>
              清除筛选
            </button>
          </header>

          <div class="knowledge-library-columns" aria-hidden="true">
            <span>类型</span>
            <span>标题与摘要</span>
            <span>标签</span>
            <span>更新时间</span>
          </div>

          <div class="knowledge-library-results" data-library-results>
            {objects.map((object) => {
              const href = resolveRelative(currentSlug, object.slug as FullSlug)
              const timestamp = object.updatedAt?.getTime() ?? 0
              const sourceReference = getSourceReference(object)
              const searchText = [
                object.title,
                object.description,
                object.code,
                ...object.tags,
                sourceReference?.searchText,
              ]
                .join(" ")
                .toLocaleLowerCase("zh-CN")

              return (
                <a
                  class={`knowledge-library-row is-${object.type}`}
                  href={href}
                  data-library-row
                  data-type={object.type}
                  data-type-order={String(TYPE_ORDER.indexOf(object.type))}
                  data-title={object.title}
                  data-updated={String(timestamp)}
                  data-search={searchText}
                >
                  <span class="knowledge-library-code">{object.code}</span>
                  <span class="knowledge-library-copy">
                    <strong>{object.title}</strong>
                    {sourceReference && (
                      <span class="knowledge-library-source-reference">{sourceReference.marker}</span>
                    )}
                    <small>{object.description}</small>
                  </span>
                  <span class="knowledge-library-tags">
                    {object.tags.length > 0 ? (
                      object.tags.slice(0, 3).map((tag) => <em>{tag}</em>)
                    ) : (
                      <em>未标注标签</em>
                    )}
                  </span>
                  <time datetime={object.updatedAt?.toISOString()}>
                    {formatDate(object.updatedAt)}
                  </time>
                </a>
              )
            })}
          </div>

          <div class="knowledge-library-empty" data-library-empty hidden>
            <span aria-hidden="true">∅</span>
            <h2>当前条件下没有知识对象</h2>
            <p>筛选条件会保留。可以修改关键词或清除全部条件后重新浏览。</p>
            <button type="button" data-library-clear>
              清除全部条件
            </button>
          </div>
        </section>
      </main>
    )
  }

  LibraryPage.afterDOMLoaded = libraryScript
  return LibraryPage
}) satisfies QuartzComponentConstructor
