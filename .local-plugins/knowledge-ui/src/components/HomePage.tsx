import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"
import {
  getKnowledgeObjects,
  getKnowledgeQualitySummary,
  getTopTags,
  type KnowledgeObject,
  type KnowledgeObjectType,
} from "../knowledge"

const TYPE_META: Record<
  KnowledgeObjectType,
  { label: string; pluralLabel: string; order: number }
> = {
  source: { label: "来源资料", pluralLabel: "Sources", order: 1 },
  entity: { label: "知识实体", pluralLabel: "Entities", order: 2 },
  concept: { label: "核心概念", pluralLabel: "Concepts", order: 3 },
  synthesis: {
    label: "专题分析",
    pluralLabel: "Syntheses",
    order: 4,
  },
}

function formatDate(date: Date | null, includeYear: boolean = true): string {
  if (!date) return "更新时间未知"
  return new Intl.DateTimeFormat("zh-CN", {
    ...(includeYear ? { year: "numeric" } : {}),
    month: "long",
    day: "numeric",
  }).format(date)
}

function sortByUpdatedAt(objects: KnowledgeObject[]): KnowledgeObject[] {
  return [...objects].sort((left, right) => {
    return (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0)
  })
}

const homeScript = `
document.addEventListener("nav", () => {
  const form = document.querySelector("[data-knowledge-search]")
  if (!(form instanceof HTMLFormElement) || form.dataset.bound === "true") return
  form.dataset.bound = "true"

  const input = form.querySelector("input")
  form.addEventListener("submit", (event) => {
    event.preventDefault()
    if (!(input instanceof HTMLInputElement)) return
    const query = input.value.trim()
    const searchButton = document.querySelector(".search > .search-button")
    if (!(searchButton instanceof HTMLButtonElement)) return
    searchButton.click()
    window.setTimeout(() => {
      const searchInput = document.querySelector(".search-container.active .search-bar")
      if (!(searchInput instanceof HTMLInputElement)) return
      searchInput.value = query
      searchInput.dispatchEvent(new Event("input", { bubbles: true }))
      searchInput.focus()
    }, 0)
  })

  for (const suggestion of form.closest(".knowledge-home")?.querySelectorAll("[data-topic]") ?? []) {
    if (!(suggestion instanceof HTMLButtonElement)) continue
    suggestion.addEventListener("click", () => {
      if (!(input instanceof HTMLInputElement)) return
      input.value = suggestion.dataset.topic ?? suggestion.textContent?.trim() ?? ""
      input.focus()
    })
  }
})
`

export default (() => {
  const HomePage: QuartzComponent = (props: QuartzComponentProps) => {
    const currentSlug = String(props.fileData.slug ?? "index") as FullSlug
    const objects = getKnowledgeObjects(props.allFiles)
    const latestObjects = sortByUpdatedAt(objects).slice(0, 6)
    const latestDate = latestObjects[0]?.updatedAt ?? null
    const qualitySummary = getKnowledgeQualitySummary(objects)
    const topTags = getTopTags(objects)
    const chatsHref = resolveRelative(currentSlug, "chats" as FullSlug)
    const sourcesHref = resolveRelative(currentSlug, "sources" as FullSlug)
    const qualityHref = resolveRelative(currentSlug, "quality" as FullSlug)
    const ingestHref = resolveRelative(currentSlug, "ingest" as FullSlug)

    const typeCounts = (Object.keys(TYPE_META) as KnowledgeObjectType[])
      .sort((left, right) => TYPE_META[left].order - TYPE_META[right].order)
      .map((type) => ({
        type,
        count: objects.filter((object) => object.type === type).length,
        code: objects.find((object) => object.type === type)?.code ?? "---",
        ...TYPE_META[type],
      }))

    return (
      <main class="knowledge-home">
        <header class="knowledge-home-header">
          <p class="knowledge-home-updated">资料索引更新至 {formatDate(latestDate)}</p>
          <h1>中压市场部知识库</h1>
          <p class="knowledge-home-intro">
            检索产品、技术参数、标准与设备关系；复杂问题可基于已发布资料形成带出处的研究答复。
          </p>
          <div class="knowledge-home-actions">
            <form class="knowledge-search" data-knowledge-search role="search">
              <label for="knowledge-home-query">查找资料</label>
              <input
                id="knowledge-home-query"
                name="query"
                type="search"
                autocomplete="off"
                placeholder="输入产品、参数、标准或概念"
              />
              <button type="submit">打开搜索</button>
            </form>
            <a class="knowledge-ask-link" href={chatsHref}>
              进入知识问答 <span aria-hidden="true">→</span>
            </a>
          </div>
          {topTags.length > 0 && (
            <div class="knowledge-topics" aria-label="常用主题">
              <span>常用主题</span>
              {topTags.map((tag) => (
                <button type="button" data-topic={tag}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </header>

        <section class="knowledge-register" aria-labelledby="knowledge-overview-title">
          <div class="knowledge-section-heading">
            <div>
              <p>构建期索引</p>
              <h2 id="knowledge-overview-title">知识概览</h2>
            </div>
            <span>共 {objects.length.toLocaleString("zh-CN")} 个对象</span>
          </div>
          <div class="knowledge-register-grid">
            {typeCounts.map(({ type, code, label, pluralLabel, count }) => (
              <a
                class={`knowledge-register-cell type-${type}`}
                href={`${resolveRelative(currentSlug, "library" as FullSlug)}?type=${type}`}
                data-router-ignore
              >
                <span class="knowledge-type-code">{code}</span>
                <span>
                  <small>{pluralLabel}</small>
                  <strong>{label}</strong>
                </span>
                <b>{count.toLocaleString("zh-CN")}</b>
              </a>
            ))}
          </div>
        </section>

        <div class="knowledge-home-grid">
          <section class="knowledge-updates" aria-labelledby="knowledge-updates-title">
            <div class="knowledge-section-heading">
              <div>
                <p>按真实更新时间排序</p>
                <h2 id="knowledge-updates-title">最近更新</h2>
              </div>
              <a href={sourcesHref}>进入资料目录 →</a>
            </div>
            {latestObjects.length > 0 ? (
              <div class="knowledge-update-list">
                {latestObjects.map((object) => (
                  <a
                    class={`knowledge-update-row type-${object.type}`}
                    href={resolveRelative(currentSlug, object.slug as FullSlug)}
                  >
                    <span class="knowledge-type-code">{object.code}</span>
                    <span class="knowledge-update-copy">
                      <strong>{object.title}</strong>
                      <small>{object.description}</small>
                    </span>
                    <span class="knowledge-update-meta">
                      <em>{TYPE_META[object.type].label}</em>
                      <time datetime={object.updatedAt?.toISOString()}>
                        {formatDate(object.updatedAt, false)}
                      </time>
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p class="knowledge-empty-state">
                当前构建未发现 Source、Entity、Concept 或 Synthesis 页面。
              </p>
            )}
          </section>

          <aside class="knowledge-home-side" aria-label="知识库关注项与活动">
            <section class="knowledge-attention" aria-labelledby="knowledge-attention-title">
              <div class="knowledge-section-heading">
                <div>
                  <p>可执行检查</p>
                  <h2 id="knowledge-attention-title">需要关注</h2>
                </div>
                <span>{qualitySummary.affectedObjects} 项</span>
              </div>
              <a href={`${qualityHref}#metadata-gaps`} class="knowledge-attention-row">
                <span class="knowledge-attention-code">META</span>
                <span>
                  <strong>
                    {qualitySummary.affectedObjects > 0
                      ? `${qualitySummary.affectedObjects} 个对象存在元数据缺口`
                      : "未发现元数据缺口"}
                  </strong>
                  <small>摘要、标签和更新时间按本次构建数据检查。</small>
                </span>
              </a>
              <a href={ingestHref} class="knowledge-attention-row is-unknown">
                <span class="knowledge-attention-code">PUB</span>
                <span>
                  <strong>待发布变更数量未知</strong>
                  <small>进入文档入库查看真实任务；静态索引不推断发布状态。</small>
                </span>
              </a>
            </section>

            <section class="knowledge-activity" aria-labelledby="knowledge-activity-title">
              <div class="knowledge-section-heading">
                <div>
                  <p>构建可见记录</p>
                  <h2 id="knowledge-activity-title">最近活动</h2>
                </div>
              </div>
              <div class="knowledge-activity-list">
                {latestObjects.slice(0, 4).map((object) => (
                  <a href={resolveRelative(currentSlug, object.slug as FullSlug)}>
                    <span class="knowledge-type-code">{object.code}</span>
                    <span>
                      <strong>{object.title}</strong>
                      <small>{formatDate(object.updatedAt, false)}更新</small>
                    </span>
                  </a>
                ))}
              </div>
              <p class="knowledge-activity-note">
                此处只显示当前 Quartz 构建能够确认的知识更新时间，不伪装为实时操作日志。
              </p>
            </section>
          </aside>
        </div>
      </main>
    )
  }

  HomePage.afterDOMLoaded = homeScript
  return HomePage
}) satisfies QuartzComponentConstructor
