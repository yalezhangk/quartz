import assert from "node:assert/strict"
import { access, mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { collectPublishedSourceFiles, copyPublishedSourceFiles } from "./source-files"

function sourceContent(sourceFile: unknown, slug: string = "sources/report") {
  return [null, { data: { slug, frontmatter: { source_file: sourceFile } } }] as never
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "quartz-source-files-"))
  const manualRoot = path.join(root, "raw", "uploads", "manual")
  const legacyRoot = path.join(root, "raw", "MVE")
  const legacyUploadsRoot = path.join(root, "raw", "uploads")
  const outputDirectory = path.join(root, "public")
  await mkdir(manualRoot, { recursive: true })
  await mkdir(legacyRoot, { recursive: true })
  await mkdir(legacyUploadsRoot, { recursive: true })
  await writeFile(path.join(manualRoot, "report.pdf"), "report")
  await writeFile(path.join(legacyRoot, "legacy-report.pdf"), "legacy")
  await writeFile(path.join(legacyUploadsRoot, "old.md"), "old")
  await writeFile(path.join(legacyRoot, "unreferenced.pdf"), "private")
  return { root, manualRoot, legacyRoot, outputDirectory }
}

test("only collects raw files from published Source pages", () => {
  assert.deepEqual(
    collectPublishedSourceFiles([
      sourceContent("raw/uploads/manual/report.pdf"),
      sourceContent("raw/uploads/report.pdf"),
      sourceContent("raw/MVE/legacy-report.pdf"),
      sourceContent("raw/uploads/manual/private.pdf", "entities/private"),
      sourceContent("raw/uploads/manual/report.pdf"),
      sourceContent("https://example.com/report.pdf"),
    ]),
    [
      {
        sourceFile: "raw/uploads/manual/report.pdf",
        kind: "manual",
        relativeOutputPath: "report.pdf",
      },
      {
        sourceFile: "raw/uploads/report.pdf",
        kind: "legacy",
        relativeOutputPath: "uploads/report.pdf",
      },
      {
        sourceFile: "raw/MVE/legacy-report.pdf",
        kind: "legacy",
        relativeOutputPath: "MVE/legacy-report.pdf",
      },
    ],
  )
})

test("copies referenced manual and legacy files to separate namespaces", async () => {
  const fixture = await createFixture()
  const emitted = await copyPublishedSourceFiles({
    outputDirectory: fixture.outputDirectory,
    sourceRoot: fixture.root,
    sourceFiles: [
      "raw/uploads/manual/report.pdf",
      "raw/uploads/manual/report.pdf",
      "raw/MVE/legacy-report.pdf",
      "raw/uploads/old.md",
    ],
  })

  assert.equal(emitted.length, 3)
  assert.equal(
    await readFile(path.join(fixture.outputDirectory, "source-files", "manual", "report.pdf"), "utf8"),
    "report",
  )
  assert.equal(
    await readFile(
      path.join(fixture.outputDirectory, "source-files", "legacy", "MVE", "legacy-report.pdf"),
      "utf8",
    ),
    "legacy",
  )
  assert.equal(
    await readFile(path.join(fixture.outputDirectory, "source-files", "legacy", "uploads", "old.md"), "utf8"),
    "old",
  )
  await assert.rejects(access(path.join(fixture.outputDirectory, "source-files", "legacy", "MVE", "unreferenced.pdf")))
})

test("rejects unsafe, missing, and directory source files", async () => {
  const fixture = await createFixture()
  await mkdir(path.join(fixture.legacyRoot, "directory"))

  for (const sourceFile of [
    "raw/MVE/../legacy-report.pdf",
    "/raw/MVE/legacy-report.pdf",
    "raw\\MVE\\legacy-report.pdf",
    "raw/MVE/missing.pdf",
    "raw/MVE/directory",
  ]) {
    await assert.rejects(
      copyPublishedSourceFiles({
        outputDirectory: fixture.outputDirectory,
        sourceRoot: fixture.root,
        sourceFiles: [sourceFile],
      }),
    )
  }
})

test("rejects symlink escapes", async (t) => {
  const fixture = await createFixture()
  const outside = path.join(fixture.root, "outside.pdf")
  await writeFile(outside, "outside")
  try {
    await symlink(outside, path.join(fixture.legacyRoot, "escaped.pdf"))
  } catch {
    t.skip("当前环境不允许创建文件符号链接")
    return
  }

  await assert.rejects(
    copyPublishedSourceFiles({
      outputDirectory: fixture.outputDirectory,
      sourceRoot: fixture.root,
      sourceFiles: ["raw/MVE/escaped.pdf"],
    }),
  )
})
