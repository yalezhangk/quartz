export const qualityScript = `
document.addEventListener("nav", () => {
  const root = document.querySelector(".knowledge-quality")
  if (!(root instanceof HTMLElement) || root.dataset.bound === "true") return
  root.dataset.bound = "true"

  const snapshot = root.querySelector("[data-quality-snapshot]")
  const stateLabels = {
    available: "可用",
    stale: "报告已过期",
    missing: "报告缺失",
    parse_failed: "报告无法解析",
    not_run: "尚未运行",
    incomplete: "报告不完整",
  }
  const categories = ["consistency", "structure", "graph", "freshness"]

  const isRecord = (value) => typeof value === "object" && value !== null
  const setText = (selector, value) => {
    const element = root.querySelector(selector)
    if (element) element.textContent = value
  }
  const stateLabel = (state) => stateLabels[state] ?? "状态未知"
  const formatDate = (value) => {
    if (typeof value !== "string") return "时间未知"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "时间未知"
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  }
  const clear = (element) => element.replaceChildren()
  const appendText = (parent, tagName, className, value) => {
    const element = document.createElement(tagName)
    if (className) element.className = className
    element.textContent = value
    parent.append(element)
    return element
  }

  const showEvidenceEmpty = (message) => {
    const target = root.querySelector("[data-quality-evidence-body]")
    if (!(target instanceof HTMLElement)) return
    clear(target)
    target.className = "quality-evidence-empty"
    target.textContent = message
    setText("[data-quality-evidence-state]", "暂无可选发现项")
  }
  const showActionNote = (title, message) => {
    const note = root.querySelector("[data-quality-action-note]")
    if (!(note instanceof HTMLElement)) return
    setText("[data-quality-action-note-title]", title)
    setText("[data-quality-action-note-body]", message)
    note.hidden = false
    note.focus()
  }

  const renderEvidence = (finding, index, total) => {
    const target = root.querySelector("[data-quality-evidence-body]")
    if (!(target instanceof HTMLElement) || !isRecord(finding)) return
    clear(target)
    target.className = "quality-evidence-content"
    setText("[data-quality-evidence-state]", "第 " + String(index + 1) + " / " + String(total) + " 条")

    const evidence = Array.isArray(finding.evidence) ? finding.evidence.filter(isRecord).slice(0, 2) : []
    if (evidence.length === 0) {
      appendText(target, "p", "quality-evidence-empty", "该发现项没有可安全展示的结构化来源证据。")
    }
    evidence.forEach((item) => {
      const source = document.createElement("section")
      source.className = "quality-evidence-source"
      const heading = document.createElement("div")
      heading.className = "quality-evidence-source-heading"
      appendText(heading, "strong", "", String(item.source_label ?? item.label ?? "来源证据"))
      appendText(heading, "span", "", typeof item.location === "string" ? item.location : "位置未知")
      source.append(heading)
      appendText(source, "blockquote", "", typeof item.quote === "string" ? item.quote : "未提供引用内容。")
      target.append(source)
    })

    const pages = Array.isArray(finding.pages) && finding.pages.length > 0 ? finding.pages.join(" · ") : "未能可靠提取涉及页面"
    const recommendation = typeof finding.recommendation === "string" && finding.recommendation
      ? finding.recommendation
      : "请回到来源资料人工核对。"
    const summary = document.createElement("dl")
    summary.className = "quality-evidence-summary"
    appendText(summary, "dt", "", "涉及页面")
    appendText(summary, "dd", "", pages)
    appendText(summary, "dt", "", "建议核对来源")
    appendText(summary, "dd", "", recommendation)
    target.append(summary)
  }

  const renderFindings = (selector, findings, unavailableMessage, selectFirst) => {
    const target = root.querySelector(selector)
    if (!(target instanceof HTMLElement)) return null
    clear(target)
    if (!Array.isArray(findings)) {
      target.className = "quality-section-placeholder"
      target.textContent = unavailableMessage
      return null
    }
    if (findings.length === 0) {
      target.className = "quality-section-placeholder"
      target.textContent = "最近可用报告未提供需要人工处理的发现项。"
      return null
    }
    target.className = "quality-finding-list"
    findings.filter(isRecord).forEach((finding, index) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "quality-finding"
      button.dataset.qualityFinding = String(finding.id ?? index)
      const severity = typeof finding.severity === "string" ? finding.severity : "unknown"
      appendText(button, "span", "quality-finding-marker is-" + severity, "")
      const copy = document.createElement("span")
      copy.className = "quality-finding-copy"
      appendText(copy, "strong", "", typeof finding.title === "string" ? finding.title : "未命名发现项")
      appendText(copy, "small", "", typeof finding.summary === "string" ? finding.summary : "没有可展示的摘要。")
      button.append(copy)
      const status = typeof finding.status === "string" ? finding.status : "needs_review"
      appendText(button, "span", "quality-finding-status", status === "documented_difference" ? "已标注差异" : "需人工确认")
      button.addEventListener("click", () => {
        target.querySelectorAll(".quality-finding").forEach((item) => item.classList.remove("is-active"))
        button.classList.add("is-active")
        renderEvidence(finding, index, findings.length)
      })
      target.append(button)
    })
    const first = target.querySelector(".quality-finding")
    if (selectFirst && first instanceof HTMLButtonElement) first.click()
    return first
  }

  const renderStructural = (checks, unavailableMessage) => {
    const target = root.querySelector("[data-quality-structural]")
    if (!(target instanceof HTMLTableSectionElement)) return
    clear(target)
    const appendCheck = (label, result, detail) => {
      const row = document.createElement("tr")
      appendText(row, "td", "", label)
      appendText(row, "td", "", result)
      appendText(row, "td", "", detail)
      target.append(row)
    }
    if (!Array.isArray(checks)) {
      appendCheck("空页 / 过短页", unavailableMessage, "等待最近结构巡检报告。")
      appendCheck("索引同步", unavailableMessage, "等待最近结构巡检报告。")
      appendCheck("日志覆盖", unavailableMessage, "等待最近结构巡检报告。")
      appendCheck("坏链与孤儿页", unavailableMessage, "等待最近结构巡检报告。")
      appendCheck("稀疏链接", unavailableMessage, "等待最近结构巡检报告。")
      return
    }

    const checkByLabel = new Map(checks.filter(isRecord).map((check) => [check.label, check]))
    const resultFor = (label, success) => {
      const check = checkByLabel.get(label)
      if (!isRecord(check) || typeof check.state !== "string") return "未提供"
      if (check.state !== "available") return stateLabel(check.state)
      return success
    }
    appendCheck(
      "空页 / 过短页",
      resultFor("空页或短页", "未发现"),
      "页面正文达到最小内容阈值。",
    )
    appendCheck(
      "索引同步",
      resultFor("索引同步", "已同步"),
      "wiki/index.md 与磁盘页面一致。",
    )
    appendCheck(
      "日志覆盖",
      resultFor("入库日志覆盖", "已覆盖"),
      "来源页具备对应 ingest 记录。",
    )
  }

  const renderStructuralFindings = (findings) => {
    const target = root.querySelector("[data-quality-structural]")
    if (!(target instanceof HTMLTableSectionElement) || !Array.isArray(findings)) return
    const issues = findings.filter(isRecord)
    const pagesFor = (predicate) => {
      const pages = new Set()
      issues.filter(predicate).forEach((finding) => {
        if (!Array.isArray(finding.pages)) return
        finding.pages.filter((page) => typeof page === "string").forEach((page) => pages.add(page))
      })
      return pages.size
    }
    const brokenOrOrphan = issues.filter((finding) => /^(失效 WikiLink|导航孤儿页面)/.test(String(finding.title ?? ""))).length
    const sparse = pagesFor((finding) => /^低出链页面/.test(String(finding.title ?? "")))
    const appendFinding = (label, count, unit, detail) => {
      const row = document.createElement("tr")
      appendText(row, "td", "", label)
      appendText(row, "td", "", count === 0 ? "未发现" : String(count) + unit)
      appendText(row, "td", "", detail)
      target.append(row)
    }
    appendFinding("坏链与孤儿页", brokenOrOrphan, " 条", "查看具体引用位置后再决定补链或保留。")
    appendFinding("稀疏链接", sparse, " 页", "少于 2 个出站 WikiLink，可能形成知识碎片。")
  }

  const renderRecommendations = (recommendations, unavailableMessage) => {
    const target = root.querySelector("[data-quality-recommendations]")
    if (!(target instanceof HTMLElement)) return
    clear(target)
    if (!Array.isArray(recommendations)) {
      target.className = "quality-section-placeholder"
      target.textContent = unavailableMessage
      return
    }
    if (recommendations.length === 0) {
      target.className = "quality-section-placeholder"
      target.textContent = "尚无来源新鲜度快照或修复建议。"
      return
    }
    target.className = "quality-recommendation-list"
    recommendations.filter(isRecord).forEach((item, index) => {
      const row = document.createElement("article")
      row.className = "quality-recommendation"
      appendText(row, "span", "quality-recommendation-index", String(index + 1).padStart(2, "0"))
      const copy = document.createElement("div")
      appendText(copy, "h3", "", typeof item.title === "string" ? item.title : "未命名建议")
      appendText(copy, "p", "", typeof item.summary === "string" ? item.summary : "请人工核对来源资料。")
      row.append(copy)
      target.append(row)
    })
  }

  const setSectionCount = (category, value) => {
    setText("[data-quality-section-count='" + category + "']", value)
  }
  const setTabCount = (category, value) => {
    setText("[data-quality-tab-count='" + category + "']", value)
  }
  const bindTabs = () => {
    const tabs = Array.from(root.querySelectorAll("[data-quality-tab]"))
    const select = (category) => {
      tabs.forEach((tab) => {
        if (!(tab instanceof HTMLButtonElement)) return
        const active = tab.dataset.qualityTab === category
        tab.classList.toggle("is-active", active)
        tab.setAttribute("aria-selected", String(active))
        tab.tabIndex = active ? 0 : -1
      })
      categories.forEach((item) => {
        const section = root.querySelector("[data-quality-section='" + item + "']")
        if (section instanceof HTMLElement) section.hidden = category !== "all" && item !== category
      })
    }
    tabs.forEach((tab) => {
      if (!(tab instanceof HTMLButtonElement)) return
      tab.addEventListener("click", () => select(tab.dataset.qualityTab ?? "all"))
      tab.addEventListener("keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return
        const currentIndex = tabs.indexOf(tab)
        let nextIndex = currentIndex
        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length
        if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
        if (event.key === "Home") nextIndex = 0
        if (event.key === "End") nextIndex = tabs.length - 1
        if (nextIndex === currentIndex) return
        event.preventDefault()
        const nextTab = tabs[nextIndex]
        if (!(nextTab instanceof HTMLButtonElement)) return
        select(nextTab.dataset.qualityTab ?? "all")
        nextTab.focus()
      })
    })
    select("all")
  }
  const bindActions = () => {
    const reportButton = root.querySelector("[data-quality-report]")
    if (reportButton instanceof HTMLButtonElement) {
      reportButton.addEventListener("click", () => {
        loadSnapshot(true)
      })
    }
    const runButton = root.querySelector("[data-quality-run]")
    if (runButton instanceof HTMLButtonElement) {
      runButton.addEventListener("click", () => {
        showActionNote(
          "运行检查需要管理授权",
          "质量检查必须通过受控运维流程执行。本页面不会发起巡检、写入 Wiki 或创建后台任务。",
        )
      })
    }
  }
  const showUnavailable = () => {
    if (snapshot instanceof HTMLElement) snapshot.setAttribute("aria-busy", "false")
    setText("[data-quality-generated-at]", "快照不可用")
    setText("[data-quality-generated-detail]", "未能读取最近质量快照")
    setText("[data-quality-coverage]", "快照不可用")
    setText("[data-quality-coverage-detail]", "静态 metadata 补充仍可用")
    setText("[data-quality-graph-state]", "快照不可用")
    setText("[data-quality-graph-detail]", "不会显示历史图谱结论")
    setText("[data-quality-lint-state]", "快照不可用")
    setText("[data-quality-lint-detail]", "不会显示历史语义结论")
    setTabCount("all", "—")
    categories.forEach((category) => {
      setTabCount(category, "—")
      setSectionCount(category, "快照不可用")
    })
    renderFindings("[data-quality-findings='consistency']", null, "最近语义巡检报告不可用。", false)
    renderFindings("[data-quality-findings='graph']", null, "最近图谱健康度报告不可用。", false)
    renderStructural(null, "最近结构巡检报告不可用。")
    renderRecommendations(null, "尚无可用来源新鲜度快照。")
    showEvidenceEmpty("最近质量快照不可用；静态 metadata 补充仍保留在页面下方。")
  }
  const renderSnapshot = (payload) => {
    if (!isRecord(payload) || !isRecord(payload.snapshot) || !isRecord(payload.snapshot.checks) || !isRecord(payload.tab_counts)) {
      showUnavailable()
      return
    }
    const data = payload.snapshot
    const checks = data.checks
    const health = checks.health
    const lint = checks.lint
    const graph = checks.graph
    const freshness = checks.freshness
    if (!isRecord(health) || !isRecord(lint) || !isRecord(graph) || !isRecord(freshness) || !isRecord(data.coverage)) {
      showUnavailable()
      return
    }
    if (snapshot instanceof HTMLElement) snapshot.setAttribute("aria-busy", "false")
    setText("[data-quality-generated-at]", formatDate(data.generated_at))
    setText("[data-quality-generated-detail]", stateLabel(data.status))
    const objectCount = typeof data.current_object_count === "number" ? String(data.current_object_count) : "—"
    setText("[data-quality-coverage]", objectCount + "/" + objectCount + " 对象")
    setText("[data-quality-coverage-detail]", "完整覆盖当前静态索引")
    setText("[data-quality-graph-state]", stateLabel(graph.state))
    setText("[data-quality-graph-detail]", typeof graph.message === "string" ? graph.message : "未提供图谱说明")
    const lintCount = typeof payload.tab_counts.consistency === "number" && lint.state === "available"
      ? String(payload.tab_counts.consistency) + " 条待核对"
      : stateLabel(lint.state)
    setText("[data-quality-lint-state]", lintCount)
    setText("[data-quality-lint-detail]", typeof lint.message === "string" ? lint.message : "未提供语义巡检说明")

    const tabCounts = payload.tab_counts
    const currentChecks = { consistency: lint, structure: health, graph, freshness }
    const allCurrent = categories.reduce((total, category) => {
      const check = currentChecks[category]
      return total + (check.state === "available" && typeof tabCounts[category] === "number" ? tabCounts[category] : 0)
    }, 0)
    setTabCount("all", String(allCurrent))
    categories.forEach((category) => {
      const check = currentChecks[category]
      const count = check.state === "available" && typeof tabCounts[category] === "number" ? String(tabCounts[category]) : "—"
      setTabCount(category, count)
      setSectionCount(category, check.state === "available" ? count + " 项" : stateLabel(check.state))
    })

    const selected = lint.state === "available"
      ? renderFindings("[data-quality-findings='consistency']", payload.consistency?.findings, "最近语义巡检报告不可用。", true)
      : renderFindings("[data-quality-findings='consistency']", null, typeof lint.message === "string" ? lint.message : "最近语义巡检报告不可用。", false)
    if (!(selected instanceof HTMLButtonElement)) showEvidenceEmpty("请选择有来源证据的发现项；没有发现项时本栏会保持为空状态。")
    renderStructural(health.state === "available" ? payload.structural?.checks : null, typeof health.message === "string" ? health.message : "最近结构巡检报告不可用。")
    renderStructuralFindings(health.state === "available" ? payload.structural?.findings : null)
    renderFindings("[data-quality-findings='graph']", graph.state === "available" ? payload.graph?.findings : null, typeof graph.message === "string" ? graph.message : "最近图谱健康度报告不可用。", false)
    renderRecommendations(freshness.state === "available" ? payload.freshness?.recommendations : null, typeof freshness.message === "string" ? freshness.message : "尚无可用来源新鲜度快照。")
  }
  const loadSnapshot = (announce) => {
    const reportButton = root.querySelector("[data-quality-report]")
    const previousLabel = reportButton instanceof HTMLButtonElement ? reportButton.textContent : null
    if (reportButton instanceof HTMLButtonElement) {
      reportButton.disabled = true
      reportButton.textContent = "正在读取…"
    }
    if (snapshot instanceof HTMLElement) snapshot.setAttribute("aria-busy", "true")
    return fetch("/api/quality/latest", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("quality snapshot unavailable")
        return response.json()
      })
      .then((payload) => {
        renderSnapshot(payload)
        if (announce) {
          const generatedAt = isRecord(payload) && isRecord(payload.snapshot)
            ? formatDate(payload.snapshot.generated_at)
            : "时间未知"
          showActionNote(
            "巡检报告已刷新",
            "已从 Agent 获取最近质量快照（报告时间：" + generatedAt + "）。页面中的概览、发现项和证据已更新；原始 Markdown 报告不会向浏览器暴露。",
          )
        }
      })
      .catch(() => {
        showUnavailable()
        if (announce) {
          showActionNote(
            "巡检报告读取失败",
            "未能从 Agent 获取最近质量快照。页面已保留构建期静态 metadata 检查，请稍后重试或检查 wiki-backend 与同源 /api 代理。",
          )
        }
      })
      .finally(() => {
        if (reportButton instanceof HTMLButtonElement) {
          reportButton.disabled = false
          reportButton.textContent = previousLabel || "查看巡检报告"
        }
      })
  }

  bindTabs()
  bindActions()
  loadSnapshot(false)
})
`
