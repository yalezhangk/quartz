import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"

const settingsSections = [
  {
    title: "模型",
    description: "选择问答与入库任务使用的模型，并明确其用途与生效范围。",
    status: "由后端管理",
    items: ["快速问答模型", "深度分析模型", "模型服务连接"],
  },
  {
    title: "Prompt",
    description: "维护问答、入库和知识综合使用的提示模板与版本记录。",
    status: "版本化管理",
    items: ["问答提示模板", "文档入库模板", "综合分析模板"],
  },
  {
    title: "发布",
    description: "确认知识变更何时重新构建为可访问的静态站点。",
    status: "需执行构建",
    items: ["待发布变更", "Quartz 构建", "缓存失效策略"],
  },
  {
    title: "用户与审计",
    description: "查看访问权限、关键操作和配置调整的可追溯记录。",
    status: "待接入权限服务",
    items: ["访问角色", "操作审计", "配置变更记录"],
  },
]

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
            <span>配置管理与知识发布分开执行；此页面只呈现可确认的管理边界，不将静态界面伪装成可写入的运行配置。</span>
          </div>
          <div class="system-settings-actions">
            <a href={qualityHref}>查看知识质量</a>
            <a href={ingestHref}>进入文档入库</a>
          </div>
        </header>

        <section class="settings-runtime-note" aria-labelledby="settings-runtime-note-title">
          <div>
            <p>当前运行方式</p>
            <h2 id="settings-runtime-note-title">参数由服务端配置，站点由 Quartz 单独发布</h2>
          </div>
          <p>模型与 Prompt 由 `wiki-backend` 的受控配置提供；文档入库完成后仍需重新构建 Quartz，静态页面和内容索引才会更新。</p>
        </section>

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
                {section.items.map((item) => <li>{item}<span>查看</span></li>)}
              </ul>
            </section>
          ))}
        </div>

        <p class="settings-boundary">写入模型参数、Prompt、发布操作或用户权限需要对应的后端 API 与授权策略；当前静态站点不会直接执行这些变更。</p>
      </main>
    )
  }

  return SettingsPage
}) satisfies QuartzComponentConstructor
