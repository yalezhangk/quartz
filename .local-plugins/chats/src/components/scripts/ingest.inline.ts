import type { IngestJobResponse, IngestJobStatus, PublishStatusResponse } from "../../types"
import {
  getIngestJob,
  getPublishStatus,
  listIngestJobs,
  requestPublish,
  uploadIngestDocument,
} from "../../api/chatApi"
import {
  getIngestMetrics,
  getIngestResultSummary,
  getIngestStatusMeta,
  sortIngestJobs,
  wikiPathToHref,
} from "./ingest-model"

let cleanupIngestPage: (() => void) | undefined
const DEFAULT_INGEST_POLL_INTERVAL_MS = 30_000

function getIngestPollIntervalMs(page: HTMLElement): number {
  const value = Number(page.dataset.ingestPollIntervalMs)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_INGEST_POLL_INTERVAL_MS
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (text !== undefined) element.textContent = text
  return element
}

function getValidation(job: IngestJobResponse) {
  return {
    brokenLinks: job.validation?.broken_links ?? [],
    unindexed: job.validation?.unindexed ?? [],
  }
}

function setupIngestPage(page: HTMLElement): () => void {
  const proxyUrl = page.dataset.proxyUrl || "/api"
  const pollIntervalMs = getIngestPollIntervalMs(page)
  const list = page.querySelector<HTMLElement>("[data-ingest-list]")
  const detail = page.querySelector<HTMLElement>("[data-ingest-detail]")
  const fileInput = page.querySelector<HTMLInputElement>("[data-ingest-file-input]")
  const dropzone = page.querySelector<HTMLElement>("[data-ingest-dropzone]")
  const uploadStatus = page.querySelector<HTMLElement>("[data-ingest-upload-status]")
  const filter = page.querySelector<HTMLSelectElement>("[data-ingest-filter]")
  const refreshButtons = page.querySelectorAll<HTMLButtonElement>("[data-ingest-refresh]")
  const publishTitle = page.querySelector<HTMLElement>("[data-publish-title]")
  const publishSummary = page.querySelector<HTMLElement>("[data-publish-summary]")
  const publishButton = page.querySelector<HTMLButtonElement>("[data-publish-now]")

  if (!list || !detail || !fileInput || !dropzone || !uploadStatus || !filter) return () => {}

  let jobs: IngestJobResponse[] = []
  let selectedJobId: string | null = null
  let disposed = false
  const pollTimers = new Map<string, number>()
  const listeners: Array<() => void> = []

  const listen = <T extends EventTarget>(
    target: T,
    event: string,
    handler: EventListenerOrEventListenerObject,
  ) => {
    target.addEventListener(event, handler)
    listeners.push(() => target.removeEventListener(event, handler))
  }

  const upsertJob = (job: IngestJobResponse) => {
    const index = jobs.findIndex((item) => item.job_id === job.job_id)
    if (index >= 0) jobs[index] = job
    else jobs.push(job)
    jobs = sortIngestJobs(jobs)
  }

  const renderMetrics = () => {
    const metrics = getIngestMetrics(jobs)
    Object.entries(metrics).forEach(([key, value]) => {
      const node = page.querySelector<HTMLElement>(`[data-ingest-count="${key}"]`)
      if (node) node.textContent = String(value)
    })
  }

  const renderPublish = (status: PublishStatusResponse) => {
    if (!publishTitle || !publishSummary || !publishButton) return
    const active = status.active_job
    if (active?.status === "running") {
      publishTitle.textContent = "Quartz 正在构建并发布"
      publishSummary.textContent = `本批次包含 ${active.change_count} 项变更；完成前继续提供上一版站点。`
      publishButton.disabled = true
      return
    }
    if (active?.status === "queued") {
      publishTitle.textContent = "知识已写入，等待 Quartz 发布"
      publishSummary.textContent = `待发布 ${status.pending_change_count} 项变更；预计 ${formatDate(active.scheduled_at)} 开始构建。`
      publishButton.disabled = false
      return
    }
    if (status.last_successful_job) {
      publishTitle.textContent = "Quartz 已发布最新版本"
      publishSummary.textContent = `最近发布时间：${formatDate(status.last_successful_job.published_at)}。新的入库或 Synthesis 会自动进入下一批。`
    } else {
      publishTitle.textContent = "暂无待发布的知识变更"
      publishSummary.textContent = "可手动重建当前 Wiki，或等待新的入库任务完成。"
    }
    publishButton.disabled = false
  }

  const appendResultList = (
    container: HTMLElement,
    title: string,
    entries: string[],
    options?: { links?: boolean; emptyText?: string },
  ) => {
    const section = createElement("section", "ingest-detail-section")
    section.append(createElement("h3", undefined, title))
    if (entries.length === 0) {
      section.append(createElement("p", "ingest-detail-none", options?.emptyText || "未报告相关项"))
    } else {
      const resultList = createElement("ul")
      entries.forEach((entry) => {
        const item = createElement("li")
        if (options?.links) {
          const anchor = createElement("a", undefined, entry)
          anchor.href = wikiPathToHref(entry)
          item.append(anchor)
        } else item.textContent = entry
        resultList.append(item)
      })
      section.append(resultList)
    }
    container.append(section)
  }

  const renderDetail = (job: IngestJobResponse) => {
    detail.replaceChildren()
    const meta = getIngestStatusMeta(job.status)
    const validation = getValidation(job)
    const header = createElement("header", "ingest-detail-header")
    const status = createElement("span", `ingest-status is-${job.status}`)
    status.append(createElement("b", undefined, meta.code), document.createTextNode(meta.label))
    header.append(status, createElement("p", undefined, `JOB / ${job.job_id}`))
    const title = createElement("h2", undefined, job.original_filename)
    title.id = "ingest-detail-title"
    detail.append(header, title)

    const notice = createElement("p", `ingest-detail-notice is-${job.status}`)
    if (job.status === "failed" && job.error) notice.textContent = job.error
    else if (job.publication?.status === "published") notice.textContent = "知识已写入并已发布到 Quartz 站点。"
    else if (job.publication?.status === "running") notice.textContent = "知识已写入，Quartz 正在构建发布版本。"
    else if (job.publication?.status === "failed") notice.textContent = job.publication.error || "知识已写入，但最近一次 Quartz 发布失败。"
    else notice.textContent = meta.description
    detail.append(notice)

    const facts = createElement("dl", "ingest-detail-facts")
    ;[
      ["提交时间", formatDate(job.created_at)],
      ["开始时间", formatDate(job.started_at)],
      ["完成时间", formatDate(job.finished_at)],
      ["源文件", job.source_path || "—"],
    ].forEach(([label, value]) => {
      facts.append(createElement("dt", undefined, label), createElement("dd", undefined, value))
    })
    detail.append(facts)

    appendResultList(detail, `新增页面 · ${job.created_pages?.length ?? 0}`, job.created_pages ?? [], {
      links: true,
      emptyText: "没有新增页面",
    })
    appendResultList(detail, `更新页面 · ${job.updated_pages?.length ?? 0}`, job.updated_pages ?? [], {
      links: true,
      emptyText: "没有更新页面",
    })
    appendResultList(detail, `矛盾项 · ${job.contradictions?.length ?? 0}`, job.contradictions ?? [], {
      emptyText: "未报告矛盾项",
    })
    appendResultList(
      detail,
      `断链 · ${validation.brokenLinks.length}`,
      validation.brokenLinks.map(([source, target]) => `${source} → ${target}`),
      { emptyText: "未报告断链" },
    )
    appendResultList(detail, `未索引 · ${validation.unindexed.length}`, validation.unindexed, {
      emptyText: "未报告未索引页面",
    })
  }

  const schedulePoll = (job: IngestJobResponse) => {
    const publicationPending = ["pending", "running"].includes(job.publication?.status || "")
    if (disposed || (!["queued", "running"].includes(job.status) && !publicationPending) || pollTimers.has(job.job_id)) return
    const timer = window.setTimeout(async () => {
      pollTimers.delete(job.job_id)
      if (disposed) return
      try {
        const updated = await getIngestJob(proxyUrl, job.job_id)
        upsertJob(updated)
        renderList()
        if (selectedJobId === updated.job_id) renderDetail(updated)
        schedulePoll(updated)
      } catch {
        if (!disposed) schedulePoll(job)
      }
    }, pollIntervalMs)
    pollTimers.set(job.job_id, timer)
  }

  const selectJob = async (jobId: string) => {
    selectedJobId = jobId
    renderList()
    const cached = jobs.find((job) => job.job_id === jobId)
    if (cached) renderDetail(cached)
    try {
      const latest = await getIngestJob(proxyUrl, jobId)
      if (disposed) return
      upsertJob(latest)
      renderList()
      if (selectedJobId === jobId) renderDetail(latest)
      schedulePoll(latest)
    } catch (error) {
      if (!cached && selectedJobId === jobId) {
        detail.replaceChildren(createElement("p", "ingest-error", `无法读取任务详情：${getErrorMessage(error)}`))
      }
    }
  }

  const renderList = () => {
    renderMetrics()
    const visible = filter.value === "all" ? jobs : jobs.filter((job) => job.status === filter.value)
    list.replaceChildren()
    if (visible.length === 0) {
      list.append(createElement("p", "ingest-empty", jobs.length ? "当前筛选条件下没有任务。" : "暂无入库任务。"))
      return
    }

    visible.forEach((job) => {
      const meta = getIngestStatusMeta(job.status)
      const button = createElement("button", `ingest-job${selectedJobId === job.job_id ? " is-selected" : ""}`)
      button.type = "button"
      button.dataset.jobId = job.job_id
      button.setAttribute("aria-pressed", selectedJobId === job.job_id ? "true" : "false")
      const status = createElement("span", `ingest-status is-${job.status}`)
      status.append(createElement("b", undefined, meta.code), document.createTextNode(meta.label))
      const identity = createElement("span", "ingest-job-identity")
      identity.append(createElement("strong", undefined, job.original_filename), createElement("small", undefined, getIngestResultSummary(job)))
      button.append(status, identity, createElement("time", undefined, formatDate(job.created_at)))
      button.addEventListener("click", () => void selectJob(job.job_id))
      list.append(button)
      schedulePoll(job)
    })
  }

  const loadJobs = async () => {
    refreshButtons.forEach((button) => (button.disabled = true))
    try {
      jobs = sortIngestJobs(await listIngestJobs(proxyUrl, 20))
      if (disposed) return
      renderList()
      if (selectedJobId) {
        const selected = jobs.find((job) => job.job_id === selectedJobId)
        if (selected) renderDetail(selected)
      }
      const publishStatus = await getPublishStatus(proxyUrl)
      if (!disposed) renderPublish(publishStatus)
    } catch (error) {
      if (!disposed) {
        list.replaceChildren(createElement("p", "ingest-error", `任务读取失败：${getErrorMessage(error)}`))
      }
    } finally {
      refreshButtons.forEach((button) => (button.disabled = false))
    }
  }

  const loadPublish = async () => {
    try {
      renderPublish(await getPublishStatus(proxyUrl))
    } catch (error) {
      if (publishTitle && publishSummary) {
        publishTitle.textContent = "无法读取发布状态"
        publishSummary.textContent = getErrorMessage(error)
      }
    }
  }

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return
    fileInput.disabled = true
    uploadStatus.classList.remove("is-error")
    try {
      for (const [index, file] of files.entries()) {
        uploadStatus.textContent = `正在提交 ${index + 1}/${files.length}：${file.name}`
        const job = await uploadIngestDocument(proxyUrl, file)
        if (disposed) return
        upsertJob(job)
        selectedJobId = job.job_id
        renderList()
        renderDetail(job)
        schedulePoll(job)
      }
      uploadStatus.textContent = `${files.length} 个文件已创建任务，可在台账中继续跟踪。`
    } catch (error) {
      uploadStatus.textContent = `提交失败：${getErrorMessage(error)}`
      uploadStatus.classList.add("is-error")
    } finally {
      fileInput.disabled = false
      fileInput.value = ""
    }
  }

  listen(filter, "change", renderList)
  refreshButtons.forEach((button) => listen(button, "click", () => void loadJobs()))
  if (publishButton) {
    listen(publishButton, "click", () => {
      publishButton.disabled = true
      void requestPublish(proxyUrl)
        .then((job) => {
          if (publishSummary) publishSummary.textContent = `发布任务已提交：${job.job_id}`
          return loadPublish()
        })
        .catch((error) => {
          if (publishSummary) {
            const prefix = (error as { status?: number }).status === 401 ? "需要发布权限：" : "发布请求失败："
            publishSummary.textContent = `${prefix}${getErrorMessage(error)}`
          }
        })
        .finally(() => {
          if (!disposed) void loadPublish()
        })
    })
  }
  listen(fileInput, "change", () => void uploadFiles(Array.from(fileInput.files ?? [])))
  ;["dragenter", "dragover"].forEach((event) =>
    listen(dropzone, event, (rawEvent) => {
      const event = rawEvent as DragEvent
      event.preventDefault()
      dropzone.classList.add("is-dragging")
    }),
  )
  ;["dragleave", "drop"].forEach((event) =>
    listen(dropzone, event, (rawEvent) => {
      const dragEvent = rawEvent as DragEvent
      dragEvent.preventDefault()
      dropzone.classList.remove("is-dragging")
      if (event === "drop") void uploadFiles(Array.from(dragEvent.dataTransfer?.files ?? []))
    }),
  )

  void loadJobs()
  void loadPublish()
  return () => {
    disposed = true
    pollTimers.forEach((timer) => window.clearTimeout(timer))
    listeners.forEach((remove) => remove())
  }
}

function initializeIngestPage() {
  cleanupIngestPage?.()
  cleanupIngestPage = undefined
  const page = document.querySelector<HTMLElement>("[data-ingest-page]")
  if (page) cleanupIngestPage = setupIngestPage(page)
}

document.addEventListener("nav", initializeIngestPage)
document.addEventListener("DOMContentLoaded", initializeIngestPage)
