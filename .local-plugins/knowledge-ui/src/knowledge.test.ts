import assert from "node:assert/strict"
import test from "node:test"
import {
  detectKnowledgeType,
  getKnowledgeObjects,
  getKnowledgeQualitySummary,
  getKnowledgeUpdatedAt,
  getTopTags,
} from "./knowledge"
import { getSourceReference } from "./components/SourceReference"

test("frontmatter type takes precedence over the directory fallback", () => {
  assert.equal(
    detectKnowledgeType({ slug: "sources/example", frontmatter: { type: "entity" } }),
    "entity",
  )
  assert.equal(detectKnowledgeType({ slug: "concepts/example" }), "concept")
  assert.equal(detectKnowledgeType({ slug: "notes/example" }), null)
})

test("quality summary reports only real metadata gaps", () => {
  const objects = getKnowledgeObjects([
    {
      slug: "sources/complete",
      description: "Complete source",
      frontmatter: { tags: ["catalog"], last_updated: "2026-07-22" },
    },
    { slug: "entities/missing", frontmatter: {} },
  ])

  assert.deepEqual(getKnowledgeQualitySummary(objects), {
    total: 2,
    missingDescriptions: 1,
    missingTags: 1,
    missingDates: 1,
    affectedObjects: 1,
  })
})

test("knowledge objects exclude unlisted and directory index pages", () => {
  const objects = getKnowledgeObjects([
    { slug: "sources/a", frontmatter: { title: "A", type: "source" } },
    { slug: "entities/index", frontmatter: { type: "entity" } },
    { slug: "concepts/hidden", unlisted: true, frontmatter: { type: "concept" } },
  ])

  assert.deepEqual(
    objects.map((object) => object.slug),
    ["sources/a"],
  )
  assert.equal(objects[0].code, "SRC")
})

test("last_updated is preferred and top tags are based on real object frequency", () => {
  const updatedAt = getKnowledgeUpdatedAt({
    dates: { modified: new Date("2026-07-01") },
    frontmatter: { last_updated: "2026-07-20" },
  })
  assert.equal(updatedAt?.toISOString().slice(0, 10), "2026-07-20")

  const objects = getKnowledgeObjects([
    { slug: "sources/a", frontmatter: { tags: ["medium-voltage", "catalog"] } },
    { slug: "entities/b", frontmatter: { tags: ["medium-voltage", "product"] } },
  ])
  assert.deepEqual(getTopTags(objects, 2), ["medium-voltage", "catalog"])
})

test("Source metadata distinguishes manual files, scheduled URLs, and legacy Sources", () => {
  const [manual, scheduled, legacy, ambiguous] = getKnowledgeObjects([
    { slug: "sources/manual", frontmatter: { type: "source", source_file: "raw/uploads/manual/report.pdf" } },
    { slug: "sources/scheduled", frontmatter: { type: "source", source_url: "https://mp.weixin.qq.com/s/example" } },
    { slug: "sources/legacy", frontmatter: { type: "source", source_file: "raw/uploads/report.pdf" } },
    {
      slug: "sources/ambiguous",
      frontmatter: {
        type: "source",
        source_file: "raw/uploads/manual/report.pdf",
        source_url: "https://example.com/report",
      },
    },
  ])

  assert.deepEqual(
    { sourceFile: manual.sourceFile, sourceUrl: manual.sourceUrl },
    { sourceFile: "raw/uploads/manual/report.pdf", sourceUrl: null },
  )
  assert.equal(scheduled.sourceFile, null)
  assert.equal(scheduled.sourceUrl, "https://mp.weixin.qq.com/s/example")
  assert.deepEqual(
    { sourceFile: legacy.sourceFile, sourceUrl: legacy.sourceUrl },
    { sourceFile: null, sourceUrl: null },
  )
  assert.deepEqual(
    { sourceFile: ambiguous.sourceFile, sourceUrl: ambiguous.sourceUrl },
    { sourceFile: null, sourceUrl: null },
  )
})

test("Source references generate safe actions and searchable labels", () => {
  const manual = getSourceReference({
    type: "source",
    sourceFile: "raw/uploads/manual/equipment.docx",
    sourceUrl: null,
  })
  assert.deepEqual(manual, {
    href: "/source-files/manual/equipment.docx",
    label: "下载原文件",
    detail: "equipment.docx · DOCX · 人工上传",
    marker: "[DOCX] equipment.docx",
    searchText: "equipment.docx",
    download: true,
  })

  const scheduled = getSourceReference({
    type: "source",
    sourceFile: null,
    sourceUrl: "https://mp.weixin.qq.com/s/example",
  })
  assert.deepEqual(scheduled, {
    href: "https://mp.weixin.qq.com/s/example",
    label: "访问原文",
    detail: "mp.weixin.qq.com · 定时同步",
    marker: "[URL] mp.weixin.qq.com",
    searchText: "mp.weixin.qq.com",
    target: "_blank",
    rel: "noopener noreferrer",
  })
  assert.equal(
    getSourceReference({ type: "source", sourceFile: null, sourceUrl: "javascript:alert(1)" }),
    null,
  )
  assert.equal(
    getSourceReference({ type: "source", sourceFile: "raw/uploads/manual/..\\report.pdf", sourceUrl: null }),
    null,
  )
})
