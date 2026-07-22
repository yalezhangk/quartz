import assert from "node:assert/strict"
import test from "node:test"
import type { IngestJobResponse } from "../../types"
import {
  getIngestMetrics,
  getIngestResultSummary,
  getIngestStatusMeta,
  sortIngestJobs,
  wikiPathToHref,
} from "./ingest-model"

function createJob(overrides: Partial<IngestJobResponse> = {}): IngestJobResponse {
  return {
    job_id: "job-1",
    status: "queued",
    original_filename: "sample.pdf",
    source_path: "uploads/sample.pdf",
    created_pages: [],
    updated_pages: [],
    contradictions: [],
    validation: { broken_links: [], unindexed: [] },
    error: null,
    created_at: "2026-07-22T08:00:00Z",
    started_at: null,
    finished_at: null,
    ...overrides,
  }
}

test("status metadata only describes backend statuses", () => {
  assert.equal(getIngestStatusMeta("running").label, "正在处理")
  assert.match(getIngestStatusMeta("running").description, /未提供阶段或百分比/)
  assert.equal(getIngestStatusMeta("succeeded").code, "S")
})

test("metrics count real job states", () => {
  const metrics = getIngestMetrics([
    createJob({ status: "queued" }),
    createJob({ status: "running" }),
    createJob({ status: "failed" }),
    createJob({ status: "succeeded" }),
    createJob({ job_id: "job-5", status: "succeeded" }),
  ])

  assert.deepEqual(metrics, { queued: 1, running: 1, failed: 1, waitingPublish: 2 })
})

test("success summary uses page counts", () => {
  const summary = getIngestResultSummary(
    createJob({ status: "succeeded", created_pages: ["a.md", "b.md"], updated_pages: ["c.md"] }),
  )
  assert.equal(summary, "新增 2 页 · 更新 1 页")
})

test("jobs sort newest first and wiki paths become site links", () => {
  const older = createJob({ job_id: "older", created_at: "2026-07-21T08:00:00Z" })
  const newer = createJob({ job_id: "newer", created_at: "2026-07-22T08:00:00Z" })

  assert.deepEqual(sortIngestJobs([older, newer]).map((job) => job.job_id), ["newer", "older"])
  assert.equal(wikiPathToHref("wiki/sources/测试 文档.md"), "/sources/%E6%B5%8B%E8%AF%95%20%E6%96%87%E6%A1%A3")
})
