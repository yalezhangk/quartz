import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"
import { getKnowledgeObjects, getKnowledgeQualitySummary, type KnowledgeObject } from "../knowledge"

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
    <section class="quality-issue-group">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <strong>{count}</strong>
      </header>
      {objects.length > 0 ? (
        <div class="quality-issue-list">
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
        <p class="quality-issue-empty">当前构建未发现此类元数据缺口。</p>
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
    const ingestHref = resolveRelative(currentSlug, "ingest" as FullSlug)

    return (
      <main class="knowledge-quality">
        <header class="knowledge-quality-header">
          <div>
            <p>构建期可验证范围</p>
            <h1>知识质量</h1>
            <span>检查当前静态索引中的元数据完整性；断链、矛盾和入库验证以真实任务结果为准。</span>
          </div>
          <a href={ingestHref}>查看入库验证</a>
        </header>

        <section class="quality-summary" aria-label="知识质量概览">
          <div>
            <span>已索引对象</span>
            <strong>{summary.total}</strong>
            <small>本次 Quartz 构建</small>
          </div>
          <div>
            <span>受影响对象</span>
            <strong>{summary.affectedObjects}</strong>
            <small>至少有一项元数据缺口</small>
          </div>
          <div>
            <span>断链与矛盾</span>
            <strong>—</strong>
            <small>静态索引未执行此项检查</small>
          </div>
          <div>
            <span>发布状态</span>
            <strong>—</strong>
            <small>需通过发布流程确认</small>
          </div>
        </section>

        <section class="quality-boundary" aria-labelledby="quality-boundary-title">
          <div>
            <p>检查边界</p>
            <h2 id="quality-boundary-title">本页不计算虚假的健康分数</h2>
          </div>
          <dl>
            <div>
              <dt>标题与对象类型</dt>
              <dd class="is-checked">已检查</dd>
            </div>
            <div>
              <dt>摘要、标签、更新时间</dt>
              <dd class="is-checked">已检查</dd>
            </div>
            <div>
              <dt>断链、矛盾、未索引</dt>
              <dd>查看具体 Ingest 任务</dd>
            </div>
            <div>
              <dt>Quartz 是否已发布</dt>
              <dd>静态页面无法自行判断</dd>
            </div>
          </dl>
        </section>

        <div class="quality-issues" id="metadata-gaps">
          <QualityIssueGroup
            title="缺少摘要"
            count={summary.missingDescriptions}
            description="对象没有可用于目录和搜索结果的 description。"
            objects={missingDescriptions}
            currentSlug={currentSlug}
          />
          <QualityIssueGroup
            title="缺少标签"
            count={summary.missingTags}
            description="对象尚未提供可用于主题聚合的 tags。"
            objects={missingTags}
            currentSlug={currentSlug}
          />
          <QualityIssueGroup
            title="更新时间未知"
            count={summary.missingDates}
            description="frontmatter 和构建数据中都没有可确认的更新时间。"
            objects={missingDates}
            currentSlug={currentSlug}
          />
        </div>
      </main>
    )
  }

  return QualityPage
}) satisfies QuartzComponentConstructor
