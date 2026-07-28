# 知识质量页开发计划

## 1. 目标与完成标准

将 Quartz 的 `/quality` 从“构建期 frontmatter 缺口统计页”升级为**可追溯的知识质量巡检页**。页面仍命名为“知识质量”，但不再用一个不透明的健康分数概括质量，也不在浏览器请求时运行 Agent 工具或改写 Wiki。

完成后，用户能在同源 `/quality` 中看到：

1. 最近一次质量快照的生成时间、覆盖范围、`health` / `lint` / `graph` 报告是否存在且是否过期。
2. 结构完整性：空页/过短页、索引不同步、日志缺失、坏链、孤儿页、稀疏链接。
3. 内容一致性：`lint.py` 已报告的矛盾或待核对口径；每条明确展示涉及页面、原报告证据、建议核对来源和“需人工确认”状态。
4. 图谱质量：孤立社群、脆弱桥接、薄弱枢纽、缺失实体候选，以及图谱是否可作为当前结论使用。
5. 新鲜度与修复：仅展示已确认的来源变更和候选修复建议；不从 UI 自动调用 `refresh.py` 或 `heal.py`。

验收时，任何缺失、不可解析或过期的报告都必须显示为“不可用/过期”，不能显示为 `0` 个问题或“通过”。

## 2. 范围、权威来源与硬边界

### 本次改动范围

- `wiki-backend`：提供只读、结构化、可判定新鲜度的质量快照 API。
- `quartz`：重做 `/quality` 的服务端骨架、浏览器端质量快照加载与交互展示。
- `plans/`：保存本计划。

### 不在本次范围

- 不修改 `llm-wiki-agent/tools/health.py`、`lint.py`、`refresh.py`、`heal.py` 或其提示词。
- 不让 `wiki-backend` 动态导入、执行或以子进程启动 `llm-wiki-agent` 的 Python 工具。
- 不增加后端直连端口、第二条 FRP 隧道、跨域调用或客户端直连 `8081`。
- 不在本期实现“页面点击后自动运行 Lint / Refresh / Heal”。这些动作涉及 LLM 成本或 Wiki 写入，需独立的受控任务方案和权限设计。
- 不把质量报告更新误作知识发布；质量快照 API 是运行时只读数据，不应触发 Quartz build 或 Nginx reload。

### 数据权威链

```text
llm-wiki-agent（质量规则与报告产物的权威来源）
  ├─ wiki/health-report.md
  ├─ wiki/lint-report.md
  ├─ graph/graph-report.md
  └─ graph/graph.json（built 时间与节点/边元信息）
          ↓ 只读解析
wiki-backend /api/quality/latest
          ↓ 同源、API 不缓存
Quartz /quality（静态页面骨架 + 浏览器端快照展示）
```

Quartz 的 `props.allFiles` 仍可提供“缺少摘要/标签/更新时间”的构建期补充信息，但不得覆盖或伪造 Agent 报告的结构、语义、图谱与新鲜度结论。

## 3. 关键事实与产品决策

1. `health.py` 是无 LLM 的确定性结构检查，适合高频巡检。
2. `lint.py` 同时包含确定性链接检查和 LLM 语义检查；现有语义部分只抽取 `pages[:20]`，因此 UI 必须展示其覆盖/方法边界，不能声称“全库已无矛盾”。
3. `lint.py` 的既有报告是 Markdown，自由文本中的“涉及页面、证据、建议”不一定结构完整。第一期 API 必须保留原始报告定位与“未结构化”状态，不能编造页面或置信度。
4. 图谱结论只有在 `graph.json` 与 Wiki 当前版本足够接近时才有效。现有历史报告已出现“Wiki 页数与图谱节点数不一致”的情况，必须在 API 中显式标为过期。
5. `refresh.py` 的真实判断来自原始文件哈希；`heal.py` 会调用 LLM 并写入实体页。若没有相应的已生成报告，UI 应显示“尚无快照”，而不是自行重算或提供自动执行按钮。
6. 后端已有 PublishService，会在入库或 synthesis 后合并并构建 Quartz。质量页 API 是读报告快照，报告文件变化不应自动触发发布；只有修改 Quartz UI 源码时才需要重新构建站点。

## 4. 后端实施计划：`wiki-backend`

### 阶段 A：定义稳定的质量快照契约

新增 `app/schemas/quality.py`，使用 Pydantic 明确 API 契约。建议的核心模型：

```text
QualitySnapshotResponse
├─ generated_at: datetime | null
├─ snapshot_status: available | stale | incomplete | unavailable
├─ coverage
│  ├─ current_wiki_page_count
│  ├─ health_scanned_page_count
│  ├─ lint_scanned_page_count
│  └─ semantic_scope: sampled | full | unknown
├─ checks
│  ├─ health: QualityCheckStatus
│  ├─ lint: QualityCheckStatus
│  ├─ graph: QualityCheckStatus
│  └─ freshness: QualityCheckStatus
├─ structural: QualityStructuralSummary
├─ consistency: list[QualityFinding]
├─ graph: QualityGraphSummary
├─ freshness: QualityFreshnessSummary
└─ metadata_gaps: QualityMetadataSummary | null
```

`QualityCheckStatus` 至少包含 `state`（`available | stale | missing | parse_failed | not_run`）、`generated_at`、`source_path` 的相对展示名、`message` 与 `report_version`。不得把服务器绝对路径返回给浏览器。

`QualityFinding` 至少包含：

- 稳定 ID（由报告类别、标题和原报告段落位置派生，不作为永久知识 ID）。
- `category`、`severity`、`status`（默认 `needs_review`）。
- `title`、`summary`、`pages`（允许为空）。
- `evidence`（允许为空）与 `recommendation`（允许为空）。
- `report_section`，让用户能够知道该结论来自报告的哪个章节。

### 阶段 B：实现只读 `QualityReportService`

新增 `app/services/quality_report_service.py`，输入为 `settings.llm_wiki_repo_path`，只读访问以下固定路径：

- `wiki/health-report.md`
- `wiki/lint-report.md`
- `graph/graph-report.md`
- `graph/graph.json`
- `wiki/` 中当前可发布 Markdown 页，用于计算当前页数和检测报告过期。

服务职责：

1. 为各报告读取文件修改时间与报告标题日期；缺失或标题日期无法解析时返回明确状态。
2. 解析 `health.py` 的固定 Markdown 标题和计数；空页、索引、日志检查分别返回。
3. 解析 `lint.py` 已知标题：`Structural Issues`、`Graph-Aware Issues`、`Contradictions`、`Stale Content`、`Data Gaps`、`Concepts Needing More Depth`。未知或手工扩展段落保留为安全的文本摘要，不丢失但不伪造结构字段。
4. 读取 `graph.json` 的 `built`、节点数、边数；将其与当前 Wiki 修改时间、报告声明页数比较，给出 `fresh | stale | unknown`。
5. 不执行 LLM、不会修改报告、不会读取 `raw/` 正文、不会调用 MySQL。
6. 采用基于报告 mtime 的进程内短缓存；任一相关文件 mtime 变化后失效，避免每次页面打开遍历整个 Wiki。
7. 所有解析失败仅降级为 `parse_failed`，记录脱敏日志，绝不让 `/api/quality/latest` 返回 500。

新鲜度的第一期定义为“已有报告是否可用于当前 Wiki”，不是重新实现 `refresh.py` 的哈希工作流。若没有独立的新鲜度报告，响应为 `not_run`，前端显示“尚无来源新鲜度快照”。

### 阶段 C：只读 API

新增 `app/api/quality.py` 与路由：

```text
GET /api/quality/latest
```

行为：

- 返回 `QualitySnapshotResponse`；报告缺失/过期是 `200` 的领域状态，不是 HTTP 失败。
- 只有 Wiki 根目录不存在或服务不可用时返回可诊断的 `503`。
- 路由 description 明确说明：结果来自最近一次 Agent 报告；语义发现需要人工核对；接口不运行检查。
- 在 `app/main.py` 通过 `app.state.quality_report_service` 注入，并提供与 `main_dependencies.py` 风格一致的 dependency。
- `/api/quality/*` 沿用现有同源 Nginx 路由，ECS 与 DGX 均 `proxy_cache off`；不新增 CORS 或公开后端监听。

第一期不提供 `POST /api/quality/runs`、`POST /api/quality/heal`、`POST /api/quality/refresh`，也不提供原始报告文件下载接口。这样不会把具有内部知识上下文的 Markdown 报告无边界暴露，也不会把写操作放进无认证 UI。

### 阶段 D：后端测试与文档

新增 fixture 驱动测试，至少覆盖：

1. 健康、Lint、Graph 三份正常报告可解析为稳定 schema。
2. 缺少任意报告时为 `missing`，不是零问题。
3. 报告日期早于当前 Wiki 变更、或 `graph.json` 页数不一致时为 `stale`。
4. Lint Markdown 出现未知标题、损坏内容或缺失字段时安全降级为 `parse_failed` / `incomplete`。
5. `/api/quality/latest` 的状态码、Pydantic 响应、相对路径脱敏和无 MySQL依赖行为。
6. 质量服务不调用 LLM、不写 Wiki、不调用 PublishService。

同步更新 `README.md`、`.env.example`（如新增的质量缓存/过期阈值配置）与 API 文档。建议阈值只增加 `WIKI_BACKEND_QUALITY_STALE_AFTER_HOURS`，默认值必须保守，并在 UI 中展示“过期判定阈值”。

## 5. 前端实施计划：`quartz`

### 阶段 E：替换 `/quality` 的页面骨架

在 `.local-plugins/knowledge-ui/src/components/QualityPage.tsx` 中保留页面 slug、全局导航和原有 `getKnowledgeObjects(props.allFiles)` 的元数据统计，但重组为以下五个区块：

1. **概览**：报告时间、覆盖页数、图谱新鲜度、health/lint/graph 状态。初始状态展示“正在读取最近质量快照”。
2. **结构完整性**：health 与 lint 的确定性结果；同时保留“缺少摘要/标签/更新时间”的 Quartz 构建期元数据作为独立小项，并标注来源是“静态索引”。
3. **内容一致性**：矛盾/口径差异列表；选中项在右侧或展开区域展示涉及页面、证据、建议核对来源及 `需人工确认`。
4. **图谱质量**：孤立社群、脆弱桥接、薄弱枢纽、缺失实体候选；图谱过期时仅显示过期说明和最后已知时间，不显示旧数字为“当前结论”。
5. **新鲜度与修复**：来源快照状态、refresh/heal 的建议；没有报告时显示“尚无快照”。所有修复 CTA 都是“查看建议/查看操作说明”，不是自动执行。

沿用既有 `knowledge-ui` 视觉系统：浅灰纸张背景、墨绿导航、细分隔线、宋体主标题、无夸张卡片或仪表盘。以 `design/ui-prototypes/quality.html` 为信息层级参考，而不是直接复制其中的展示数据。

### 阶段 F：运行时数据加载与降级

新增本地插件客户端脚本（例如 `src/components/scripts/quality.inline.ts`）与类型/映射模块（例如 `src/quality.ts`）：

1. 页面加载后同源 `fetch("/api/quality/latest", { headers: { Accept: "application/json" } })`。
2. 所有返回文本使用 DOM `textContent` / 框架安全渲染，不能将 Lint Markdown 直接 `innerHTML` 注入页面。
3. API 成功后更新快照状态、计数、列表、证据面板与筛选标签。
4. API 不可用时保留静态元数据区块，并在 Agent 质量区块显示“最近质量快照不可用”；不把网络错误写成“检查通过”。
5. 报告 `stale`、`incomplete`、`parse_failed` 状态使用同一套明确文案，展示最后时间及原因；不使用红黄绿单色替代文字。
6. “查看巡检报告”第一期展开页面内的结构化详情与报告章节定位；不调用未知的原始报告 URL。
7. “运行新一轮检查”第一期不显示为可执行按钮；改为说明性文案或链接至受控运维流程，等待后续权限化任务方案。

质量页必须继续使用生产 `CHAT_PROXY_URL=/api` 的同源边界，不能在 bundle 中写入 `127.0.0.1:8081`。

### 阶段 G：前端测试、构建与发布验证

新增 quality 映射/格式化的单元测试，至少覆盖：

1. `available`、`stale`、`missing`、`parse_failed`、`not_run` 的展示文案。
2. 矛盾项缺少页面或证据时的安全空状态。
3. 过期 graph 不能渲染为当前的图谱风险数字。
4. API 失败时保留原有静态 metadata gap 结果，且不显示虚假的成功状态。
5. 筛选项、选中证据面板和键盘可达性。

按现有本地插件契约执行：

```powershell
cd C:\job_docs\knowledge_base\mvc_sample\quartz\.local-plugins\knowledge-ui
npm.cmd run build

cd ..\..
CHAT_PROXY_URL=/api npx.cmd quartz build -d ..\llm-wiki-agent\wiki
```

提交时同步提交 `src/`、`dist/`、必要的 package/lockfile；不提交 `public/`、`node_modules/` 或 `.quartz/plugins/`。

## 6. 实施顺序与验收闸门

### 里程碑 1：后端只读快照

- 完成 schema、解析服务、`GET /api/quality/latest`、fixtures 和后端文档。
- 验证：

```powershell
cd C:\job_docs\knowledge_base\mvc_sample\wiki-backend
.venv\Scripts\python.exe -m unittest discover -s tests
```

- 手工验证：`GET /api/quality/latest` 能指出当前历史 `health` / `lint` / `graph` 报告是否过期，不会把旧报告伪装成当前结论。

### 里程碑 2：Quartz 质量页

- 完成服务端骨架、运行时脚本、样式、前端测试和本地插件构建。
- 验证：质量页在 API 正常、缺失、超时和报告过期四种状态均可读；不出现 `/quartz/` 资源前缀或直接访问 8081 的 URL。

### 里程碑 3：Windows 集成验证

1. 通过本地同源代理启动 Quartz 与后端。
2. 检查 `/quality`：概览、五个区块、筛选和证据面板。
3. 检查浏览器网络请求只访问 `/api/quality/latest`，且该请求没有写副作用。
4. 检查 `public/quality.html` 引用的是本次构建生成的最新脚本。

### 里程碑 4：DGX / ECS 发布验证

1. 在 DGX ARM64 使用项目 `.venv/bin/python` 运行后端全量测试。
2. 验证 `127.0.0.1:8081/api/quality/latest`、`127.0.0.1:8080/api/quality/latest` 与 `127.0.0.1:8080/quality`。
3. 使用 `CHAT_PROXY_URL=/api` 和真实 `llm-wiki-agent/wiki` 重新构建 Quartz。
4. 检查 `public/quality.html`、`public/static/contentIndex.json` 和无 `/quartz/` 前缀。
5. 在 ECS 验证 `/api/quality/latest` 响应头为 `X-Cache-Status: BYPASS`；静态质量页仍可按现有静态缓存策略缓存。

## 7. 后续阶段（不进入本期实现）

在用户明确授权修改 `llm-wiki-agent` 或部署独立运维 worker 后，再实施质量报告生产自动化：

1. 为 health、lint、graph、refresh 生成统一的机器可读快照文件，避免后端长期解析自由 Markdown。
2. 定时或按 ingest 批次运行：`health` → `build_graph` → `lint`；每次运行写入报告版本、覆盖范围和失败原因。
3. 仅在人工确认后执行 `refresh` 或 `heal`，并记录发起人、输入报告版本、实际 Wiki 变更和后续发布任务。
4. 如要从 UI 发起巡检/修复，先补齐 HTTPS、身份认证、角色权限、限流、审计日志和可取消的后台任务模型。

在该阶段完成前，`/quality` 的核心承诺是“展示最近一次已确认的巡检事实及其边界”，而不是“替用户自动修复知识库”。
