import { realpath, lstat, mkdir, cp } from 'fs/promises';
import path from 'path';

// src/source-files.ts
var MANUAL_SOURCE_PREFIX = "raw/uploads/manual/";
function isWithin(root, target) {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}
function isPublishedSource(data) {
  return typeof data.slug === "string" && /^sources\/.+/.test(data.slug) && !data.slug.endsWith("/index");
}
function getManualSourceFile(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const sourceFile = value.trim();
  if (sourceFile.startsWith(MANUAL_SOURCE_PREFIX)) return sourceFile;
  if (sourceFile.startsWith("raw/")) return null;
  throw new Error(`Invalid source_file: ${sourceFile}`);
}
function collectManualSourceFiles(content) {
  const sourceFiles = /* @__PURE__ */ new Set();
  for (const [, file] of content) {
    const data = file.data;
    if (!isPublishedSource(data)) continue;
    const sourceFile = getManualSourceFile(data.frontmatter?.source_file);
    if (sourceFile) sourceFiles.add(sourceFile);
  }
  return [...sourceFiles];
}
function getManualRelativePath(sourceFile) {
  if (!sourceFile.startsWith(MANUAL_SOURCE_PREFIX)) {
    throw new Error(`source_file must start with ${MANUAL_SOURCE_PREFIX}: ${sourceFile}`);
  }
  if (path.posix.isAbsolute(sourceFile) || path.win32.isAbsolute(sourceFile) || sourceFile.includes("\\")) {
    throw new Error(`source_file must be a POSIX relative path: ${sourceFile}`);
  }
  const relativePath = sourceFile.slice(MANUAL_SOURCE_PREFIX.length);
  const segments = relativePath.split("/");
  if (!relativePath || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`source_file contains an unsafe path segment: ${sourceFile}`);
  }
  return relativePath;
}
async function copyManualSourceFiles({
  outputDirectory,
  sourceRoot,
  sourceFiles
}) {
  if (sourceFiles.length === 0) return [];
  const manualRoot = await realpath(path.join(sourceRoot, "raw", "uploads", "manual"));
  const copiedSourcePaths = /* @__PURE__ */ new Set();
  const emitted = [];
  for (const sourceFile of sourceFiles) {
    const relativePath = getManualRelativePath(sourceFile);
    const sourcePath = path.resolve(sourceRoot, ...sourceFile.split("/"));
    const realSourcePath = await realpath(sourcePath);
    if (!isWithin(manualRoot, realSourcePath)) {
      throw new Error(`source_file resolves outside raw/uploads/manual: ${sourceFile}`);
    }
    const metadata = await lstat(realSourcePath);
    if (!metadata.isFile()) {
      throw new Error(`source_file must reference a file: ${sourceFile}`);
    }
    if (copiedSourcePaths.has(realSourcePath)) continue;
    const destination = path.join(outputDirectory, "source-files", "manual", ...relativePath.split("/"));
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(realSourcePath, destination, { force: true });
    copiedSourcePaths.add(realSourcePath);
    emitted.push(destination);
  }
  return emitted;
}
function getSourceRoot(directory) {
  const configuredRoot = process.env.WIKI_SOURCE_ROOT?.trim();
  if (configuredRoot) return path.resolve(configuredRoot);
  const inputDirectory = path.resolve(directory);
  if (path.basename(inputDirectory) !== "wiki") {
    throw new Error("WIKI_SOURCE_ROOT is required when the Quartz input is not the real wiki directory");
  }
  return path.dirname(inputDirectory);
}
var SourceFiles = () => ({
  name: "SourceFiles",
  async *emit(ctx, content) {
    const sourceFiles = collectManualSourceFiles(content);
    const emitted = await copyManualSourceFiles({
      outputDirectory: ctx.argv.output,
      sourceRoot: getSourceRoot(ctx.argv.directory),
      sourceFiles
    });
    yield* emitted;
  },
  async *partialEmit() {
  }
});

export { SourceFiles, SourceFiles as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map