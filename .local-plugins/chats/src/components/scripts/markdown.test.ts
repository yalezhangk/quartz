import assert from "node:assert/strict"
import test from "node:test"
import { parseMarkdown, stripTrailingSourcesSection } from "./markdown"

test("renders paragraphs and all heading levels without forcing line breaks", () => {
  const markdown = [
    "# H1",
    "## H2",
    "### H3",
    "#### H4",
    "##### H5",
    "###### H6",
    "",
    "第一行\n第二行",
    "",
    "第二段",
  ].join("\n")
  const html = parseMarkdown(markdown)

  for (let level = 1; level <= 6; level += 1) {
    assert.match(html, new RegExp(`<h${level}>H${level}</h${level}>`))
  }
  assert.match(html, /<p>第一行\n第二行<\/p>/)
  assert.doesNotMatch(html, /<br>/)
  assert.match(html, /<p>第二段<\/p>/)
})

test("renders inline emphasis, deletion, code, links, and images", () => {
  const html = parseMarkdown(
    "**粗体** *斜体* ~~删除~~ `code` [站内](/docs) [外部](https://example.com) ![图](https://example.com/a.png)",
  )

  assert.match(html, /<strong>粗体<\/strong>/)
  assert.match(html, /<em>斜体<\/em>/)
  assert.match(html, /<del>删除<\/del>/)
  assert.match(html, /<code>code<\/code>/)
  assert.match(html, /<a href="\/docs">站内<\/a>/)
  assert.match(
    html,
    /<a href="https:\/\/example\.com" target="_blank" rel="noopener noreferrer">外部<\/a>/,
  )
  assert.match(html, /<img src="https:\/\/example\.com\/a\.png" alt="图">/)
})

test("renders ordered, unordered, nested, and task lists", () => {
  const html = parseMarkdown(
    ["1. 第一项", "2. 第二项", "", "- 父项", "  - 子项", "", "- [x] 完成", "- [ ] 待办"].join("\n"),
  )

  assert.match(html, /<ol>/)
  assert.match(html, /<li><p>父项<\/p>\n<ul>/)
  assert.match(html, /<input [^>]*checked=""[^>]*type="checkbox">/)
  assert.match(html, /<input [^>]*disabled=""[^>]*type="checkbox">/)
})

test("renders blockquotes, rules, fenced code, and preserves code whitespace", () => {
  const html = parseMarkdown("> 引用\n\n---\n\n```python\nif ready:\n    run()\n```")

  assert.match(html, /<blockquote>/)
  assert.match(html, /<hr>/)
  assert.match(html, /<pre><code class="language-python">if ready:\n    run\(\)\n<\/code><\/pre>/)
})

test("renders a GFM table inside its overflow wrapper", () => {
  const html = parseMarkdown("| A | B |\n| :--- | ---: |\n| 1 | 2 |")

  assert.match(html, /<div class="message-table-wrap"><table>/)
  assert.match(html, /<th align="left">A<\/th>/)
  assert.match(html, /<td align="right">2<\/td>/)
  assert.match(html, /<\/table><\/div>/)
})

test("renders Quartz wiki-links with labels, spaces, Chinese, and escaped attributes", () => {
  const html = parseMarkdown("[[Page]] [[中文 路径|显示文字]] [[R&D <指南>|安全 & 标签]]")

  assert.match(html, /class="chat-wikilink unresolved" data-wiki-target="Page" href="#">Page<\/a>/)
  assert.match(html, /data-wiki-target="中文 路径" href="#">显示文字<\/a>/)
  assert.match(html, /data-wiki-target="R&amp;D &lt;指南&gt;" href="#">安全 &amp; 标签<\/a>/)
})

test("renders numbered citations as links to the source list", () => {
  const html = parseMarkdown("结论可由资料核对。[1]")

  assert.match(
    html,
    /class="chat-citation" href="#chat-evidence-source-1" data-citation-index="1"/,
  )
})

test("removes a trailing Sources section from the assistant answer", () => {
  const markdown = "结论可由资料核对。[1]\n\n## Sources\n\n- 施耐德电气\n- PIX"
  const answer = stripTrailingSourcesSection(markdown)

  assert.equal(answer, "结论可由资料核对。[1]")
  assert.doesNotMatch(parseMarkdown(answer), /Sources|施耐德电气|PIX/)
})

test("keeps valid multiline Markdown unchanged before parsing", () => {
  const markdown = "## 标题\n\n段落\n\n- 第一项\n  - 第二项"
  const html = parseMarkdown(markdown)

  assert.match(html, /^<h2>标题<\/h2>\n<p>段落<\/p>\n<ul>/)
  assert.match(html, /<li>第一项\s*<ul>/)
})

test("passes raw HTML through marked for the sanitizer stage", () => {
  const html = parseMarkdown(
    '<script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">危险</a>',
  )

  assert.match(html, /<script>alert\(1\)<\/script>/)
  assert.match(html, /onclick="alert\(1\)"/)
})
