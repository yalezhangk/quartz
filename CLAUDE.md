# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是 Quartz v5 的分支，一个基于 Markdown 的静态站点生成器。本项目在此基础上添加了自定义本地插件 `chats`，为知识库提供 AI 聊天交互功能。

## 常用命令

```bash
# 安装依赖（Node >= 22, npm >= 10.9.2）
npm ci

# 本地开发：构建并启动预览服务器（含热重载）
npx quartz build --serve

# 仅构建（输出到 public/）
npx quartz build

# 类型检查 + 格式化检查
npm run check

# 自动格式化
npm run format

# 运行测试
npm test

# 安装/更新社区插件
npx quartz plugin install

# 同步到 Git 远程仓库
npx quartz sync
```

**Chats 后端配置**：通过环境变量 `CHAT_PROXY_URL` 控制聊天插件后端地址，本地开发设为 `http://127.0.0.1:8081`，线上部署不设置则回退到 `/api`：

```bash
export CHAT_PROXY_URL="http://127.0.0.1:8081"
npx quartz build --serve
```

## 核心架构

### 构建管道

```
bootstrap-cli.mjs → esbuild 转译 → quartz/build.ts → 三步管道:
  1. parseMarkdown  →  2. filterContent  →  3. emitContent
```

- `quartz/bootstrap-cli.mjs`：CLI 入口，参数解析、esbuild 打包、开发服务器（HTTP + WebSocket 热重载）
- `quartz/build.ts`：构建主流程，支持全量构建和增量 rebuild（chokidar 监听，250ms 防抖）
- 并发处理：内容 >128 篇时使用 workerpool 多线程解析（`quartz/worker.ts`）

### 关键目录

| 目录 | 职责 |
|------|------|
| `quartz/cli/` | CLI 子命令（build, create, sync, upgrade, plugin） |
| `quartz/components/` | Preact JSX 组件（页面渲染、布局、frames） |
| `quartz/plugins/` | 插件系统核心：transformers、filters、emitters、pageTypes |
| `quartz/processors/` | 构建三步：parse.ts、filter.ts、emit.ts |
| `quartz/styles/` | SCSS 样式（base、callouts、syntax、custom、variables） |
| `quartz/i18n/` | 国际化支持 |
| `quartz/util/` | 工具函数（路径处理、资源管理、追踪等） |
| `content/` | 内容目录（symlink 指向外部 wiki 仓库） |
| `public/` | 构建输出目录 |
| `.quartz/` | 缓存和社区插件安装目录 |

### 配置文件

- `quartz.config.yaml`：站点配置 + 插件声明。重要：**已修改版本**，默认模版在 `quartz.config.default.yaml`
- `quartz.ts`：运行时入口，加载 YAML 配置和布局
- `quartz.lock.json`：插件版本锁定文件
- `tsconfig.json`：使用 Preact JSX（`jsxImportSource: "preact"`），ESNext 模块

### 插件系统

四种插件类型（定义在 `quartz/plugins/types.ts`）：

1. **Transformers**：内容转换（frontmatter 解析、语法高亮、描述生成）— `textTransform` / `markdownPlugins` / `htmlPlugins`
2. **Filters**：内容过滤（排除草稿、显式发布）— `shouldPublish()`
3. **Emitters**：输出生成（RSS、sitemap、HTML 页面、静态资源）— `emit()` / `partialEmit()`
4. **PageTypes**：页面类型定义（内容页、文件夹列表、标签页、404、Canvas、Bases）— `match()` + `layout` + `body` 组件

社区插件自动安装到 `.quartz/plugins/`，通过自动生成的 `.quartz/plugins/index.ts` 重导出。本地插件放在 `.local-plugins/` 目录。

### Chats 本地插件（`.local-plugins/chats/`）

自定义 AI 聊天界面插件，注册虚拟页 `/chats`：

- **`src/pageType.ts`**：注册 `ChatPageType`，定义虚拟页面匹配和生成逻辑
- **`src/components/ChatPage.tsx`**：聊天页面骨架（左侧历史列表、消息区、输入区），通过 `data-proxy-url` 传递后端地址
- **`src/components/scripts/chat.inline.ts`**：前端核心逻辑 — 会话管理（localStorage）、API 调用、轻量 Markdown 渲染、wiki-link 解析、复制按钮
- **`src/components/styles/chat.scss`**：聊天页专用样式，覆盖 Quartz 默认三列布局
- **`src/types.ts`**：Conversation、Message 等类型定义

关键约定：
- 后端接口：`POST /api/query`（通过 `proxyUrl` 配置）
- 聊天历史仅存浏览器 localStorage，后端无会话持久化
- wiki-link 解析依赖 `/static/contentIndex.json`（由 `content-index` 插件生成）
- Markdown 渲染为轻量自定义实现（非完整解析器，不支持表格、代码块等）

### 页面 Frame 系统

`quartz/components/frames/` 提供三种内置 frame：
- **DefaultFrame**：三栏布局（左侧栏、中间、右侧栏、页脚）
- **FullWidthFrame**：无侧栏，单列居中
- **MinimalFrame**：无侧栏/页头，仅内容和页脚

Chats 页面使用自定义布局，通过 CSS 覆盖默认三列框架。

## 版本信息

- Node: v22.16.0
- 主分支: `v5`（上游 Quartz v5）
- 当前开发分支: `mvc_sample`
