export type KnowledgeObjectType = "source" | "entity" | "concept" | "synthesis"

interface FileDates {
  modified?: unknown
}

export interface KnowledgeFileData {
  slug?: unknown
  description?: unknown
  text?: unknown
  unlisted?: unknown
  dates?: FileDates
  frontmatter?: Record<string, unknown>
}

export interface KnowledgeObject {
  slug: string
  title: string
  type: KnowledgeObjectType
  code: "SRC" | "ENT" | "CON" | "SYN"
  description: string
  hasDescription: boolean
  tags: string[]
  updatedAt: Date | null
  sourceFile: string | null
  sourceUrl: string | null
}

export interface KnowledgeQualitySummary {
  total: number
  missingDescriptions: number
  missingTags: number
  missingDates: number
  affectedObjects: number
}

const TYPE_CODES: Record<KnowledgeObjectType, KnowledgeObject["code"]> = {
  source: "SRC",
  entity: "ENT",
  concept: "CON",
  synthesis: "SYN",
}

function normalizeType(value: unknown): KnowledgeObjectType | null {
  if (typeof value !== "string") return null

  const aliases: Record<string, KnowledgeObjectType> = {
    source: "source",
    sources: "source",
    entity: "entity",
    entities: "entity",
    concept: "concept",
    concepts: "concept",
    synthesis: "synthesis",
    syntheses: "synthesis",
  }
  const normalized = value.trim().toLowerCase()
  const matched = aliases[normalized]
  if (matched) return matched

  if (
    normalized === "source" ||
    normalized === "entity" ||
    normalized === "concept" ||
    normalized === "synthesis"
  ) {
    return normalized
  }
  return null
}

export function detectKnowledgeType(file: KnowledgeFileData): KnowledgeObjectType | null {
  const frontmatterType = normalizeType(file.frontmatter?.type)
  if (frontmatterType) return frontmatterType

  if (typeof file.slug !== "string") return null
  const root = file.slug.split("/", 1)[0]
  return normalizeType(root)
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value !== "string" && typeof value !== "number") return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getKnowledgeUpdatedAt(file: KnowledgeFileData): Date | null {
  return (
    parseDate(file.frontmatter?.last_updated) ??
    parseDate(file.frontmatter?.modified) ??
    parseDate(file.dates?.modified)
  )
}

function getTitle(file: KnowledgeFileData, slug: string): string {
  const title = file.frontmatter?.title
  if (typeof title === "string" && title.trim()) return title.trim()
  return slug.split("/").pop() ?? slug
}

function getDescription(file: KnowledgeFileData): string {
  const candidates = [file.description, file.frontmatter?.description]
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return "暂无摘要；打开页面查看完整资料。"
}

function hasDescription(file: KnowledgeFileData): boolean {
  return [file.description, file.frontmatter?.description].some(
    (value) => typeof value === "string" && value.trim().length > 0,
  )
}

function getTags(file: KnowledgeFileData): string[] {
  const tags = file.frontmatter?.tags
  if (!Array.isArray(tags)) return []
  return tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
}

function getRawSourceFile(value: unknown): string | null {
  if (typeof value !== "string") return null
  const sourceFile = value.trim()
  if (!sourceFile.startsWith("raw/") || sourceFile.includes("\\")) return null

  const segments = sourceFile.split("/")
  return segments.length >= 2 && !segments.some((segment) => !segment || segment === "." || segment === "..")
    ? sourceFile
    : null
}

function getExternalSourceUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null
  } catch {
    return null
  }
}

function getSourceOrigin(
  file: KnowledgeFileData,
  type: KnowledgeObjectType,
): Pick<KnowledgeObject, "sourceFile" | "sourceUrl"> {
  if (type !== "source") return { sourceFile: null, sourceUrl: null }

  const rawSourceFile = file.frontmatter?.source_file
  const rawSourceUrl = file.frontmatter?.source_url
  const hasBothOrigins =
    typeof rawSourceFile === "string" && rawSourceFile.trim() &&
    typeof rawSourceUrl === "string" && rawSourceUrl.trim()
  if (hasBothOrigins) return { sourceFile: null, sourceUrl: null }

  return {
    sourceFile: getRawSourceFile(rawSourceFile),
    sourceUrl: getExternalSourceUrl(rawSourceUrl),
  }
}

export function getKnowledgeObjects(files: KnowledgeFileData[]): KnowledgeObject[] {
  const objects: KnowledgeObject[] = []

  for (const file of files) {
    if (file.unlisted === true || typeof file.slug !== "string") continue
    if (file.slug.endsWith("/index")) continue

    const type = detectKnowledgeType(file)
    if (!type) continue

    objects.push({
      slug: file.slug,
      title: getTitle(file, file.slug),
      type,
      code: TYPE_CODES[type],
      description: getDescription(file),
      hasDescription: hasDescription(file),
      tags: getTags(file),
      updatedAt: getKnowledgeUpdatedAt(file),
      ...getSourceOrigin(file, type),
    })
  }

  return objects
}

export function getKnowledgeQualitySummary(objects: KnowledgeObject[]): KnowledgeQualitySummary {
  const affectedObjects = objects.filter(
    (object) => !object.hasDescription || object.tags.length === 0 || object.updatedAt === null,
  ).length

  return {
    total: objects.length,
    missingDescriptions: objects.filter((object) => !object.hasDescription).length,
    missingTags: objects.filter((object) => object.tags.length === 0).length,
    missingDates: objects.filter((object) => object.updatedAt === null).length,
    affectedObjects,
  }
}

export function getTopTags(objects: KnowledgeObject[], limit: number = 4): string[] {
  const counts = new Map<string, number>()
  for (const object of objects) {
    for (const tag of new Set(object.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort(([leftTag, leftCount], [rightTag, rightCount]) => {
      return rightCount - leftCount || leftTag.localeCompare(rightTag)
    })
    .slice(0, Math.max(0, limit))
    .map(([tag]) => tag)
}
