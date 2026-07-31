export const QUALITY_CHECK_STATES = [
  "available",
  "stale",
  "missing",
  "parse_failed",
  "not_run",
  "incomplete",
] as const

export type QualityCheckState = (typeof QUALITY_CHECK_STATES)[number]
export type QualityCategory = "consistency" | "structure" | "graph" | "freshness"

export interface QualityCheck {
  state: QualityCheckState
  generated_at: string | null
  message: string
}

export interface QualityEvidence {
  label: string
  source_label: string
  location: string | null
  quote: string
}

export interface QualityFinding {
  id: string
  category: QualityCategory
  severity: "critical" | "warning" | "info" | "unknown"
  status: "needs_review" | "documented_difference" | "unavailable"
  title: string
  summary: string
  pages: string[]
  evidence: QualityEvidence[]
  recommendation: string | null
  report_section: string
}

export interface QualityStructuralCheck {
  label: string
  state: QualityCheckState
  count: number | null
  detail: string
}

export interface QualitySnapshotResponse {
  snapshot: {
    status: QualityCheckState
    generated_at: string | null
    current_object_count: number
    coverage: { checked_object_count: number; scope: "sampled" | "full" | "unknown" }
    checks: Record<"health" | "lint" | "graph" | "freshness", QualityCheck>
  }
  tab_counts: Record<"all" | QualityCategory, number>
  structural: { checks: QualityStructuralCheck[]; findings: QualityFinding[] }
  consistency: { findings: QualityFinding[] }
  graph: { findings: QualityFinding[] }
  freshness: { recommendations: QualityFinding[] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isCheckState(value: unknown): value is QualityCheckState {
  return typeof value === "string" && QUALITY_CHECK_STATES.includes(value as QualityCheckState)
}

function isQualityCheck(value: unknown): value is QualityCheck {
  return (
    isRecord(value) &&
    isCheckState(value.state) &&
    (typeof value.generated_at === "string" || value.generated_at === null) &&
    typeof value.message === "string"
  )
}

function isQualityEvidence(value: unknown): value is QualityEvidence {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    typeof value.source_label === "string" &&
    (typeof value.location === "string" || value.location === null) &&
    typeof value.quote === "string"
  )
}

function isQualityFinding(value: unknown): value is QualityFinding {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.category === "consistency" || value.category === "structure" || value.category === "graph" || value.category === "freshness") &&
    (value.severity === "critical" || value.severity === "warning" || value.severity === "info" || value.severity === "unknown") &&
    (value.status === "needs_review" || value.status === "documented_difference" || value.status === "unavailable") &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    isStringArray(value.pages) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isQualityEvidence) &&
    (typeof value.recommendation === "string" || value.recommendation === null) &&
    typeof value.report_section === "string"
  )
}

function isQualityStructuralCheck(value: unknown): value is QualityStructuralCheck {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    isCheckState(value.state) &&
    (typeof value.count === "number" || value.count === null) &&
    typeof value.detail === "string"
  )
}

export function parseQualitySnapshotResponse(value: unknown): QualitySnapshotResponse | null {
  if (!isRecord(value) || !isRecord(value.snapshot) || !isRecord(value.snapshot.coverage)) return null

  const { snapshot, tab_counts: tabCounts, structural, consistency, graph, freshness } = value
  const checks = snapshot.checks
  if (
    !isCheckState(snapshot.status) ||
    (typeof snapshot.generated_at !== "string" && snapshot.generated_at !== null) ||
    typeof snapshot.current_object_count !== "number" ||
    typeof snapshot.coverage.checked_object_count !== "number" ||
    (snapshot.coverage.scope !== "sampled" && snapshot.coverage.scope !== "full" && snapshot.coverage.scope !== "unknown") ||
    !isRecord(checks) ||
    !isQualityCheck(checks.health) ||
    !isQualityCheck(checks.lint) ||
    !isQualityCheck(checks.graph) ||
    !isQualityCheck(checks.freshness) ||
    !isRecord(tabCounts) ||
    !["all", "consistency", "structure", "graph", "freshness"].every(
      (key) => typeof tabCounts[key] === "number",
    ) ||
    !isRecord(structural) ||
    !Array.isArray(structural.checks) ||
    !structural.checks.every(isQualityStructuralCheck) ||
    !Array.isArray(structural.findings) ||
    !structural.findings.every(isQualityFinding) ||
    !isRecord(consistency) ||
    !Array.isArray(consistency.findings) ||
    !consistency.findings.every(isQualityFinding) ||
    !isRecord(graph) ||
    !Array.isArray(graph.findings) ||
    !graph.findings.every(isQualityFinding) ||
    !isRecord(freshness) ||
    !Array.isArray(freshness.recommendations) ||
    !freshness.recommendations.every(isQualityFinding)
  ) {
    return null
  }

  return value as QualitySnapshotResponse
}

export function qualityCheckStateLabel(state: QualityCheckState): string {
  const labels: Record<QualityCheckState, string> = {
    available: "可用",
    stale: "报告已过期",
    missing: "报告缺失",
    parse_failed: "报告无法解析",
    not_run: "尚未运行",
    incomplete: "报告不完整",
  }
  return labels[state]
}
