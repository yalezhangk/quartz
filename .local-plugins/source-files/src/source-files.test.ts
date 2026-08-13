import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { collectManualSourceFiles, copyManualSourceFiles } from "./source-files"

function sourceContent(sourceFile: unknown, slug: string = "sources/report") {
  return [null, { data: { slug, frontmatter: { source_file: sourceFile } } }] as never
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "quartz-source-files-"))
  const manualRoot = path.join(root, "raw", "uploads", "manual")
  const outputDirectory = path.join(root, "public")
  await mkdir(manualRoot, { recursive: true })
  await writeFile(path.join(manualRoot, "report.pdf"), "report")
  return { root, manualRoot, outputDirectory }
}

test("only collects manual files from published Source pages", () => {
  assert.deepEqual(
    collectManualSourceFiles([
      sourceContent("raw/uploads/manual/report.pdf"),
      sourceContent("raw/uploads/report.pdf"),
      sourceContent("raw/MVE/legacy-report.pdf"),
      sourceContent("raw/uploads/manual/private.pdf", "entities/private"),
      sourceContent("raw/uploads/manual/report.pdf"),
    ]),
    ["raw/uploads/manual/report.pdf"],
  )
})

test("copies each referenced manual file once", async () => {
  const fixture = await createFixture()
  const emitted = await copyManualSourceFiles({
    outputDirectory: fixture.outputDirectory,
    sourceRoot: fixture.root,
    sourceFiles: ["raw/uploads/manual/report.pdf", "raw/uploads/manual/report.pdf"],
  })

  assert.equal(emitted.length, 1)
  assert.equal(
    await readFile(path.join(fixture.outputDirectory, "source-files", "manual", "report.pdf"), "utf8"),
    "report",
  )
})

test("rejects traversal, absolute paths, missing files, and symlink escapes", async (t) => {
  const fixture = await createFixture()
  const outside = path.join(fixture.root, "outside.pdf")
  await writeFile(outside, "outside")
  try {
    await symlink(outside, path.join(fixture.manualRoot, "escaped.pdf"))
  } catch {
    t.skip("当前环境不允许创建文件符号链接")
    return
  }

  for (const sourceFile of [
    "raw/uploads/manual/../report.pdf",
    "/raw/uploads/manual/report.pdf",
    "raw/uploads/manual/missing.pdf",
    "raw/uploads/manual/escaped.pdf",
  ]) {
    await t.test(sourceFile, async () => {
      await assert.rejects(
        copyManualSourceFiles({
          outputDirectory: fixture.outputDirectory,
          sourceRoot: fixture.root,
          sourceFiles: [sourceFile],
        }),
      )
    })
  }
})
