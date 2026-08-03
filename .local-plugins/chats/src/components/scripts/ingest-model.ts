import type { IngestJobResponse, IngestJobStatus } from "../../types"

export interface IngestStatusMeta {
  code: string
  label: string
  description: string
}

export interface IngestMetrics {
  queued: number
  running: number
  failed: number
  waitingPublish: number
}

const statusMeta: Record<IngestJobStatus, IngestStatusMeta> = {
  queued: { code: "Q", label: "等待执行", description: "任务已入队，等待处理。" },
  running: {
    code: "R",
    label: "正在处理",
    description: "后端正在处理；当前接口未提供阶段或百分比。",
  },
  succeeded: {
    code: "S",
    label: "写入完成",
    description: "知识已写入，等待 Quartz 发布。",
  },
  failed: { code: "F", label: "处理失败", description: "任务未完成，请查看错误详情。" },
}

export function getIngestStatusMeta(status: IngestJobStatus): IngestStatusMeta {
  return statusMeta[status]
}

export function getIngestTriggerLabel(trigger?: string): string {
  return trigger === "scheduled" ? "定时同步" : "人工上传"
}

export function getIngestMetrics(jobs: IngestJobResponse[]): IngestMetrics {
  return jobs.reduce<IngestMetrics>(
    (metrics, job) => {
      if (job.status === "queued") metrics.queued += 1
      if (job.status === "running") metrics.running += 1
      if (job.status === "failed") metrics.failed += 1
      if (job.status === "succeeded" && job.publication?.status !== "published") metrics.waitingPublish += 1
      return metrics
    },
    { queued: 0, running: 0, failed: 0, waitingPublish: 0 },
  )
}

export function getIngestResultSummary(job: IngestJobResponse): string {
  if (job.status === "failed") return job.error || "后端未提供错误详情"
  if (job.status !== "succeeded") return getIngestStatusMeta(job.status).description

  const created = job.created_pages?.length ?? 0
  const updated = job.updated_pages?.length ?? 0
  const publication = job.publication
  if (publication?.status === "published") return `新增 ${created} 页 · 更新 ${updated} 页 · 已发布`
  if (publication?.status === "running") return `新增 ${created} 页 · 更新 ${updated} 页 · 正在发布`
  if (publication?.status === "failed") return `新增 ${created} 页 · 更新 ${updated} 页 · 发布失败`
  return `新增 ${created} 页 · 更新 ${updated} 页 · 等待发布`
}

export function sortIngestJobs(jobs: IngestJobResponse[]): IngestJobResponse[] {
  return [...jobs].sort(
    (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
  )
}

export function wikiPathToHref(path: string): string {
  const normalized = path
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^wiki\//, "")
    .replace(/\.md$/i, "")
    .replace(/^\/+|\/+$/g, "")

  return `/${normalized
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`
}
