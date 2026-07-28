import type { QuartzComponent, QuartzComponentConstructor } from "@quartz-community/types"
// @ts-expect-error - inline script loaded as text by esbuild
import script from "./scripts/ingest.inline.ts"
import style from "./styles/ingest.scss"

export interface IngestPageOptions {
  proxyUrl: string
  ingestPollIntervalMs: number
}

const defaultOptions: IngestPageOptions = {
  proxyUrl: "/api",
  ingestPollIntervalMs: 30_000,
}

export default ((userOpts?: Partial<IngestPageOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const IngestPage: QuartzComponent = () => (
    <main
      class="ingest-page"
      data-ingest-page
      data-proxy-url={opts.proxyUrl}
      data-ingest-poll-interval-ms={opts.ingestPollIntervalMs}
    >
      <header class="ingest-header">
        <div>
          <p class="ingest-eyebrow">资料处理与发布</p>
          <h1>文档入库</h1>
          <p class="ingest-intro">
            提交原始资料，跟踪知识写入结果，并检查发布前的页面与链接状态。
          </p>
        </div>
        <button type="button" class="ingest-refresh" data-ingest-refresh>
          刷新任务
        </button>
      </header>

      <section class="ingest-upload" data-ingest-dropzone aria-labelledby="ingest-upload-title">
        <div class="ingest-upload-index" aria-hidden="true">IN</div>
        <div class="ingest-upload-copy">
          <h2 id="ingest-upload-title">将文件拖放到这里，或选择本地资料</h2>
          <p class="ingest-upload-note">
            支持 Markdown、PDF、DOCX、PPTX、XLSX、HTML、音频等文件格式，Markdown的处理效果最好，单文件最大10MB
          </p>
        </div>
        <label class="ingest-file-action" for="ingest-file-input">选择文件</label>
        <input id="ingest-file-input" type="file" multiple data-ingest-file-input />
        <p class="ingest-upload-status" data-ingest-upload-status aria-live="polite"></p>
      </section>

      <section class="ingest-metrics" aria-label="入库任务概览">
        <div><span>Q / 等待执行</span><strong data-ingest-count="queued">—</strong></div>
        <div><span>R / 正在处理</span><strong data-ingest-count="running">—</strong></div>
        <div><span>F / 处理失败</span><strong data-ingest-count="failed">—</strong></div>
        <div><span>S / 等待发布</span><strong data-ingest-count="waitingPublish">—</strong></div>
      </section>

      <div class="ingest-workspace">
        <section class="ingest-jobs" aria-labelledby="ingest-jobs-title">
          <div class="ingest-section-heading">
            <div>
              <p>任务台账</p>
              <h2 id="ingest-jobs-title">最近 20 项</h2>
            </div>
            <label>
              <span>筛选状态</span>
              <select data-ingest-filter>
                <option value="all">全部状态</option>
                <option value="queued">等待执行</option>
                <option value="running">正在处理</option>
                <option value="succeeded">写入完成</option>
                <option value="failed">处理失败</option>
              </select>
            </label>
          </div>
          <div class="ingest-list" data-ingest-list aria-live="polite">
            <p class="ingest-empty">正在读取任务…</p>
          </div>
        </section>

        <aside class="ingest-detail" data-ingest-detail aria-labelledby="ingest-detail-title">
          <div class="ingest-detail-empty">
            <p>任务检验单</p>
            <h2 id="ingest-detail-title">选择一项任务</h2>
            <span>此处将显示页面变更、冲突与索引校验结果。</span>
          </div>
        </aside>
      </div>

      <section class="ingest-publish" aria-labelledby="ingest-publish-title">
        <div class="ingest-publish-code" aria-hidden="true">PUB</div>
        <div>
          <p>静态站点发布</p>
          <h2 id="ingest-publish-title" data-publish-title>正在读取发布状态…</h2>
          <span data-publish-summary>入库成功只表示知识文件已写入，站点会在合并窗口后自动构建。</span>
        </div>
        <button type="button" data-publish-now title="立即构建并发布当前 Wiki">
          构建并发布
        </button>
      </section>
    </main>
  )

  IngestPage.css = style
  IngestPage.afterDOMLoaded = script
  return IngestPage
}) satisfies QuartzComponentConstructor
