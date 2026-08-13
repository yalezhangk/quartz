# Quartz 历史 Source 原文件发布交接

## 交接目标

让早于 `wiki-backend` 的 coding-agent 入库资料，也能在 Quartz UI 的 Source 页面点击并打开其原始文件。

本任务只修改 `quartz`。不重新 ingest，不移动或重命名 `llm-wiki-agent/raw/` 中的历史文件，不修改 `wiki-backend` 数据库，不修改 `llm-wiki-agent/wiki/sources/` 的历史 Markdown。

## 已验证的现状

- Quartz 的 `content` 是指向 `llm-wiki-agent/wiki` 的符号链接。
- 当前 `wiki/sources/` 有 71 个带 `source_file` 的 Source 页面：1 个为新 UI manual 路径 `raw/uploads/manual/...`，70 个为历史路径；本地检查显示这 70 个历史文件都仍存在于 `llm-wiki-agent/raw/`。
- 历史路径包括 `raw/MCP/...`、`raw/MVE/...` 等分类目录；另有少量旧平铺路径 `raw/uploads/...`。它们是旧流程数据，不应被重新解释为新 UI 的 manual 上传。
- 新 UI ingest 的 Source 页面可以显示原文件，是因为它使用了以下确定性契约：

  ```yaml
  source_file: raw/uploads/manual/report.pdf
  ```

- 当前 Quartz 实现只识别上述 `raw/uploads/manual/` 前缀：
  - `.local-plugins/source-files/src/source-files.ts` 只复制该前缀的被引用文件；
  - `.local-plugins/knowledge-ui/src/knowledge.ts` 只将该前缀写入 `KnowledgeObject.sourceFile`；
  - `.local-plugins/knowledge-ui/src/components/SourceReference.tsx` 只为该前缀生成“查看原文”链接。

因此，历史 Source 页已有正确的 `source_file: raw/...`，但既未进入 `public/`，也未在 UI 中获得链接。这是前端发布范围限制，不是后端或资料缺失问题。

## 需要覆盖的既有计划

`wiki-backend/plans/source-origin-ingest-quartz-plan.md` 中“仅发布 `raw/uploads/manual/`”及“历史平铺 `raw/uploads/...` 不发布”的范围，是新 UI 上传和定时同步功能的原始边界。

本交接仅为**历史 Source 页面**扩展该范围：凡是已经发布的 `sources/*.md` 显式引用、且实际位于 `WIKI_SOURCE_ROOT/raw/` 内的安全普通文件，均可随发布构建复制。不得扫描或发布整个 `raw/` 目录。

## 目标映射

保留已有 UI 上传映射不变：

```text
raw/uploads/manual/report.pdf
-> public/source-files/manual/report.pdf
-> /source-files/manual/report.pdf
```

为历史引用增加独立命名空间：

```text
raw/MCP/HVX说明书.pdf
-> public/source-files/legacy/MCP/HVX说明书.pdf
-> /source-files/legacy/MCP/HVX说明书.pdf

raw/uploads/old-report.md
-> public/source-files/legacy/uploads/old-report.md
-> /source-files/legacy/uploads/old-report.md
```

不要将历史文件复制到 `manual/` 命名空间；这会混淆其来源，也会要求无价值地批量修改历史 frontmatter。

## 实现范围

### 1. 扩展 Source Files emitter

修改 `.local-plugins/source-files/src/source-files.ts`：

1. 仍只从已发布 `sources/*.md` 收集 `source_file`，不遍历 `raw/`。
2. 将来源分类为：
   - `raw/uploads/manual/<path>`：`manual`，保持现有输出路径；
   - 其他 `raw/<path>`：`legacy`，输出到 `public/source-files/legacy/<path>`；
   - 非 `raw/`：沿用当前“无来源、不发布”的处理，避免把任意 frontmatter 值当作文件路径。
3. 对两类本地文件统一做安全校验：
   - 必须为 POSIX 相对路径；拒绝绝对路径、反斜杠、空段、`.`、`..`；
   - 使用 `realpath` 解析后必须仍位于 `WIKI_SOURCE_ROOT/raw`；
   - 必须是普通文件，拒绝目录、缺失文件和符号链接逃逸；
   - 同一真实文件只复制一次。
4. 不把 `raw/uploads/scheduled/` 作为新 scheduled 的原始来源；新 scheduled 页面使用 `source_url`，不会产生 `source_file`。若一个历史 Source 页面显式指向该目录，则按历史引用和同一安全规则处理。
5. 同步更新 `.local-plugins/source-files/README.md` 与该插件 `package.json` 的描述，表述为“发布已发布 Source 页面显式引用的 manual 与历史原文件”。

建议实现一个返回来源类别和相对输出路径的纯函数，例如：

```ts
type SourceFileKind = "manual" | "legacy"

interface PublishedSourceFile {
  sourceFile: string
  kind: SourceFileKind
  relativeOutputPath: string
}
```

无需改变 Quartz 核心 Assets emitter，也不得把 `raw/` 作为 `npx quartz build -d` 的内容目录。

### 2. 扩展 knowledge-ui 的来源元数据

修改 `.local-plugins/knowledge-ui/src/knowledge.ts`：

- `type: source` 的非空 `source_file` 可接受安全的 `raw/...` 历史路径，不再仅限 `raw/uploads/manual/...`。
- 继续只接受 `http/https` 的 `source_url`。
- 保持现有失败关闭策略：同一 Source 同时有有效 `source_file` 和有效 `source_url` 时，不渲染任何入口，避免静默选择错误来源。
- 保留原始 `sourceFile` 值，由展示组件判断其是 `manual` 还是 `legacy`。

### 3. 扩展 Source 页面及 Library 展示

修改 `.local-plugins/knowledge-ui/src/components/SourceReference.tsx`，并检查 `/library` 的 Source 行：

- `raw/uploads/manual/...` 保持“人工上传”及 `/source-files/manual/...` 链接。
- 其他安全 `raw/...` 显示“历史入库”，并链接 `/source-files/legacy/<去掉 raw/ 后的路径>`。
- 历史 `raw/uploads/...` 同样显示“历史入库”，不可显示为“人工上传”。
- 不直接在页面显示完整内部路径；展示文件名、扩展名与来源类别即可。
- 保持现有文件行为：PDF、图片、Markdown、TXT 新标签打开；Office 等文件下载；URL 新标签打开并带 `rel="noopener noreferrer"`。
- 生成链接时使用每段 `encodeURIComponent`，并复用与 emitter 一致的路径安全判断，避免 UI 为 emitter 会拒绝的路径生成假链接。

如 `source-reference` 本地插件只负责把卡片挂载进正文，若不需要改动它的接口，则不要修改它。

### 4. 文档同步

更新 Quartz 的 `README.md` 和 `AGENTS.md`：

- 明确构建仅发布 Source 页**显式引用**的文件，而非发布整个 `raw/`；
- 说明 `manual` 与 `legacy` 两个输出命名空间；
- 保留自动发布构建必须设置 `WIKI_SOURCE_ROOT` 的约定；
- 移除或修正“历史平铺路径不发布”的旧表述。

## 测试要求

至少更新或补充以下测试：

1. `source-files`：
   - manual 路径收集与原有输出映射不变；
   - `raw/MVE/legacy-report.pdf` 能被收集并映射到 `legacy/MVE/legacy-report.pdf`；
   - 历史 `raw/uploads/old.md` 映射到 `legacy/uploads/old.md`；
   - 未引用的 `raw` 文件不会复制；
   - `..`、绝对路径、反斜杠、缺失文件、目录、符号链接逃逸被拒绝。
2. `knowledge-ui`：
   - manual 与 legacy Source 都能保留 `sourceFile`；
   - legacy Source 的 SourceReference href、文案、文件标签正确；
   - 有效 `source_file` 与有效 `source_url` 同时存在时隐藏入口；
   - 非 `raw/`、不安全路径或无来源时隐藏入口。
3. 完整构建：确认历史样本被生成到 `public/source-files/legacy/...`，并确认生成页面含正确链接。

## 推荐验证命令

在 Quartz 仓库根目录执行。Windows 使用 `.cmd`，避免 PowerShell 的脚本执行策略问题：

```powershell
npm.cmd --prefix .local-plugins/source-files test
npm.cmd --prefix .local-plugins/knowledge-ui test
npm.cmd --prefix .local-plugins/source-files run build
npm.cmd --prefix .local-plugins/knowledge-ui run build
$env:WIKI_SOURCE_ROOT = "C:\job_docs\knowledge_base\mvc_sample\llm-wiki-agent"
npx.cmd quartz build -d "C:\job_docs\knowledge_base\mvc_sample\llm-wiki-agent\wiki"
```

DGX 构建必须让 `WIKI_SOURCE_ROOT` 指向真实 `llm-wiki-agent` 根目录，而不是发布快照目录：

```bash
WIKI_SOURCE_ROOT=/home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent \
CHAT_PROXY_URL=/api \
npx quartz build -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki
```

改动本地插件后必须构建其 `dist/`，再运行完整 Quartz build。不要手工编辑 `public/`。

## 发布与安全验收

功能验收：

- 打开一个 `source_file: raw/MCP/...` 的历史 Source 页面，可进入或下载对应原文件；
- 新 UI 上传的 Source 页面仍使用 `manual` 链接且行为不变；
- scheduled 的 `source_url` 仍为外部跳转，不产生静态副本；
- 发布后 Source 页不会出现无效链接，未引用 raw 文件不会出现在 release。

安全验收：

- 构建失败或拒绝不安全引用，不能绕过到 `raw/` 以外；
- 只公开 Source 页面已明确引用的资料；
- 确认这些历史原文允许通过站点访问。若站点对公网开放且资料不适合公开，应先收紧站点访问控制或不要实施此功能。

## 不在本任务范围内

- 重新调用 LLM 或重新 ingest 历史文件；
- 批量改写历史 Source frontmatter；
- 移动 `llm-wiki-agent/raw` 目录结构；
- 修改 `wiki-backend` 数据库、API 或 ingest 服务；
- 发布整个 `raw/` 目录；
- 为 Office 文件增加在线预览服务。
