import assert from "node:assert/strict"
import test from "node:test"
import { normalizeWikiPath } from "./wiki-path"

test("normalizes Markdown source paths to Quartz slugs", () => {
  assert.equal(normalizeWikiPath("entities/施耐德电气.md"), "entities/施耐德电气")
  assert.equal(normalizeWikiPath("wiki\\entities\\施耐德电气.md"), "entities/施耐德电气")
})
