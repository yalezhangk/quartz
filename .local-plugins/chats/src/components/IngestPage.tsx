import type { QuartzComponent, QuartzComponentConstructor } from "@quartz-community/types"
// @ts-expect-error - inline script loaded as text by esbuild
import script from "./scripts/ingest.inline.ts"
import style from "./styles/ingest.scss"

export interface IngestPageOptions {
  proxyUrl: string
}

const defaultOptions: IngestPageOptions = { proxyUrl: "/api" }

export default ((userOpts?: Partial<IngestPageOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const IngestPage: QuartzComponent = () => (
    <main class="ingest-page" data-ingest-page data-proxy-url={opts.proxyUrl}>
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
          <h2 id="ingest-upload-title">提交资料</h2>
          <p>将文件拖到此处，或从本机选择。多个文件会依次创建独立任务。</p>
          <p class="ingest-upload-note">支持格式与大小以 wiki-backend 当前校验规则为准。</p>
        </div>
        <label class="ingest-file-action" for="ingest-file-input">选择文件</label>
        <input id="ingest-file-input" type="file" multiple data-ingest-file-input />
        <p class="ingest-upload-status" data-ingest-upload-status aria-live="polite">
          尚未选择文件
        </p>
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
          <h2 id="ingest-publish-title">Quartz 构建尚未接入安全发布 API</h2>
          <span>
            入库成功只表示知识文件已写入。页面与 <code>static/contentIndex.json</code>
            需要由运维人员重新执行 Quartz build 后更新。
          </span>
        </div>
        <button type="button" disabled title="当前没有可用的安全发布 API">
          构建并发布
        </button>
      </section>
    </main>
  )

  IngestPage.css = style
  IngestPage.afterDOMLoaded = script
  return IngestPage
}) satisfies QuartzComponentConstructor
