import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "@quartz-community/types"
import type { KnowledgeObject } from "../knowledge"

const MANUAL_SOURCE_PREFIX = "raw/uploads/manual/"
const NEW_TAB_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "md",
  "markdown",
  "txt",
])

export interface SourceReference {
  href: string
  label: string
  detail: string
  marker: string
  searchText: string
  target?: "_blank"
  rel?: "noopener noreferrer"
  download?: true
}

function getFileExtension(filename: string): string | null {
  const extension = filename.split(".").pop()?.trim().toLowerCase()
  return extension && extension !== filename.toLowerCase() ? extension : null
}

function getManualSourceReference(sourceFile: string): SourceReference | null {
  if (!sourceFile.startsWith(MANUAL_SOURCE_PREFIX)) return null
  if (sourceFile.includes("\\")) return null
  const relativePath = sourceFile.slice(MANUAL_SOURCE_PREFIX.length)
  const segments = relativePath.split("/")
  if (!relativePath || segments.some((segment) => !segment || segment === "." || segment === "..")) return null

  const filename = segments.at(-1)!
  const extension = getFileExtension(filename)
  const normalizedExtension = extension?.toUpperCase() ?? "文件"
  const opensInNewTab = extension ? NEW_TAB_EXTENSIONS.has(extension) : false
  return {
    href: `/source-files/manual/${segments.map(encodeURIComponent).join("/")}`,
    label: opensInNewTab ? "查看原文" : "下载原文件",
    detail: `${filename} · ${normalizedExtension} · 人工上传`,
    marker: `[${normalizedExtension}] ${filename}`,
    searchText: filename,
    ...(opensInNewTab ? { target: "_blank" as const, rel: "noopener noreferrer" as const } : { download: true }),
  }
}

function getExternalSourceReference(sourceUrl: string): SourceReference | null {
  try {
    const url = new URL(sourceUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return {
      href: url.href,
      label: "访问原文",
      detail: `${url.hostname} · 定时同步`,
      marker: `[URL] ${url.hostname}`,
      searchText: url.hostname,
      target: "_blank",
      rel: "noopener noreferrer",
    }
  } catch {
    return null
  }
}

export function getSourceReference(
  object: Pick<KnowledgeObject, "type" | "sourceFile" | "sourceUrl">,
): SourceReference | null {
  if (object.type !== "source" || (object.sourceFile && object.sourceUrl)) return null
  if (object.sourceFile) return getManualSourceReference(object.sourceFile)
  if (object.sourceUrl) return getExternalSourceReference(object.sourceUrl)
  return null
}

export default (() => {
  const SourceReferenceCard: QuartzComponent = (props: QuartzComponentProps) => {
    const frontmatter = props.fileData.frontmatter
    if (String(frontmatter?.type ?? "").trim().toLowerCase() !== "source") return null
    const sourceFile = typeof frontmatter?.source_file === "string" ? frontmatter.source_file.trim() : null
    const sourceUrl = typeof frontmatter?.source_url === "string" ? frontmatter.source_url.trim() : null
    const reference = getSourceReference({ type: "source", sourceFile, sourceUrl })
    if (!reference) return null

    return (
      <section class="source-reference-card" aria-labelledby="source-reference-title">
        <p>原始来源</p>
        <h2 id="source-reference-title">{reference.detail}</h2>
        <a
          class="source-reference-link"
          href={reference.href}
          target={reference.target}
          rel={reference.rel}
          download={reference.download ? "" : undefined}
          data-router-ignore
        >
          {reference.label}
        </a>
      </section>
    )
  }

  return SourceReferenceCard
}) satisfies QuartzComponentConstructor
