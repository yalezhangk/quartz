import assert from "node:assert/strict"
import test from "node:test"
import {
  detectKnowledgeType,
  getKnowledgeObjects,
  getKnowledgeQualitySummary,
  getKnowledgeUpdatedAt,
  getTopTags,
} from "./knowledge"

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
