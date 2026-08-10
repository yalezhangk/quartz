import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"

const settingsSections = [
  {
    title: "Prompt",
    description: "问答、入库和知识综合提示模板由 wiki-backend 的受控文件提供。",
    status: "后端文件管理",
    items: ["问答提示模板", "文档入库模板", "Agent 指令副本"],
  },
  {
    title: "发布",
    description: "Ingest 与 Synthesis 变更由 wiki-backend 合并构建，也可在入库页手动触发。",
    status: "自动合并发布",
    items: ["待发布变更", "Quartz 发布任务", "ECS 短缓存"],
  },
  {
    title: "用户与审计",
    description: "当前页面不提供用户、角色或配置变更管理接口。",
    status: "未提供管理接口",
    items: ["访问角色", "操作审计", "配置变更记录"],
  },
]

const modelUsageSections = [
  {
    key: "fast",
    title: "快速问答模型",
    description: "FAST，由服务端内部调用，不受知识问答 Chat 的模型选择影响。",
    items: [
      "知识问答：关键词与图谱未找到足够页面时选择相关页面",
      "无状态问答：选择相关页面",
      "知识图谱：启用关系推断时分析页面关系",
    ],
  },
  {
    key: "main",
    title: "深度分析模型",
    description: "MAIN，由服务端内部调用，不受知识问答 Chat 的模型选择影响。",
    items: [
      "无状态问答：生成最终答案",
      "文档入库：抽取内容并生成知识页面",
      "知识质量：执行语义分析与生成巡检报告",
    ],
  },
]

const settingsScript = `
document.addEventListener("nav", () => {
  const container = document.querySelector("[data-model-profiles-overview]")
  const internalModelNodes = document.querySelectorAll("[data-internal-model]")
  if (!(container instanceof HTMLElement) || container.dataset.bound === "true") return
  container.dataset.bound = "true"

  const renderFailure = () => {
    container.replaceChildren()
    const message = document.createElement("p")
    message.className = "settings-model-profiles-empty"
    message.textContent = "暂时无法读取服务端模型配置；请确认后端服务可用后刷新页面。"
    container.appendChild(message)
    for (const node of internalModelNodes) {
      if (node instanceof HTMLElement) {
        node.textContent = "暂时无法读取服务端配置"
      }
    }
  }

  fetch("/api/model-profiles/overview", { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status))
      return response.json()
    })
    .then((overview) => {
      if (!overview || !Array.isArray(overview.chat_models)) throw new Error("invalid payload")
      container.replaceChildren()
      const validProfiles = overview.chat_models.filter((profile) =>
        profile &&
        typeof profile.label === "string",
      )
      if (validProfiles.length === 0) {
        const message = document.createElement("p")
        message.className = "settings-model-profiles-empty"
        message.textContent = "当前没有已启用的回答模型。"
        container.appendChild(message)
      }

      for (const profile of validProfiles) {
        const row = document.createElement("article")
        row.className = "settings-model-profile"
        const name = document.createElement("strong")
        name.textContent = profile.label
        row.appendChild(name)
        container.appendChild(row)
      }

      for (const node of internalModelNodes) {
        if (!(node instanceof HTMLElement)) continue
        const model = overview[node.dataset.internalModel + "_model"]
        if (!model || typeof model.provider !== "string" || typeof model.model !== "string") {
          throw new Error("invalid internal model")
        }
        node.textContent = model.provider + " / " + model.model
      }
    })
    .catch(renderFailure)
})
`

export default (() => {
  const SettingsPage: QuartzComponent = (props: QuartzComponentProps) => {
    const currentSlug = "settings"
    const qualityHref = resolveRelative(currentSlug, "quality")
    const ingestHref = resolveRelative(currentSlug, "ingest")

    return (
      <main class="system-settings">
        <header class="system-settings-header">
          <div>
            <p>运行管理</p>
            <h1>系统设置</h1>
            <span>
              配置管理与知识发布分开执行；此页面只呈现可确认的管理边界，不将静态界面伪装成可写入的运行配置。
            </span>
          </div>
          <div class="system-settings-actions">
            <a href={qualityHref}>查看知识质量</a>
            <a href={ingestHref}>进入文档入库</a>
          </div>
        </header>

        <section class="settings-runtime-note" aria-labelledby="settings-runtime-note-title">
          <div>
            <p>当前运行方式</p>
            <h2 id="settings-runtime-note-title">参数由服务端配置，知识变更由发布队列构建</h2>
          </div>
          <p>
            模型与 Prompt 由 `wiki-backend` 的受控配置提供；Ingest 或 Synthesis 成功后会进入 Quartz
            发布队列，发布成功后静态页面和内容索引才会更新。
          </p>
        </section>

        <section class="settings-model-profiles" aria-labelledby="settings-model-profiles-title">
          <header>
            <div>
              <p>只读概览</p>
              <h2 id="settings-model-profiles-title">知识问答模型</h2>
            </div>
            <span>由后端受控档案提供</span>
          </header>
          <p>
            由后端返回知识问答 Chat 当前可选择的模型名称；此页面不允许修改模型服务、凭据、Prompt
            或系统默认配置。
          </p>
          <div class="settings-model-profiles-list" data-model-profiles-overview>
            <p class="settings-model-profiles-empty">正在加载知识问答模型…</p>
          </div>
        </section>

        <div class="settings-section-grid settings-model-usage-grid">
          {modelUsageSections.map((section) => (
            <section class="settings-section">
              <header>
                <div class="settings-model-usage-copy">
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <strong class="settings-internal-model" data-internal-model={section.key}>
                  正在读取服务端配置…
                </strong>
              </header>
              <ul>
                {section.items.map((item) => (
                  <li>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div class="settings-section-grid">
          {settingsSections.map((section) => (
            <section class="settings-section">
              <header>
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <span>{section.status}</span>
              </header>
              <ul>
                {section.items.map((item) => (
                  <li>
                    {item}
                    <span>查看</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p class="settings-boundary">
          模型参数、Prompt 和用户权限没有前端写接口；发布状态和手动发布入口位于文档入库页，
          写操作必须由 `wiki-backend` 和入口层授权控制。
        </p>
      </main>
    )
  }

  SettingsPage.afterDOMLoaded = settingsScript
  return SettingsPage
}) satisfies QuartzComponentConstructor
