import createDOMPurify from "dompurify"
import { Marked, type TokenizerAndRendererExtension } from "marked"

interface WikiLinkToken {
  type: "wikiLink"
  raw: string
  target: string
  label: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const wikiLinkExtension: TokenizerAndRendererExtension = {
  name: "wikiLink",
  level: "inline",
  start(source: string): number | undefined {
    const index = source.indexOf("[[")
    return index >= 0 ? index : undefined
  },
  tokenizer(source: string): WikiLinkToken | undefined {
    const match = /^\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/.exec(source)
    if (!match) return undefined

    const target = match[1].trim()
    if (!target) return undefined

    return {
      type: "wikiLink",
      raw: match[0],
      target,
      label: (match[2] ?? target).trim(),
    }
  },
  renderer(token): string {
    const wikiLink = token as unknown as WikiLinkToken
    return `<a class="chat-wikilink unresolved" data-wiki-target="${escapeHtml(wikiLink.target)}" href="#">${escapeHtml(wikiLink.label)}</a>`
  },
}

const markdownParser = new Marked({
  async: false,
  breaks: false,
  gfm: true,
})

markdownParser.use({
  extensions: [wikiLinkExtension],
  renderer: {
    link({ href, title, tokens }): string {
      const titleAttribute = title ? ` title="${escapeHtml(title)}"` : ""
      const externalAttributes = /^https?:\/\//i.test(href)
        ? ' target="_blank" rel="noopener noreferrer"'
        : ""
      return `<a href="${escapeHtml(href)}"${titleAttribute}${externalAttributes}>${this.parser.parseInline(tokens)}</a>`
    },
  },
  hooks: {
    postprocess(html: string): string {
      return html
        .replace(/<table>/g, '<div class="message-table-wrap"><table>')
        .replace(/<\/table>/g, "</table></div>")
    },
  },
})

export function parseMarkdown(markdown: string): string {
  const html = markdownParser.parse(markdown)
  if (typeof html !== "string") {
    throw new TypeError("Synchronous Markdown rendering returned a non-string result")
  }
  return html
}

export function renderMarkdown(markdown: string): string {
  const purifier = createDOMPurify(window)
  purifier.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName !== "A") return

    const anchor = node as HTMLAnchorElement
    const isExternalHttpLink =
      (anchor.protocol === "http:" || anchor.protocol === "https:") &&
      anchor.origin !== window.location.origin

    if (isExternalHttpLink) {
      anchor.target = "_blank"
      anchor.rel = "noopener noreferrer"
      return
    }

    anchor.removeAttribute("target")
  })
  return purifier.sanitize(parseMarkdown(markdown), {
    ADD_ATTR: ["data-wiki-target", "target"],
    ALLOW_DATA_ATTR: true,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  })
}
