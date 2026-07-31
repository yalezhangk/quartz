import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { Window } from "happy-dom"
import { qualityScript } from "./components/scripts/quality.inline"

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/quality-latest.json", import.meta.url), "utf8"),
) as Record<string, unknown>

function cloneFixture(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(fixture)) as Record<string, unknown>
}

function pageMarkup(): string {
  return `
    <main class="knowledge-quality">
      <section data-quality-action-note tabindex="-1" hidden><strong data-quality-action-note-title></strong><p data-quality-action-note-body></p></section>
      <button data-quality-report type="button">查看巡检报告</button><button data-quality-run type="button">运行新一轮检查</button>
      <section data-quality-snapshot aria-busy="true"><strong data-quality-generated-at></strong><small data-quality-generated-detail></small><strong data-quality-coverage></strong><small data-quality-coverage-detail></small><strong data-quality-graph-state></strong><small data-quality-graph-detail></small><strong data-quality-lint-state></strong><small data-quality-lint-detail></small></section>
      <nav><button data-quality-tab="all" type="button"></button><span data-quality-tab-count="all"></span><button data-quality-tab="structure" type="button"></button><span data-quality-tab-count="structure"></span><button data-quality-tab="consistency" type="button"></button><span data-quality-tab-count="consistency"></span><button data-quality-tab="graph" type="button"></button><span data-quality-tab-count="graph"></span><button data-quality-tab="freshness" type="button"></button><span data-quality-tab-count="freshness"></span></nav>
      <section data-quality-section="structure"><strong data-quality-section-count="structure"></strong><table><tbody data-quality-structural></tbody></table><div data-quality-findings="structure"></div></section>
      <section data-quality-section="consistency"><strong data-quality-section-count="consistency"></strong><div data-quality-findings="consistency"></div></section>
      <section data-quality-section="graph"><strong data-quality-section-count="graph"></strong><div data-quality-findings="graph"></div></section>
      <section data-quality-section="freshness"><strong data-quality-section-count="freshness"></strong><div data-quality-recommendations></div></section>
      <section data-quality-metadata>静态 metadata 补充</section>
      <aside data-quality-evidence><span data-quality-evidence-state></span><div data-quality-evidence-body></div></aside>
    </main>
  `
}

async function setupQualityPage(payload: unknown, responseOk: boolean = true) {
  const window = new Window({ url: "http://localhost/quality" })
  const { document } = window
  document.body.innerHTML = pageMarkup()
  const requests: string[] = []
  window.fetch = (async (input: string | URL | Request) => {
    requests.push(String(input))
    return { ok: responseOk, json: async () => payload } as Response
  }) as typeof window.fetch
  window.eval(qualityScript)
  document.dispatchEvent(new window.Event("nav"))
  await new Promise((resolve) => setTimeout(resolve, 0))
  return { window, document, getRequestCount: () => requests.length, requests }
}

test("quality runtime renders fixture evidence and switches the selected finding", async () => {
  const payload = cloneFixture()
  const consistency = payload.consistency as { findings: Array<Record<string, unknown>> }
  const second = JSON.parse(JSON.stringify(consistency.findings[0])) as Record<string, unknown>
  second.id = "consistency-example-2"
  second.title = "第二条示例差异"
  second.evidence = [
    { label: "来源 C", source_label: "示例资料 C", location: "第 3 节", quote: "第二条示例证据。" },
  ]
  consistency.findings.push(second)
  ;(payload.tab_counts as Record<string, number>).consistency = 2

  const { document } = await setupQualityPage(payload)
  assert.equal(document.querySelector("[data-quality-generated-at]")?.textContent, "2026/07/29 10:42")
  assert.equal(document.querySelector("[data-quality-coverage]")?.textContent, "2/2 对象")
  assert.equal(document.querySelector("[data-quality-coverage-detail]")?.textContent, "完整覆盖当前静态索引")
  const findings = document.querySelectorAll<HTMLButtonElement>(".quality-finding")
  assert.equal(findings.length, 2)
  assert.match(document.querySelector("[data-quality-evidence-body]")?.textContent ?? "", /示例证据 A/)

  findings[1]?.click()
  assert.match(document.querySelector("[data-quality-evidence-body]")?.textContent ?? "", /第二条示例证据/)
})

test("quality runtime filters reordered tabs with keyboard navigation and does not bind twice", async () => {
  const { window, document, getRequestCount } = await setupQualityPage(cloneFixture())
  const sectionOrder = Array.from(document.querySelectorAll<HTMLElement>("[data-quality-section]")).map(
    (section) => section.dataset.qualitySection,
  )
  assert.deepEqual(sectionOrder, ["structure", "consistency", "graph", "freshness"])
  const allTab = document.querySelector<HTMLButtonElement>("[data-quality-tab='all']")
  assert.ok(allTab)
  allTab.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))

  const structureTab = document.querySelector<HTMLButtonElement>("[data-quality-tab='structure']")
  assert.equal(structureTab?.getAttribute("aria-selected"), "true")
  assert.equal(document.querySelector<HTMLElement>("[data-quality-section='graph']")?.hidden, true)
  assert.equal(document.activeElement, structureTab)

  document.dispatchEvent(new window.Event("nav"))
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(getRequestCount(), 1)
})

test("quality runtime does not present stale graph data as a current conclusion", async () => {
  const payload = cloneFixture()
  const snapshot = payload.snapshot as { checks: { graph: Record<string, unknown> } }
  snapshot.checks.graph = {
    state: "stale",
    generated_at: "2026-07-01T00:00:00",
    message: "图谱报告早于当前 Wiki。",
  }
  const graph = payload.graph as { findings: Array<Record<string, unknown>> }
  graph.findings = [
    { title: "不应展示的历史图谱结论" },
  ]
  ;(payload.tab_counts as Record<string, number>).graph = 7

  const { document } = await setupQualityPage(payload)
  assert.equal(document.querySelector("[data-quality-tab-count='graph']")?.textContent, "—")
  assert.match(document.querySelector("[data-quality-findings='graph']")?.textContent ?? "", /图谱报告早于当前 Wiki/)
  assert.doesNotMatch(document.querySelector("[data-quality-findings='graph']")?.textContent ?? "", /历史图谱结论/)
})

test("quality runtime safely renders findings without pages, evidence, or recommendations", async () => {
  const payload = cloneFixture()
  const consistency = payload.consistency as { findings: Array<Record<string, unknown>> }
  const finding = consistency.findings[0]
  assert.ok(finding)
  finding.pages = []
  finding.evidence = []
  finding.recommendation = null

  const { document } = await setupQualityPage(payload)
  assert.match(document.querySelector("[data-quality-evidence-body]")?.textContent ?? "", /没有可安全展示的结构化来源证据/)
  assert.match(document.querySelector("[data-quality-evidence-body]")?.textContent ?? "", /未能可靠提取涉及页面/)
  assert.match(document.querySelector("[data-quality-evidence-body]")?.textContent ?? "", /请回到来源资料人工核对/)
})

test("quality report action refreshes the structured snapshot through the existing read API", async () => {
  const { window, document, getRequestCount, requests } = await setupQualityPage(cloneFixture())

  document.querySelector<HTMLButtonElement>("[data-quality-report]")?.click()
  await new Promise((resolve) => window.setTimeout(resolve, 0))

  assert.equal(getRequestCount(), 2)
  assert.deepEqual(requests, ["/api/quality/latest", "/api/quality/latest"])
  assert.match(document.querySelector("[data-quality-action-note]")?.textContent ?? "", /巡检报告已刷新/)
  assert.match(document.querySelector("[data-quality-action-note]")?.textContent ?? "", /原始 Markdown 报告不会向浏览器暴露/)
})

test("quality runtime renders structured Lint findings in the structure section", async () => {
  const payload = cloneFixture()
  const structural = payload.structural as { findings: Array<Record<string, unknown>> }
  structural.findings = [
    {
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
    },
  ]
  ;(payload.tab_counts as Record<string, number>).structure = 1

  const { document } = await setupQualityPage(payload)
  const table = document.querySelector("[data-quality-structural]")?.textContent ?? ""
  assert.match(table, /空页 \/ 过短页/)
  assert.match(table, /索引同步/)
  assert.match(table, /日志覆盖/)
  assert.match(table, /坏链与孤儿页/)
  assert.match(table, /稀疏链接/)
  assert.match(table, /1 条/)
})

test("quality runtime keeps metadata and explains non-writing actions when the API fails", async () => {
  const { document } = await setupQualityPage({}, false)
  assert.match(document.querySelector("[data-quality-snapshot]")?.textContent ?? "", /快照不可用/)
  assert.match(document.querySelector("[data-quality-metadata]")?.textContent ?? "", /静态 metadata 补充/)

  document.querySelector<HTMLButtonElement>("[data-quality-report]")?.click()
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.match(document.querySelector("[data-quality-action-note]")?.textContent ?? "", /巡检报告读取失败/)
  assert.match(document.querySelector("[data-quality-action-note]")?.textContent ?? "", /\/api\/quality\/latest/)

  document.querySelector<HTMLButtonElement>("[data-quality-run]")?.click()
  assert.match(document.querySelector("[data-quality-action-note]")?.textContent ?? "", /没有管理鉴权/)
  assert.match(document.querySelector("[data-quality-action-note]")?.textContent ?? "", /不会创建后台任务/)
})
