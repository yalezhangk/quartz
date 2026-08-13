import { cp, lstat, mkdir, realpath } from "node:fs/promises"
import path from "node:path"

type FilePath = string

interface QuartzEmitterContext {
  argv: {
    directory: string
    output: string
  }
}

interface QuartzEmitterPlugin {
  (): {
    name: string
    emit: (
      context: QuartzEmitterContext,
      content: unknown,
    ) => AsyncGenerator<FilePath, void, undefined>
    partialEmit: () => AsyncGenerator<never, void, undefined>
  }
}

const RAW_SOURCE_PREFIX = "raw/"
const MANUAL_SOURCE_PREFIX = "raw/uploads/manual/"

export type SourceFileKind = "manual" | "legacy"

export interface PublishedSourceFile {
  sourceFile: string
  kind: SourceFileKind
  relativeOutputPath: string
}

interface SourceFileData {
  slug?: unknown
  frontmatter?: Record<string, unknown>
}

type SourceFileContent = [unknown, { data: SourceFileData }]

interface CopySourceFilesOptions {
  outputDirectory: string
  sourceRoot: string
  sourceFiles: string[]
}

function isWithin(root: string, target: string): boolean {
  const relative = path.relative(root, target)
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)
}

function isPublishedSource(data: SourceFileData): boolean {
  return typeof data.slug === "string" && /^sources\/.+/.test(data.slug) && !data.slug.endsWith("/index")
}

export function getPublishedSourceFile(value: unknown): PublishedSourceFile | null {
  if (typeof value !== "string" || !value.trim()) return null
  const sourceFile = value.trim()
  if (path.posix.isAbsolute(sourceFile) || path.win32.isAbsolute(sourceFile) || sourceFile.includes("\\")) {
    throw new Error(`source_file must be a POSIX relative path: ${sourceFile}`)
  }
  if (!sourceFile.startsWith(RAW_SOURCE_PREFIX)) return null

  const segments = sourceFile.split("/")
  if (segments.length < 2 || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`source_file contains an unsafe path segment: ${sourceFile}`)
  }

  if (sourceFile.startsWith(MANUAL_SOURCE_PREFIX)) {
    const relativeOutputPath = sourceFile.slice(MANUAL_SOURCE_PREFIX.length)
    if (!relativeOutputPath) {
      throw new Error(`source_file contains an unsafe path segment: ${sourceFile}`)
    }
    return { sourceFile, kind: "manual", relativeOutputPath }
  }

  return {
    sourceFile,
    kind: "legacy",
    relativeOutputPath: sourceFile.slice(RAW_SOURCE_PREFIX.length),
  }
}

export function collectPublishedSourceFiles(content: SourceFileContent[]): PublishedSourceFile[] {
  const sourceFiles = new Map<string, PublishedSourceFile>()
  for (const [, file] of content) {
    const data = file.data
    if (!isPublishedSource(data)) continue
    const sourceFile = getPublishedSourceFile(data.frontmatter?.source_file)
    if (sourceFile) sourceFiles.set(sourceFile.sourceFile, sourceFile)
  }
  return [...sourceFiles.values()]
}

export async function copyPublishedSourceFiles({
  outputDirectory,
  sourceRoot,
  sourceFiles,
}: CopySourceFilesOptions): Promise<FilePath[]> {
  if (sourceFiles.length === 0) return []

  const rawRoot = await realpath(path.join(sourceRoot, "raw"))
  const copiedSourcePaths = new Set<string>()
  const emitted: FilePath[] = []

  for (const sourceFile of sourceFiles) {
    const publishedSourceFile = getPublishedSourceFile(sourceFile)
    if (!publishedSourceFile) continue

    const sourcePath = path.resolve(sourceRoot, ...publishedSourceFile.sourceFile.split("/"))
    const realSourcePath = await realpath(sourcePath)
    if (!isWithin(rawRoot, realSourcePath)) {
      throw new Error(`source_file resolves outside raw: ${sourceFile}`)
    }

    const metadata = await lstat(sourcePath)
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      throw new Error(`source_file must reference a regular file: ${sourceFile}`)
    }
    if (copiedSourcePaths.has(realSourcePath)) continue

    const destination = path.join(
      outputDirectory,
      "source-files",
      publishedSourceFile.kind,
      ...publishedSourceFile.relativeOutputPath.split("/"),
    )
    await mkdir(path.dirname(destination), { recursive: true })
    await cp(realSourcePath, destination, { force: true })
    copiedSourcePaths.add(realSourcePath)
    emitted.push(destination as FilePath)
  }

  return emitted
}

function getSourceRoot(directory: string): string {
  const configuredRoot = process.env.WIKI_SOURCE_ROOT?.trim()
  if (configuredRoot) return path.resolve(configuredRoot)

  const inputDirectory = path.resolve(directory)
  if (path.basename(inputDirectory) !== "wiki") {
    throw new Error("WIKI_SOURCE_ROOT is required when the Quartz input is not the real wiki directory")
  }
  return path.dirname(inputDirectory)
}

export const SourceFiles: QuartzEmitterPlugin = () => ({
  name: "SourceFiles",
  async *emit(ctx, content) {
    const sourceFiles = collectPublishedSourceFiles(content as unknown as SourceFileContent[]).map(
      ({ sourceFile }) => sourceFile,
    )
    const emitted = await copyPublishedSourceFiles({
      outputDirectory: ctx.argv.output,
      sourceRoot: getSourceRoot(ctx.argv.directory),
      sourceFiles,
    })
    yield* emitted
  },
  async *partialEmit() {},
})
