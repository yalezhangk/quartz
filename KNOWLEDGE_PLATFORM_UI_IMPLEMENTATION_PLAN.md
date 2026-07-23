# 中压市场部知识库：Quartz 前端实施交接

> 用途：在 `quartz` 项目中新开开发线程时，作为背景、范围、实施顺序和验收基线。  
> 产品规格：`../UI_PRODUCT_SPEC.md`  
> 视觉原型：`../design/ui-prototypes/`  
> 更新时间：2026-07-22

## 1. 新线程目标

在保留 Quartz Markdown 静态发布能力的前提下，把当前站点改造成“中压市场部知识库”的正式产品界面，实现：首页、知识库、知识问答和文档入库。

本任务不是重新开发一套前端框架，也不是用 SPA 替代 Quartz。Quartz 继续负责：

```text
llm-wiki-agent/wiki Markdown
→ Quartz 解析 wikilink / frontmatter / Markdown
→ 生成静态 HTML、contentIndex、搜索、图谱、反向链接和目录
→ public/ 由 DGX Nginx 提供
```

动态问答、上传和任务状态继续通过同源 `/api` 调用 `wiki-backend`。

## 2. 开发前必须阅读

按顺序阅读：

1. `AGENTS.md`
2. `../AGENTS.md`
3. `../UI_PRODUCT_SPEC.md`
4. `../design/ui-prototypes/home.html`
5. `../design/ui-prototypes/library.html`
6. `../design/ui-prototypes/ask.html`
7. `../design/ui-prototypes/ingest.html`
8. `../design/ui-prototypes/shared.css`
9. `quartz.config.yaml`
10. `.local-plugins/chats/README.md`
11. `.local-plugins/chats/src/`

原型是信息架构和视觉方向，不是要求把静态 HTML 原样复制到生产。正式实现必须使用 Quartz 的组件、PageType、构建数据和现有插件机制。

## 3. 当前代码事实

### 3.1 已具备

- Quartz v5 静态构建链路。
- `content-index`、Search、Explorer、Graph、Backlinks、Table of Contents 等插件。
- `.local-plugins/chats`：
  - `/chats` 虚拟页面。
  - 会话创建、历史、消息发送和重命名。
  - Markdown 回答渲染。
  - Synthesis 保存状态。
  - 文档上传、Ingest 任务列表和轮询。
- `CHAT_PROXY_URL=/api` 的生产配置。
- `static/contentIndex.json` 到 Quartz 页面链接的映射能力。

### 3.2 当前与目标设计的差距

- `quartz.config.yaml` 的 `pageTitle` 仍为 `MKT SAMPLE`，locale 为 `en-US`。
- 现有 Quartz 左侧 Explorer、PageTitle、Chats 入口不是统一产品导航。
- Chats 页面内部再次显示 `MKT WIKI`，形成第二品牌与第二主侧栏。
- Chats 当前仍包含 Welcome Hero、Wiki Copilot、渐变、大圆角和悬浮卡片。
- Ingest 只嵌在 Chats 侧栏，没有独立 `/ingest` 工作页面。
- 首页仍由 Wiki 内容决定，尚未形成产品化资料总览。
- 缺少 `/library` 类型化知识目录页面。

## 4. 必须保持的架构边界

- 内容源是实际的 `../llm-wiki-agent/wiki`；DGX 构建使用 `-d <wiki-path>`。
- 不复制 Markdown 正文到 MySQL 或新的前端数据仓库。
- 不修改 `public/`；它只能由 Quartz 构建生成。
- 优先使用本地插件和 `quartz/styles/custom.scss`，避免无必要修改 Quartz 上游核心。
- 生产 API 基地址是 `/api`，不写入 DGX 局域网地址、ECS 地址或 `127.0.0.1:8081`。
- 站点部署在根路径 `/`，不得引入 `/quartz/` 资源前缀。
- 不增加第二条 FRP 隧道。
- 修改 `.local-plugins/chats/src` 后必须构建 `dist`，再构建 Quartz `public/`。

## 5. 设计基线

### 5.1 产品名称

```text
中压市场部知识库
MKT / TECHNICAL ARCHIVE
```

### 5.2 视觉方向

- 技术档案、工程手册、研究终端，而不是 AI SaaS。
- 浅灰导航、纸张色内容背景、深工程绿主色、细分隔线。
- 面板圆角 `2px`，默认无阴影。
- 页面标题可以使用中文宋体栈；导航、表格和控件使用系统无衬线字体。
- `SRC / ENT / CON / SYN` 是真实知识对象类型码。
- 不使用渐变、星光、发光、机器人头像、卡片套卡片和装饰性英文眉题。

具体 Token 与状态色以 `../UI_PRODUCT_SPEC.md` 第 11 节为准。

## 6. 推荐实现结构

先检查 Quartz v5 当前本地插件/PageType 能力，再选择最小改动结构。推荐：

```text
quartz/styles/custom.scss
  └─ 全局 Token、基础排版、应用外壳公共样式

.local-plugins/knowledge-ui/
  ├─ AppNavigation 组件
  ├─ HomePageType / HomePage
  ├─ LibraryPageType / LibraryPage
  ├─ IngestPageType / IngestPage
  ├─ 构建期或浏览器端 contentIndex 适配
  └─ 页面交互脚本与测试

.local-plugins/chats/
  ├─ 保留现有 chat API、状态和 Markdown 渲染
  ├─ 移除第二品牌和重复主侧栏
  ├─ 将回答区改成研究备忘录布局
  └─ 复用全局 Token 和导航语言
```

如果 Quartz 的插件注册机制不适合新建 `knowledge-ui`，可以在现有本地插件内增加 PageType；但不得为了省事把全部页面塞入一个巨型 `ChatPage.tsx`。

## 7. 页面计划

### Phase F0：仓库基线与设计 Token

目标：建立后续页面共用的实现基础。

任务：

- 检查工作树，记录用户已有修改。
- 核对 Quartz v5 PageType、layout condition 和本地插件注册方式。
- 将产品名、locale 和必要的站点元数据改为正式值。
- 在 `custom.scss` 建立颜色、字体、间距、边框和状态 Token。
- 实现唯一全局导航；保留 Explorer 作为知识正文的二级目录。
- 定义桌面、平板和移动布局规则。

验证：

- 普通知识正文仍可打开。
- Search、Explorer、TOC、Backlinks、Graph 无回归。
- 不出现两套主导航。

### Phase F1：首页 `/`

目标：实现资料检索和知识状态总览。

任务：

- 为首页使用专用 PageType/布局，不直接显示 `wiki/index.md` 正文。
- 从 `contentIndex.json` 或构建期数据统计 Source、Entity、Concept、Synthesis。
- 展示最近更新的真实知识对象。
- 主检索进入 Quartz Search；另设清楚的“进入知识问答”动作。
- 待办信息只展示能够从真实数据得出的状态。
- 系统状态未知时不得写死“运行正常”。

第一阶段不依赖新增后端接口。

### Phase F2：知识库 `/library`

目标：把 Markdown 文件呈现为结构化知识资产目录。

任务：

- 基于 `contentIndex.json` 和 frontmatter 构造统一对象模型。
- 类型识别顺序以明确 frontmatter 为优先，目录路径为兼容回退。
- 支持 All、Source、Entity、Concept、Synthesis 筛选。
- 支持当前结果内搜索、排序、空状态和清除筛选。
- 点击结果使用 Quartz 相对链接规则进入真实页面。
- 不复制 Markdown 正文，也不新增后端列表 API作为首期前置条件。

### Phase F3：知识问答 `/chats`

目标：保留现有能力，重做信息架构和视觉表达。

任务：

- 保留 `chatApi.ts`、会话生命周期、消息渲染、复制和 Synthesis 状态。
- 移除 `MKT WIKI`、Welcome Hero、Wiki Copilot、机器人头像和内部品牌侧栏。
- 会话栏只承担“问答历史”，不重复产品一级导航。
- 用户消息改为带“问题”标签的检索条件。
- 助手回答采用知识回答排版。
- 右侧引用栏第一阶段使用 `sources` 和 `relevant_pages`，通过 `contentIndex.json` 映射页面。
- 后端增加 `citations` 后再增强标题、对象类型、片段和相关度。
- 保持 `synthesis_path`、`synthesized_at` 刷新恢复能力。

禁止在视觉改造中重写已经工作的 chat 业务状态机。

### Phase F4：文档入库 `/ingest`

目标：将已有上传和任务能力从 Chats 侧栏升级为独立工作页。

任务：

- 复用 `uploadIngestDocument`、`listIngestJobs` 和 `getIngestJob`。
- 支持拖放/选择文件、任务列表、任务详情和轮询。
- 当前接口只有 `queued / running / succeeded / failed`，首期按真实状态展示，不伪造百分比。
- 成功任务展示新增/更新页面、矛盾、断链和未索引项。
- `succeeded` 显示“知识已写入，等待 Quartz 发布”。
- 没有安全 Publish API 时，“构建并发布”必须禁用或替换为人工发布说明。
- 可以保留 Chats 中的简短上传入口，但它只能跳转或创建任务，不能继续承担完整入库中心。

### Phase F5：响应式、可访问性与收尾

- `>=1280px` 显示完整布局。
- `960–1279px` 收起右侧证据/上下文栏。
- `<960px` 主导航折叠，页面单列。
- 所有按钮、链接、输入和筛选项有可见焦点。
- 支持 `prefers-reduced-motion`。
- 检查长中文标题、英文文件名、错误文本和空数据。
- 不以颜色作为唯一状态信号。

## 8. 当前 API 使用约定

| 功能 | 接口 |
|---|---|
| 会话列表/创建 | `GET/POST /api/chats` |
| 问答历史/发送 | `GET/POST /api/chats/{id}/messages` |
| 会话重命名 | `PATCH /api/chats/{id}` |
| 保存 Synthesis | `POST /api/synthesis` |
| 上传和创建任务 | `POST /api/ingest/jobs` |
| 最近任务 | `GET /api/ingest/jobs?limit=20` |
| 任务详情 | `GET /api/ingest/jobs/{job_id}` |
| 静态知识索引 | `GET /static/contentIndex.json` |

前端应对后端新增字段宽容，但不得假设尚不存在的字段已经可用。

## 9. 不在本线程首期范围

- 修改 `llm-wiki-agent` 源码或知识数据模型。
- 将 Quartz 替换为 React/Next.js/Vue SPA。
- 多人实时编辑。
- 自动 Quartz Publish API。
- 用户认证、权限和系统设置页面。
- 重做 Graph 算法。
- 手工修改 `public/`。

## 10. 验证命令

Windows 开发环境优先使用 `npm.cmd` / `npx.cmd`：

```powershell
cd .local-plugins\chats
npm.cmd run build

cd ..\.. 
npx.cmd tsc --noEmit
$env:CHAT_PROXY_URL="/api"
npx.cmd quartz build -d ..\llm-wiki-agent\wiki
```

若新增本地插件，先在该插件目录完成依赖安装、类型检查和 build，再执行 Quartz build。

DGX 最终验证：

```bash
cd /home/dgx/Projects/knowledge_base_mkt/quartz

cd .local-plugins/chats
npm run build
cd ../..

CHAT_PROXY_URL=/api npx quartz build \
  -d /home/dgx/Projects/knowledge_base_mkt/llm-wiki-agent/wiki

test -s public/index.html
test -s public/chats.html
test -s public/static/contentIndex.json
grep -R '/quartz/' public/index.html public/chats.html && exit 1 || true
grep -n 'data-proxy-url="/api"' public/chats.html
```

HTTP 验证：

```bash
curl --fail --silent --show-error http://127.0.0.1:8080/ > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/library > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/chats > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/ingest > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/static/contentIndex.json > /dev/null
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
```

## 11. 完成标准

- 四个目标页面由真实 Quartz/后端数据驱动。
- 原生 Markdown 渲染和知识导航能力无回归。
- 产品名称和视觉 Token 全站一致。
- 只有一套主导航。
- Chats 功能和 Synthesis 保存状态没有回归。
- Ingest 与 Publish 语义严格区分。
- 插件 `src`、`dist` 和 Quartz 构建产物链路已经验证。
- Windows 验证后完成 DGX ARM64 构建和双入口检查。

## 12. 建议给新线程的首条指令

```text
请通读 AGENTS.md、../AGENTS.md 和 KNOWLEDGE_PLATFORM_UI_IMPLEMENTATION_PLAN.md，
并以 ../UI_PRODUCT_SPEC.md、../design/ui-prototypes/ 为产品与视觉基线。

先检查当前工作树和 Quartz v5 的 PageType/layout/本地插件实现，
然后严格按 Phase F0 → F1 的顺序完成第一阶段：
1. 统一产品名称、视觉 Token 和唯一全局导航；
2. 实现真实数据驱动的首页；
3. 保持 Markdown、Search、Explorer、TOC、Backlinks、Graph 和 /api 架构不变；
4. 完成插件构建、Quartz build、浏览器截图与规定的静态检查。

不要修改 llm-wiki-agent，不要手工修改 public，不要提前实现自动发布 API。
完成 F0/F1 后报告变更、验证结果和进入 F2 前仍需确认的问题。
```
