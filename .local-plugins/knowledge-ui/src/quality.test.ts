import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { parseQualitySnapshotResponse, qualityCheckStateLabel } from "./quality"

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/quality-latest.json", import.meta.url), "utf8"),
) as unknown

test("quality fixture conforms to the frontend snapshot contract", () => {
  const snapshot = parseQualitySnapshotResponse(fixture)
  assert.ok(snapshot)
  assert.equal(snapshot.snapshot.coverage.scope, "sampled")
  assert.equal(snapshot.consistency.findings[0]?.evidence.length, 2)
})

test("quality snapshot parser accepts structure findings", () => {
  const payload = JSON.parse(JSON.stringify(fixture)) as {
    structural: { findings: Array<Record<string, unknown>> }
  }
  payload.structural.findings.push({
    id: "structure-example-1",
    category: "structure",
    severity: "warning",
    status: "needs_review",
    title: "失效 WikiLink：sources/example",
    summary: "修复或移除失效链接。",
    pages: ["sources/example"],
    evidence: [],
    recommendation: "补充有效目标页面。",
    report_section: "结构完整性",
  })

  assert.ok(parseQualitySnapshotResponse(payload))
})

test("quality snapshot parser rejects incomplete API data", () => {
  assert.equal(parseQualitySnapshotResponse({ snapshot: {} }), null)
})

test("quality check labels cover every explicit snapshot state", () => {
  assert.equal(qualityCheckStateLabel("available"), "可用")
  assert.equal(qualityCheckStateLabel("stale"), "报告已过期")
  assert.equal(qualityCheckStateLabel("missing"), "报告缺失")
  assert.equal(qualityCheckStateLabel("parse_failed"), "报告无法解析")
  assert.equal(qualityCheckStateLabel("not_run"), "尚未运行")
  assert.equal(qualityCheckStateLabel("incomplete"), "报告不完整")
})
