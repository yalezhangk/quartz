import type { FullSlug, QuartzPageTypePlugin, VirtualPage } from "@quartz-community/types"
import KnowledgePageBody from "./components/KnowledgePage"

export const KnowledgePageType: QuartzPageTypePlugin = () => ({
  name: "KnowledgePageType",
  priority: 100,
  match: ({ slug }) => slug === "index" || slug === "library" || slug === "quality" || slug === "settings",
  generate() {
    const virtualPages: VirtualPage[] = [
      {
        slug: "library" as FullSlug,
        title: "知识库",
        data: {
          unlisted: true,
          description: "按来源资料、知识实体、核心概念和专题分析浏览已发布内容。",
        },
      },
      {
        slug: "quality" as FullSlug,
        title: "知识质量",
        data: {
          unlisted: true,
          description: "检查当前构建可确认的知识对象元数据完整性。",
        },
      },
      {
        slug: "settings" as FullSlug,
        title: "系统设置",
        data: {
          unlisted: true,
          description: "查看模型、Prompt、发布、用户与审计的运行管理边界。",
        },
      },
    ]
    return virtualPages
  },
  layout: "knowledge",
  frame: "default",
  body: KnowledgePageBody,
  treeTransforms: () => [
    (_root, slug, componentData) => {
      if (slug !== "index") return
      componentData.fileData.frontmatter = {
        ...componentData.fileData.frontmatter,
        title: "中压市场部知识库",
        description: "检索产品、技术参数、标准与设备关系，并基于已发布资料开展知识问答。",
      }
      componentData.fileData.description =
        "检索产品、技术参数、标准与设备关系，并基于已发布资料开展知识问答。"
    },
  ],
})
