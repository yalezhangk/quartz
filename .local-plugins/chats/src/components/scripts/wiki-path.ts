export function normalizeWikiPath(value: string): string {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^wiki\//i, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.md$/i, "")
}
