import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"
import { getKnowledgeObjects, getKnowledgeQualitySummary, type KnowledgeObject } from "../knowledge"
import { qualityScript } from "./scripts/quality.inline"

interface QualityIssueGroupProps {
  title: string
  count: number
  description: string
  objects: KnowledgeObject[]
  currentSlug: FullSlug
}

function QualityIssueGroup({
  title,
  count,
  description,
  objects,
  currentSlug,
}: QualityIssueGroupProps) {
  return (
    <section class="quality-metadata-group">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <strong>{count}</strong>
      </header>
      {objects.length > 0 ? (
        <div class="quality-metadata-list">
          {objects.slice(0, 8).map((object) => (
            <a href={resolveRelative(currentSlug, object.slug as FullSlug)}>
              <span class="knowledge-type-code">{object.code}</span>
              <span>
                <strong>{object.title}</strong>
                <small>{object.slug}</small>
              </span>
            </a>
          ))}
          {objects.length > 8 && <p>另有 {objects.length - 8} 项，请在知识库中继续筛选。</p>}
        </div>
      ) : (
        <p class="quality-metadata-empty">当前构建未发现此类元数据缺口。</p>
      )}
    </section>
  )
}

export default (() => {
  const QualityPage: QuartzComponent = (props: QuartzComponentProps) => {
    const currentSlug = "quality" as FullSlug
    const objects = getKnowledgeObjects(props.allFiles)
    const summary = getKnowledgeQualitySummary(objects)
    const missingDescriptions = objects.filter((object) => !object.hasDescription)
    const missingTags = objects.filter((object) => object.tags.length === 0)
    const missingDates = objects.filter((object) => object.updatedAt === null)

    return (
      <main class="knowledge-quality">
        <header class="knowledge-quality-header">
          <div>
            <p>质量巡检快照</p>
            <h1>知识质量</h1>
            <span>
              以最近一次成功的 health、lint 与 graph 巡检为依据；语义发现均需回到来源资料人工确认。
            </span>
          </div>
          <div class="quality-header-actions">
            <button type="button" class="quality-action-secondary" data-quality-report>
              查看巡检报告
            </button>
            <button type="button" class="quality-action-primary" data-quality-run>
              运行新一轮检查
            </button>
          </div>
        </header>

        <section class="quality-action-note" data-quality-action-note aria-live="polite" tabindex={-1} hidden>
          <strong data-quality-action-note-title>质量页说明</strong>
          <p data-quality-action-note-body></p>
        </section>

        <section class="quality-status" aria-label="巡检概览" data-quality-snapshot aria-busy="true">
          <div class="quality-status-item">
            <span class="quality-status-label">报告生成时间</span>
            <strong data-quality-generated-at>正在读取</strong>
            <small data-quality-generated-detail>等待最近质量快照</small>
          </div>
          <div class="quality-status-item">
            <span class="quality-status-label">检查覆盖</span>
            <strong data-quality-coverage>正在读取</strong>
            <small data-quality-coverage-detail>等待最近质量快照</small>
          </div>
          <div class="quality-status-item">
            <span class="quality-status-label">图谱状态</span>
            <strong data-quality-graph-state>正在读取</strong>
            <small data-quality-graph-detail>图谱不会以历史结果代替当前结论</small>
          </div>
          <div class="quality-status-item">
            <span class="quality-status-label">语义巡检</span>
            <strong data-quality-lint-state>正在读取</strong>
            <small data-quality-lint-detail>语义检查范围将在快照中说明</small>
          </div>
        </section>

        <nav class="quality-tabs" aria-label="质量类别" role="tablist">
          <button type="button" class="is-active" data-quality-tab="all" role="tab" aria-selected="true">
            全部发现项 <span data-quality-tab-count="all">—</span>
          </button>
          <button type="button" data-quality-tab="structure" role="tab" aria-selected="false" tabindex={-1}>
            结构完整性 <span data-quality-tab-count="structure">—</span>
          </button>
          <button type="button" data-quality-tab="consistency" role="tab" aria-selected="false" tabindex={-1}>
            内容一致性 <span data-quality-tab-count="consistency">—</span>
          </button>
          <button type="button" data-quality-tab="graph" role="tab" aria-selected="false" tabindex={-1}>
            图谱健康度 <span data-quality-tab-count="graph">—</span>
          </button>
          <button type="button" data-quality-tab="freshness" role="tab" aria-selected="false" tabindex={-1}>
            新鲜度与修复 <span data-quality-tab-count="freshness">—</span>
          </button>
        </nav>

        <div class="quality-layout">
          <div class="quality-stream" aria-live="polite">
            <section class="quality-section" data-quality-section="structure">
              <header class="quality-section-header">
                <div>
                  <p>Health + Lint · 确定性检查</p>
                  <h2>结构完整性</h2>
                  <span>结构结果可复现；本页不会用单一健康分数替代具体检查项。</span>
                </div>
                <strong data-quality-section-count="structure">等待快照</strong>
              </header>
              <table class="quality-check-matrix">
                <thead>
                  <tr>
                    <th>检查项</th>
                    <th>本次结果</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody data-quality-structural>
                  <tr>
                    <td colSpan={3}>正在读取最近结构巡检报告。</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="quality-section" data-quality-section="consistency">
              <header class="quality-section-header">
                <div>
                  <p>Lint · 语义巡检</p>
                  <h2>内容一致性</h2>
                  <span>同一主题在不同资料中的冲突或口径差异，需要人工回到来源资料确认。</span>
                </div>
                <strong data-quality-section-count="consistency">等待快照</strong>
              </header>
              <div class="quality-section-placeholder" data-quality-findings="consistency">
                正在读取最近语义巡检报告。
              </div>
            </section>

            <section class="quality-section" data-quality-section="graph">
              <header class="quality-section-header">
                <div>
                  <p>Graph · 关联韧性</p>
                  <h2>图谱健康度</h2>
                  <span>仅使用与当前 Wiki 同步的图谱结果；过期图谱不会作为当前结论展示。</span>
                </div>
                <strong data-quality-section-count="graph">等待快照</strong>
              </header>
              <div class="quality-section-placeholder" data-quality-findings="graph">
                正在读取最近图谱健康度报告。
              </div>
            </section>

            <section class="quality-section" data-quality-section="freshness">
              <header class="quality-section-header">
                <div>
                  <p>Refresh + Heal · 受控修复</p>
                  <h2>新鲜度与修复</h2>
                  <span>本页仅展示已有来源快照和建议；不会直接运行 refresh 或 heal。</span>
                </div>
                <strong data-quality-section-count="freshness">等待快照</strong>
              </header>
              <div class="quality-section-placeholder" data-quality-recommendations>
                正在读取来源新鲜度快照。
              </div>
            </section>

            <section class="quality-metadata" data-quality-metadata id="metadata-gaps">
              <header class="quality-section-header">
                <div>
                  <p>Quartz · 构建期索引</p>
                  <h2>静态 metadata 补充</h2>
                  <span>
                    统计本次构建中公开展示的 source、entity、concept、synthesis 页面；三类缺口分别计数，同一对象可同时出现。
                  </span>
                </div>
                <strong>{summary.affectedObjects} 项缺口</strong>
              </header>
              <div class="quality-metadata-grid">
                <QualityIssueGroup
                  title="缺少摘要"
                  count={summary.missingDescriptions}
                  description="构建数据和 frontmatter 中均没有非空 description。"
                  objects={missingDescriptions}
                  currentSlug={currentSlug}
                />
                <QualityIssueGroup
                  title="缺少标签"
                  count={summary.missingTags}
                  description="frontmatter 中没有非空 tags 数组。"
                  objects={missingTags}
                  currentSlug={currentSlug}
                />
                <QualityIssueGroup
                  title="更新时间未知"
                  count={summary.missingDates}
                  description="last_updated、modified 和构建记录中均没有可确认的更新时间。"
                  objects={missingDates}
                  currentSlug={currentSlug}
                />
              </div>
            </section>
          </div>

          <aside class="quality-side">
            <section class="quality-evidence-panel" data-quality-evidence aria-live="polite">
              <header class="quality-evidence-header">
                <div>
                  <p>选中发现项</p>
                  <h2>证据对比</h2>
                </div>
                <span data-quality-evidence-state>等待快照</span>
              </header>
              <div class="quality-evidence-empty" data-quality-evidence-body>
                最近质量快照加载后，此处将显示涉及页面、最多两条来源证据与建议核对动作。
              </div>
            </section>
          </aside>
        </div>
      </main>
    )
  }

  QualityPage.afterDOMLoaded = qualityScript
  return QualityPage
}) satisfies QuartzComponentConstructor
