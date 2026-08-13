// ../knowledge-ui/node_modules/preact/dist/preact.mjs
var l;
l = { __e: function(n2, l2, u3, t2) {
  for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
    if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
  } catch (l3) {
    n2 = l3;
  }
  throw n2;
} }, "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Math.random().toString(8);

// ../knowledge-ui/node_modules/preact/jsx-runtime/dist/jsxRuntime.mjs
var f2 = 0;
function u2(e2, t2, n2, o2, i2, u3) {
  t2 || (t2 = {});
  var a2, c2, p2 = t2;
  if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
  var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f2, __i: -1, __u: 0, __source: i2, __self: u3 };
  if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
  return l.vnode && l.vnode(l2), l2;
}

// ../knowledge-ui/src/components/SourceReference.tsx
var MANUAL_SOURCE_PREFIX = "raw/uploads/manual/";
var NEW_TAB_EXTENSIONS = /* @__PURE__ */ new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "md",
  "markdown",
  "txt"
]);
function getFileExtension(filename) {
  const extension = filename.split(".").pop()?.trim().toLowerCase();
  return extension && extension !== filename.toLowerCase() ? extension : null;
}
function getManualSourceReference(sourceFile) {
  if (!sourceFile.startsWith(MANUAL_SOURCE_PREFIX)) return null;
  if (sourceFile.includes("\\")) return null;
  const relativePath = sourceFile.slice(MANUAL_SOURCE_PREFIX.length);
  const segments = relativePath.split("/");
  if (!relativePath || segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  const filename = segments.at(-1);
  const extension = getFileExtension(filename);
  const normalizedExtension = extension?.toUpperCase() ?? "\u6587\u4EF6";
  const opensInNewTab = extension ? NEW_TAB_EXTENSIONS.has(extension) : false;
  return {
    href: `/source-files/manual/${segments.map(encodeURIComponent).join("/")}`,
    label: opensInNewTab ? "\u67E5\u770B\u539F\u6587" : "\u4E0B\u8F7D\u539F\u6587\u4EF6",
    detail: `${filename} \xB7 ${normalizedExtension} \xB7 \u4EBA\u5DE5\u4E0A\u4F20`,
    marker: `[${normalizedExtension}] ${filename}`,
    searchText: filename,
    ...opensInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : { download: true }
  };
}
function getExternalSourceReference(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return {
      href: url.href,
      label: "\u8BBF\u95EE\u539F\u6587",
      detail: `${url.hostname} \xB7 \u5B9A\u65F6\u540C\u6B65`,
      marker: `[URL] ${url.hostname}`,
      searchText: url.hostname,
      target: "_blank",
      rel: "noopener noreferrer"
    };
  } catch {
    return null;
  }
}
function getSourceReference(object) {
  if (object.sourceFile && object.sourceUrl) return null;
  if (object.sourceFile) return getManualSourceReference(object.sourceFile);
  if (object.sourceUrl) return getExternalSourceReference(object.sourceUrl);
  return null;
}
var SourceReference_default = (() => {
  const SourceReferenceCard = (props) => {
    const frontmatter = props.fileData.frontmatter;
    if (String(frontmatter?.type ?? "").trim().toLowerCase() !== "source") return null;
    const sourceFile = typeof frontmatter?.source_file === "string" ? frontmatter.source_file.trim() : null;
    const sourceUrl = typeof frontmatter?.source_url === "string" ? frontmatter.source_url.trim() : null;
    const reference = getSourceReference({ sourceFile, sourceUrl });
    if (!reference) return null;
    return /* @__PURE__ */ u2("section", { class: "source-reference-card", "aria-labelledby": "source-reference-title", children: [
      /* @__PURE__ */ u2("p", { children: "\u539F\u59CB\u6765\u6E90" }),
      /* @__PURE__ */ u2("h2", { id: "source-reference-title", children: reference.detail }),
      /* @__PURE__ */ u2(
        "a",
        {
          class: "source-reference-link",
          href: reference.href,
          target: reference.target,
          rel: reference.rel,
          download: reference.download ? "" : void 0,
          "data-router-ignore": true,
          children: reference.label
        }
      )
    ] });
  };
  return SourceReferenceCard;
});

export { SourceReference_default as SourceReference };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map