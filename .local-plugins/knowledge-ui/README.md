# Knowledge UI Plugin

该插件承载“中压-市场部 样本知识库”的产品级应用外壳和专用 Quartz 页面。

- `AppNavigation`：唯一的产品主导航；Quartz Explorer 继续作为知识正文二级目录。
- `KnowledgePageType`：统一分派首页和 `/library`，并在构建期生成知识库虚拟页面。
- `HomePage`：使用构建期 `allFiles` 输出真实统计和最近更新。
- `LibraryPage`：提供真实知识对象的类型筛选、当前结果搜索和排序。
- `knowledge.ts`：统一知识对象类型、日期、标签和摘要适配，不复制 Markdown 正文。

构建：

```powershell
npm.cmd run build
```

完成插件构建后，再从 Quartz 根目录使用真实 Wiki 内容源构建 `public/`。
