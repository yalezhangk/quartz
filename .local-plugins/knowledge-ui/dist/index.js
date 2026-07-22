// ../../node_modules/github-slugger/index.js
var l;
l = { __e: function(n2, l2, u3, t2) {
  for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
    if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
  } catch (l3) {
    n2 = l3;
  }
  throw n2;
} }, "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Math.random().toString(8);

// node_modules/preact/jsx-runtime/dist/jsxRuntime.mjs
var f2 = 0;
function u2(e2, t2, n2, o2, i2, u3) {
  t2 || (t2 = {});
  var a2, c2, p2 = t2;
  if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
  var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f2, __i: -1, __u: 0, __source: i2, __self: u3 };
  if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
  return l.vnode && l.vnode(l2), l2;
}

// node_modules/@quartz-community/utils/dist/index.js
function simplifySlug(fp) {
  const res = stripSlashes(trimSuffix(fp, "index"), true);
  return res.length === 0 ? "/" : res;
}
function joinSegments(...args) {
  if (args.length === 0) {
    return "";
  }
  let joined = args.filter((segment) => segment !== "" && segment !== "/").map((segment) => stripSlashes(segment)).join("/");
  const first = args[0];
  const last = args[args.length - 1];
  if (first?.startsWith("/")) {
    joined = "/" + joined;
  }
  if (last?.endsWith("/")) {
    joined = joined + "/";
  }
  return joined;
}
function endsWith(s2, suffix) {
  return s2 === suffix || s2.endsWith("/" + suffix);
}
function trimSuffix(s2, suffix) {
  if (endsWith(s2, suffix)) {
    s2 = s2.slice(0, -suffix.length);
  }
  return s2;
}
function stripSlashes(s2, onlyStripPrefix) {
  if (s2.startsWith("/")) {
    s2 = s2.substring(1);
  }
  if (!onlyStripPrefix && s2.endsWith("/")) {
    s2 = s2.slice(0, -1);
  }
  return s2;
}
function pathToRoot(slug2) {
  let rootPath = slug2.split("/").filter((x2) => x2 !== "").slice(0, -1).map((_2) => "..").join("/");
  if (rootPath.length === 0) {
    rootPath = ".";
  }
  return rootPath;
}
function resolveRelative(current, target) {
  const res = joinSegments(pathToRoot(current), simplifySlug(target));
  return res;
}

// src/knowledge.ts
var TYPE_CODES = {
  source: "SRC",
  entity: "ENT",
  concept: "CON",
  synthesis: "SYN"
};
function normalizeType(value) {
  if (typeof value !== "string") return null;
  const aliases = {
    source: "source",
    sources: "source",
    entity: "entity",
    entities: "entity",
    concept: "concept",
    concepts: "concept",
    synthesis: "synthesis",
    syntheses: "synthesis"
  };
  const normalized = value.trim().toLowerCase();
  const matched = aliases[normalized];
  if (matched) return matched;
  if (normalized === "source" || normalized === "entity" || normalized === "concept" || normalized === "synthesis") {
    return normalized;
  }
  return null;
}
function detectKnowledgeType(file) {
  const frontmatterType = normalizeType(file.frontmatter?.type);
  if (frontmatterType) return frontmatterType;
  if (typeof file.slug !== "string") return null;
  const root = file.slug.split("/", 1)[0];
  return normalizeType(root);
}
function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function getKnowledgeUpdatedAt(file) {
  return parseDate(file.frontmatter?.last_updated) ?? parseDate(file.frontmatter?.modified) ?? parseDate(file.dates?.modified);
}
function getTitle(file, slug2) {
  const title = file.frontmatter?.title;
  if (typeof title === "string" && title.trim()) return title.trim();
  return slug2.split("/").pop() ?? slug2;
}
function getDescription(file) {
  const candidates = [file.description, file.frontmatter?.description];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "\u6682\u65E0\u6458\u8981\uFF1B\u6253\u5F00\u9875\u9762\u67E5\u770B\u5B8C\u6574\u8D44\u6599\u3002";
}
function hasDescription(file) {
  return [file.description, file.frontmatter?.description].some(
    (value) => typeof value === "string" && value.trim().length > 0
  );
}
function getTags(file) {
  const tags = file.frontmatter?.tags;
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0);
}
function getKnowledgeObjects(files) {
  const objects = [];
  for (const file of files) {
    if (file.unlisted === true || typeof file.slug !== "string") continue;
    if (file.slug.endsWith("/index")) continue;
    const type = detectKnowledgeType(file);
    if (!type) continue;
    objects.push({
      slug: file.slug,
      title: getTitle(file, file.slug),
      type,
      code: TYPE_CODES[type],
      description: getDescription(file),
      hasDescription: hasDescription(file),
      tags: getTags(file),
      updatedAt: getKnowledgeUpdatedAt(file)
    });
  }
  return objects;
}
function getKnowledgeQualitySummary(objects) {
  const affectedObjects = objects.filter(
    (object) => !object.hasDescription || object.tags.length === 0 || object.updatedAt === null
  ).length;
  return {
    total: objects.length,
    missingDescriptions: objects.filter((object) => !object.hasDescription).length,
    missingTags: objects.filter((object) => object.tags.length === 0).length,
    missingDates: objects.filter((object) => object.updatedAt === null).length,
    affectedObjects
  };
}
function getTopTags(objects, limit = 4) {
  const counts = /* @__PURE__ */ new Map();
  for (const object of objects) {
    for (const tag of new Set(object.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort(([leftTag, leftCount], [rightTag, rightCount]) => {
    return rightCount - leftCount || leftTag.localeCompare(rightTag);
  }).slice(0, Math.max(0, limit)).map(([tag]) => tag);
}

// src/components/HomePage.tsx
var TYPE_META = {
  source: { label: "\u6765\u6E90\u8D44\u6599", pluralLabel: "Sources", order: 1 },
  entity: { label: "\u77E5\u8BC6\u5B9E\u4F53", pluralLabel: "Entities", order: 2 },
  concept: { label: "\u6838\u5FC3\u6982\u5FF5", pluralLabel: "Concepts", order: 3 },
  synthesis: {
    label: "\u4E13\u9898\u5206\u6790",
    pluralLabel: "Syntheses",
    order: 4
  }
};
function formatDate(date, includeYear = true) {
  if (!date) return "\u66F4\u65B0\u65F6\u95F4\u672A\u77E5";
  return new Intl.DateTimeFormat("zh-CN", {
    ...includeYear ? { year: "numeric" } : {},
    month: "long",
    day: "numeric"
  }).format(date);
}
function sortByUpdatedAt(objects) {
  return [...objects].sort((left, right) => {
    return (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0);
  });
}
var homeScript = `
document.addEventListener("nav", () => {
  const form = document.querySelector("[data-knowledge-search]")
  if (!(form instanceof HTMLFormElement) || form.dataset.bound === "true") return
  form.dataset.bound = "true"

  const input = form.querySelector("input")
  form.addEventListener("submit", (event) => {
    event.preventDefault()
    if (!(input instanceof HTMLInputElement)) return
    const query = input.value.trim()
    const searchButton = document.querySelector(".search > .search-button")
    if (!(searchButton instanceof HTMLButtonElement)) return
    searchButton.click()
    window.setTimeout(() => {
      const searchInput = document.querySelector(".search-container.active .search-bar")
      if (!(searchInput instanceof HTMLInputElement)) return
      searchInput.value = query
      searchInput.dispatchEvent(new Event("input", { bubbles: true }))
      searchInput.focus()
    }, 0)
  })

  for (const suggestion of form.closest(".knowledge-home")?.querySelectorAll("[data-topic]") ?? []) {
    if (!(suggestion instanceof HTMLButtonElement)) continue
    suggestion.addEventListener("click", () => {
      if (!(input instanceof HTMLInputElement)) return
      input.value = suggestion.dataset.topic ?? suggestion.textContent?.trim() ?? ""
      input.focus()
    })
  }
})
`;
var HomePage_default = (() => {
  const HomePage2 = (props) => {
    const currentSlug = String(props.fileData.slug ?? "index");
    const objects = getKnowledgeObjects(props.allFiles);
    const latestObjects = sortByUpdatedAt(objects).slice(0, 6);
    const latestDate = latestObjects[0]?.updatedAt ?? null;
    const qualitySummary = getKnowledgeQualitySummary(objects);
    const topTags = getTopTags(objects);
    const chatsHref = resolveRelative(currentSlug, "chats");
    const sourcesHref = resolveRelative(currentSlug, "sources");
    const qualityHref = resolveRelative(currentSlug, "quality");
    const ingestHref = resolveRelative(currentSlug, "ingest");
    const typeCounts = Object.keys(TYPE_META).sort((left, right) => TYPE_META[left].order - TYPE_META[right].order).map((type) => ({
      type,
      count: objects.filter((object) => object.type === type).length,
      code: objects.find((object) => object.type === type)?.code ?? "---",
      ...TYPE_META[type]
    }));
    return /* @__PURE__ */ u2("main", { class: "knowledge-home", children: [
      /* @__PURE__ */ u2("header", { class: "knowledge-home-header", children: [
        /* @__PURE__ */ u2("p", { class: "knowledge-home-updated", children: [
          "\u8D44\u6599\u7D22\u5F15\u66F4\u65B0\u81F3 ",
          formatDate(latestDate)
        ] }),
        /* @__PURE__ */ u2("h1", { children: "\u4E2D\u538B-\u5E02\u573A\u90E8 \u6837\u672C\u77E5\u8BC6\u5E93" }),
        /* @__PURE__ */ u2("p", { class: "knowledge-home-intro", children: "\u68C0\u7D22\u4EA7\u54C1\u3001\u6280\u672F\u53C2\u6570\u3001\u6807\u51C6\u4E0E\u8BBE\u5907\u5173\u7CFB\uFF1B\u590D\u6742\u95EE\u9898\u53EF\u57FA\u4E8E\u5DF2\u53D1\u5E03\u8D44\u6599\u5F62\u6210\u5E26\u51FA\u5904\u7684\u7814\u7A76\u7B54\u590D\u3002" }),
        /* @__PURE__ */ u2("div", { class: "knowledge-home-actions", children: [
          /* @__PURE__ */ u2("form", { class: "knowledge-search", "data-knowledge-search": true, role: "search", children: [
            /* @__PURE__ */ u2("label", { for: "knowledge-home-query", children: "\u67E5\u627E\u8D44\u6599" }),
            /* @__PURE__ */ u2(
              "input",
              {
                id: "knowledge-home-query",
                name: "query",
                type: "search",
                autocomplete: "off",
                placeholder: "\u8F93\u5165\u4EA7\u54C1\u3001\u53C2\u6570\u3001\u6807\u51C6\u6216\u6982\u5FF5"
              }
            ),
            /* @__PURE__ */ u2("button", { type: "submit", children: "\u6253\u5F00\u641C\u7D22" })
          ] }),
          /* @__PURE__ */ u2("a", { class: "knowledge-ask-link", href: chatsHref, children: [
            "\u8FDB\u5165\u77E5\u8BC6\u95EE\u7B54 ",
            /* @__PURE__ */ u2("span", { "aria-hidden": "true", children: "\u2192" })
          ] })
        ] }),
        topTags.length > 0 && /* @__PURE__ */ u2("div", { class: "knowledge-topics", "aria-label": "\u5E38\u7528\u4E3B\u9898", children: [
          /* @__PURE__ */ u2("span", { children: "\u5E38\u7528\u4E3B\u9898" }),
          topTags.map((tag) => /* @__PURE__ */ u2("button", { type: "button", "data-topic": tag, children: tag }))
        ] })
      ] }),
      /* @__PURE__ */ u2("section", { class: "knowledge-register", "aria-labelledby": "knowledge-overview-title", children: [
        /* @__PURE__ */ u2("div", { class: "knowledge-section-heading", children: [
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2("p", { children: "\u6784\u5EFA\u671F\u7D22\u5F15" }),
            /* @__PURE__ */ u2("h2", { id: "knowledge-overview-title", children: "\u77E5\u8BC6\u6982\u89C8" })
          ] }),
          /* @__PURE__ */ u2("span", { children: [
            "\u5171 ",
            objects.length.toLocaleString("zh-CN"),
            " \u4E2A\u5BF9\u8C61"
          ] })
        ] }),
        /* @__PURE__ */ u2("div", { class: "knowledge-register-grid", children: typeCounts.map(({ type, code, label, pluralLabel, count }) => /* @__PURE__ */ u2(
          "a",
          {
            class: `knowledge-register-cell type-${type}`,
            href: `${resolveRelative(currentSlug, "library")}?type=${type}`,
            children: [
              /* @__PURE__ */ u2("span", { class: "knowledge-type-code", children: code }),
              /* @__PURE__ */ u2("span", { children: [
                /* @__PURE__ */ u2("small", { children: pluralLabel }),
                /* @__PURE__ */ u2("strong", { children: label })
              ] }),
              /* @__PURE__ */ u2("b", { children: count.toLocaleString("zh-CN") })
            ]
          }
        )) })
      ] }),
      /* @__PURE__ */ u2("div", { class: "knowledge-home-grid", children: [
        /* @__PURE__ */ u2("section", { class: "knowledge-updates", "aria-labelledby": "knowledge-updates-title", children: [
          /* @__PURE__ */ u2("div", { class: "knowledge-section-heading", children: [
            /* @__PURE__ */ u2("div", { children: [
              /* @__PURE__ */ u2("p", { children: "\u6309\u771F\u5B9E\u66F4\u65B0\u65F6\u95F4\u6392\u5E8F" }),
              /* @__PURE__ */ u2("h2", { id: "knowledge-updates-title", children: "\u6700\u8FD1\u66F4\u65B0" })
            ] }),
            /* @__PURE__ */ u2("a", { href: sourcesHref, children: "\u8FDB\u5165\u8D44\u6599\u76EE\u5F55 \u2192" })
          ] }),
          latestObjects.length > 0 ? /* @__PURE__ */ u2("div", { class: "knowledge-update-list", children: latestObjects.map((object) => /* @__PURE__ */ u2(
            "a",
            {
              class: `knowledge-update-row type-${object.type}`,
              href: resolveRelative(currentSlug, object.slug),
              children: [
                /* @__PURE__ */ u2("span", { class: "knowledge-type-code", children: object.code }),
                /* @__PURE__ */ u2("span", { class: "knowledge-update-copy", children: [
                  /* @__PURE__ */ u2("strong", { children: object.title }),
                  /* @__PURE__ */ u2("small", { children: object.description })
                ] }),
                /* @__PURE__ */ u2("span", { class: "knowledge-update-meta", children: [
                  /* @__PURE__ */ u2("em", { children: TYPE_META[object.type].label }),
                  /* @__PURE__ */ u2("time", { datetime: object.updatedAt?.toISOString(), children: formatDate(object.updatedAt, false) })
                ] })
              ]
            }
          )) }) : /* @__PURE__ */ u2("p", { class: "knowledge-empty-state", children: "\u5F53\u524D\u6784\u5EFA\u672A\u53D1\u73B0 Source\u3001Entity\u3001Concept \u6216 Synthesis \u9875\u9762\u3002" })
        ] }),
        /* @__PURE__ */ u2("aside", { class: "knowledge-home-side", "aria-label": "\u77E5\u8BC6\u5E93\u5173\u6CE8\u9879\u4E0E\u6D3B\u52A8", children: [
          /* @__PURE__ */ u2("section", { class: "knowledge-attention", "aria-labelledby": "knowledge-attention-title", children: [
            /* @__PURE__ */ u2("div", { class: "knowledge-section-heading", children: [
              /* @__PURE__ */ u2("div", { children: [
                /* @__PURE__ */ u2("p", { children: "\u53EF\u6267\u884C\u68C0\u67E5" }),
                /* @__PURE__ */ u2("h2", { id: "knowledge-attention-title", children: "\u9700\u8981\u5173\u6CE8" })
              ] }),
              /* @__PURE__ */ u2("span", { children: [
                qualitySummary.affectedObjects,
                " \u9879"
              ] })
            ] }),
            /* @__PURE__ */ u2("a", { href: `${qualityHref}#metadata-gaps`, class: "knowledge-attention-row", children: [
              /* @__PURE__ */ u2("span", { class: "knowledge-attention-code", children: "META" }),
              /* @__PURE__ */ u2("span", { children: [
                /* @__PURE__ */ u2("strong", { children: qualitySummary.affectedObjects > 0 ? `${qualitySummary.affectedObjects} \u4E2A\u5BF9\u8C61\u5B58\u5728\u5143\u6570\u636E\u7F3A\u53E3` : "\u672A\u53D1\u73B0\u5143\u6570\u636E\u7F3A\u53E3" }),
                /* @__PURE__ */ u2("small", { children: "\u6458\u8981\u3001\u6807\u7B7E\u548C\u66F4\u65B0\u65F6\u95F4\u6309\u672C\u6B21\u6784\u5EFA\u6570\u636E\u68C0\u67E5\u3002" })
              ] })
            ] }),
            /* @__PURE__ */ u2("a", { href: ingestHref, class: "knowledge-attention-row is-unknown", children: [
              /* @__PURE__ */ u2("span", { class: "knowledge-attention-code", children: "PUB" }),
              /* @__PURE__ */ u2("span", { children: [
                /* @__PURE__ */ u2("strong", { children: "\u5F85\u53D1\u5E03\u53D8\u66F4\u6570\u91CF\u672A\u77E5" }),
                /* @__PURE__ */ u2("small", { children: "\u8FDB\u5165\u6587\u6863\u5165\u5E93\u67E5\u770B\u771F\u5B9E\u4EFB\u52A1\uFF1B\u9759\u6001\u7D22\u5F15\u4E0D\u63A8\u65AD\u53D1\u5E03\u72B6\u6001\u3002" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ u2("section", { class: "knowledge-activity", "aria-labelledby": "knowledge-activity-title", children: [
            /* @__PURE__ */ u2("div", { class: "knowledge-section-heading", children: /* @__PURE__ */ u2("div", { children: [
              /* @__PURE__ */ u2("p", { children: "\u6784\u5EFA\u53EF\u89C1\u8BB0\u5F55" }),
              /* @__PURE__ */ u2("h2", { id: "knowledge-activity-title", children: "\u6700\u8FD1\u6D3B\u52A8" })
            ] }) }),
            /* @__PURE__ */ u2("div", { class: "knowledge-activity-list", children: latestObjects.slice(0, 4).map((object) => /* @__PURE__ */ u2("a", { href: resolveRelative(currentSlug, object.slug), children: [
              /* @__PURE__ */ u2("span", { class: "knowledge-type-code", children: object.code }),
              /* @__PURE__ */ u2("span", { children: [
                /* @__PURE__ */ u2("strong", { children: object.title }),
                /* @__PURE__ */ u2("small", { children: [
                  formatDate(object.updatedAt, false),
                  "\u66F4\u65B0"
                ] })
              ] })
            ] })) }),
            /* @__PURE__ */ u2("p", { class: "knowledge-activity-note", children: "\u6B64\u5904\u53EA\u663E\u793A\u5F53\u524D Quartz \u6784\u5EFA\u80FD\u591F\u786E\u8BA4\u7684\u77E5\u8BC6\u66F4\u65B0\u65F6\u95F4\uFF0C\u4E0D\u4F2A\u88C5\u4E3A\u5B9E\u65F6\u64CD\u4F5C\u65E5\u5FD7\u3002" })
          ] })
        ] })
      ] })
    ] });
  };
  HomePage2.afterDOMLoaded = homeScript;
  return HomePage2;
});

// src/components/LibraryPage.tsx
var TYPE_META2 = {
  source: { label: "\u6765\u6E90", pluralLabel: "Sources" },
  entity: { label: "\u5B9E\u4F53", pluralLabel: "Entities" },
  concept: { label: "\u6982\u5FF5", pluralLabel: "Concepts" },
  synthesis: { label: "\u5206\u6790", pluralLabel: "Syntheses" }
};
var TYPE_ORDER = ["source", "entity", "concept", "synthesis"];
function formatDate2(date) {
  if (!date) return "\u66F4\u65B0\u65F6\u95F4\u672A\u77E5";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
function sortByUpdatedAt2(objects) {
  return [...objects].sort((left, right) => {
    const dateDifference = (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0);
    return dateDifference || left.title.localeCompare(right.title, "zh-CN");
  });
}
var libraryScript = `
document.addEventListener("nav", () => {
  const root = document.querySelector("[data-knowledge-library]")
  if (!(root instanceof HTMLElement) || root.dataset.bound === "true") return
  root.dataset.bound = "true"

  const rows = Array.from(root.querySelectorAll("[data-library-row]"))
  const tabs = Array.from(root.querySelectorAll("[data-library-type]"))
  const searchInput = root.querySelector("[data-library-search]")
  const sortSelect = root.querySelector("[data-library-sort]")
  const resultCount = root.querySelector("[data-library-result-count]")
  const resultList = root.querySelector("[data-library-results]")
  const emptyState = root.querySelector("[data-library-empty]")
  const clearButtons = Array.from(root.querySelectorAll("[data-library-clear]"))

  if (!(searchInput instanceof HTMLInputElement)) return
  if (!(sortSelect instanceof HTMLSelectElement)) return
  if (!(resultList instanceof HTMLElement)) return

  const validTypes = new Set(["all", "source", "entity", "concept", "synthesis"])
  const validSorts = new Set(["updated", "title", "type"])
  const params = new URLSearchParams(window.location.search)
  let selectedType = params.get("type") ?? "all"
  let selectedSort = params.get("sort") ?? "updated"
  if (!validTypes.has(selectedType)) selectedType = "all"
  if (!validSorts.has(selectedSort)) selectedSort = "updated"
  searchInput.value = params.get("q") ?? ""
  sortSelect.value = selectedSort

  const compareRows = (left, right) => {
    if (!(left instanceof HTMLElement) || !(right instanceof HTMLElement)) return 0
    if (selectedSort === "title") {
      return (left.dataset.title ?? "").localeCompare(right.dataset.title ?? "", "zh-CN")
    }
    if (selectedSort === "type") {
      return (left.dataset.typeOrder ?? "").localeCompare(right.dataset.typeOrder ?? "") ||
        (left.dataset.title ?? "").localeCompare(right.dataset.title ?? "", "zh-CN")
    }
    return Number(right.dataset.updated ?? 0) - Number(left.dataset.updated ?? 0) ||
      (left.dataset.title ?? "").localeCompare(right.dataset.title ?? "", "zh-CN")
  }

  const updateUrl = () => {
    const nextParams = new URLSearchParams()
    const query = searchInput.value.trim()
    if (selectedType !== "all") nextParams.set("type", selectedType)
    if (query) nextParams.set("q", query)
    if (selectedSort !== "updated") nextParams.set("sort", selectedSort)
    const queryString = nextParams.toString()
    window.history.replaceState({}, "", window.location.pathname + (queryString ? "?" + queryString : ""))
  }

  const render = () => {
    const query = searchInput.value.trim().toLocaleLowerCase("zh-CN")
    let visibleCount = 0

    rows.sort(compareRows).forEach((row) => {
      if (!(row instanceof HTMLElement)) return
      const matchesType = selectedType === "all" || row.dataset.type === selectedType
      const matchesQuery = !query || (row.dataset.search ?? "").includes(query)
      const visible = matchesType && matchesQuery
      row.hidden = !visible
      if (visible) visibleCount += 1
      resultList.append(row)
    })

    tabs.forEach((tab) => {
      if (!(tab instanceof HTMLButtonElement)) return
      const active = tab.dataset.libraryType === selectedType
      tab.classList.toggle("is-active", active)
      tab.setAttribute("aria-selected", String(active))
      tab.tabIndex = active ? 0 : -1
    })

    if (resultCount) resultCount.textContent = String(visibleCount)
    if (emptyState instanceof HTMLElement) emptyState.hidden = visibleCount !== 0
    resultList.hidden = visibleCount === 0
    updateUrl()
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (!(tab instanceof HTMLButtonElement)) return
      selectedType = tab.dataset.libraryType ?? "all"
      render()
    })
    tab.addEventListener("keydown", (event) => {
      if (!(event instanceof KeyboardEvent) || !(tab instanceof HTMLButtonElement)) return
      const currentIndex = tabs.indexOf(tab)
      let nextIndex = currentIndex
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length
      if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
      if (event.key === "Home") nextIndex = 0
      if (event.key === "End") nextIndex = tabs.length - 1
      if (nextIndex === currentIndex) return
      event.preventDefault()
      const nextTab = tabs[nextIndex]
      if (!(nextTab instanceof HTMLButtonElement)) return
      selectedType = nextTab.dataset.libraryType ?? "all"
      render()
      nextTab.focus()
    })
  })
  searchInput.addEventListener("input", render)
  sortSelect.addEventListener("change", () => {
    selectedSort = sortSelect.value
    render()
  })
  clearButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedType = "all"
      selectedSort = "updated"
      searchInput.value = ""
      sortSelect.value = selectedSort
      render()
      searchInput.focus()
    })
  })

  render()
})
`;
var LibraryPage_default = (() => {
  const LibraryPage2 = (props) => {
    const currentSlug = "library";
    const objects = sortByUpdatedAt2(getKnowledgeObjects(props.allFiles));
    const counts = Object.fromEntries(
      TYPE_ORDER.map((type) => [type, objects.filter((object) => object.type === type).length])
    );
    return /* @__PURE__ */ u2("main", { class: "knowledge-library", "data-knowledge-library": true, children: [
      /* @__PURE__ */ u2("header", { class: "knowledge-library-header", children: [
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("p", { children: [
            objects.length.toLocaleString("zh-CN"),
            " \u4E2A\u53EF\u68C0\u7D22\u5BF9\u8C61"
          ] }),
          /* @__PURE__ */ u2("h1", { children: "\u77E5\u8BC6\u5E93" }),
          /* @__PURE__ */ u2("span", { children: "\u6309\u6765\u6E90\u8D44\u6599\u3001\u77E5\u8BC6\u5B9E\u4F53\u3001\u6838\u5FC3\u6982\u5FF5\u548C\u4E13\u9898\u5206\u6790\u6D4F\u89C8\u5DF2\u53D1\u5E03\u5185\u5BB9\u3002" })
        ] }),
        /* @__PURE__ */ u2("a", { class: "knowledge-library-ask", href: resolveRelative(currentSlug, "chats"), children: "\u8BE2\u95EE\u77E5\u8BC6\u5E93" })
      ] }),
      /* @__PURE__ */ u2("section", { class: "knowledge-library-controls", "aria-label": "\u77E5\u8BC6\u5E93\u7B5B\u9009\u4E0E\u6392\u5E8F", children: [
        /* @__PURE__ */ u2("div", { class: "knowledge-library-tabs", role: "tablist", "aria-label": "\u77E5\u8BC6\u5BF9\u8C61\u7C7B\u578B", children: [
          /* @__PURE__ */ u2("button", { type: "button", class: "is-active", "data-library-type": "all", role: "tab", children: [
            "\u5168\u90E8 ",
            /* @__PURE__ */ u2("span", { children: objects.length })
          ] }),
          TYPE_ORDER.map((type) => /* @__PURE__ */ u2("button", { type: "button", "data-library-type": type, role: "tab", tabindex: -1, children: [
            TYPE_META2[type].label,
            " ",
            /* @__PURE__ */ u2("span", { children: counts[type] })
          ] }))
        ] }),
        /* @__PURE__ */ u2("div", { class: "knowledge-library-tools", children: [
          /* @__PURE__ */ u2("label", { children: [
            /* @__PURE__ */ u2("span", { children: "\u5F53\u524D\u7ED3\u679C\u641C\u7D22" }),
            /* @__PURE__ */ u2(
              "input",
              {
                type: "search",
                placeholder: "\u6807\u9898\u3001\u6458\u8981\u6216\u6807\u7B7E",
                autocomplete: "off",
                "data-library-search": true
              }
            )
          ] }),
          /* @__PURE__ */ u2("label", { children: [
            /* @__PURE__ */ u2("span", { children: "\u6392\u5E8F" }),
            /* @__PURE__ */ u2("select", { "data-library-sort": true, children: [
              /* @__PURE__ */ u2("option", { value: "updated", children: "\u6700\u8FD1\u66F4\u65B0" }),
              /* @__PURE__ */ u2("option", { value: "title", children: "\u6807\u9898 A\u2013Z" }),
              /* @__PURE__ */ u2("option", { value: "type", children: "\u5BF9\u8C61\u7C7B\u578B" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ u2(
        "section",
        {
          class: "knowledge-library-register",
          "aria-labelledby": "knowledge-library-results-title",
          children: [
            /* @__PURE__ */ u2("header", { children: [
              /* @__PURE__ */ u2("div", { children: [
                /* @__PURE__ */ u2("h2", { id: "knowledge-library-results-title", children: "\u8D44\u4EA7\u6E05\u5355" }),
                /* @__PURE__ */ u2("p", { "aria-live": "polite", children: [
                  "\u5F53\u524D\u663E\u793A ",
                  /* @__PURE__ */ u2("strong", { "data-library-result-count": true, children: objects.length }),
                  " \u4E2A\u77E5\u8BC6\u5BF9\u8C61"
                ] })
              ] }),
              /* @__PURE__ */ u2("button", { type: "button", "data-library-clear": true, children: "\u6E05\u9664\u7B5B\u9009" })
            ] }),
            /* @__PURE__ */ u2("div", { class: "knowledge-library-columns", "aria-hidden": "true", children: [
              /* @__PURE__ */ u2("span", { children: "\u7C7B\u578B" }),
              /* @__PURE__ */ u2("span", { children: "\u6807\u9898\u4E0E\u6458\u8981" }),
              /* @__PURE__ */ u2("span", { children: "\u6807\u7B7E" }),
              /* @__PURE__ */ u2("span", { children: "\u66F4\u65B0\u65F6\u95F4" })
            ] }),
            /* @__PURE__ */ u2("div", { class: "knowledge-library-results", "data-library-results": true, children: objects.map((object) => {
              const href = resolveRelative(currentSlug, object.slug);
              const timestamp = object.updatedAt?.getTime() ?? 0;
              const searchText = [object.title, object.description, object.code, ...object.tags].join(" ").toLocaleLowerCase("zh-CN");
              return /* @__PURE__ */ u2(
                "a",
                {
                  class: `knowledge-library-row is-${object.type}`,
                  href,
                  "data-library-row": true,
                  "data-type": object.type,
                  "data-type-order": String(TYPE_ORDER.indexOf(object.type)),
                  "data-title": object.title,
                  "data-updated": String(timestamp),
                  "data-search": searchText,
                  children: [
                    /* @__PURE__ */ u2("span", { class: "knowledge-library-code", children: object.code }),
                    /* @__PURE__ */ u2("span", { class: "knowledge-library-copy", children: [
                      /* @__PURE__ */ u2("strong", { children: object.title }),
                      /* @__PURE__ */ u2("small", { children: object.description })
                    ] }),
                    /* @__PURE__ */ u2("span", { class: "knowledge-library-tags", children: object.tags.length > 0 ? object.tags.slice(0, 3).map((tag) => /* @__PURE__ */ u2("em", { children: tag })) : /* @__PURE__ */ u2("em", { children: "\u672A\u6807\u6CE8\u6807\u7B7E" }) }),
                    /* @__PURE__ */ u2("time", { datetime: object.updatedAt?.toISOString(), children: formatDate2(object.updatedAt) })
                  ]
                }
              );
            }) }),
            /* @__PURE__ */ u2("div", { class: "knowledge-library-empty", "data-library-empty": true, hidden: true, children: [
              /* @__PURE__ */ u2("span", { "aria-hidden": "true", children: "\u2205" }),
              /* @__PURE__ */ u2("h2", { children: "\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u77E5\u8BC6\u5BF9\u8C61" }),
              /* @__PURE__ */ u2("p", { children: "\u7B5B\u9009\u6761\u4EF6\u4F1A\u4FDD\u7559\u3002\u53EF\u4EE5\u4FEE\u6539\u5173\u952E\u8BCD\u6216\u6E05\u9664\u5168\u90E8\u6761\u4EF6\u540E\u91CD\u65B0\u6D4F\u89C8\u3002" }),
              /* @__PURE__ */ u2("button", { type: "button", "data-library-clear": true, children: "\u6E05\u9664\u5168\u90E8\u6761\u4EF6" })
            ] })
          ]
        }
      )
    ] });
  };
  LibraryPage2.afterDOMLoaded = libraryScript;
  return LibraryPage2;
});

// src/components/QualityPage.tsx
function QualityIssueGroup({
  title,
  count,
  description,
  objects,
  currentSlug
}) {
  return /* @__PURE__ */ u2("section", { class: "quality-issue-group", children: [
    /* @__PURE__ */ u2("header", { children: [
      /* @__PURE__ */ u2("div", { children: [
        /* @__PURE__ */ u2("h2", { children: title }),
        /* @__PURE__ */ u2("p", { children: description })
      ] }),
      /* @__PURE__ */ u2("strong", { children: count })
    ] }),
    objects.length > 0 ? /* @__PURE__ */ u2("div", { class: "quality-issue-list", children: [
      objects.slice(0, 8).map((object) => /* @__PURE__ */ u2("a", { href: resolveRelative(currentSlug, object.slug), children: [
        /* @__PURE__ */ u2("span", { class: "knowledge-type-code", children: object.code }),
        /* @__PURE__ */ u2("span", { children: [
          /* @__PURE__ */ u2("strong", { children: object.title }),
          /* @__PURE__ */ u2("small", { children: object.slug })
        ] })
      ] })),
      objects.length > 8 && /* @__PURE__ */ u2("p", { children: [
        "\u53E6\u6709 ",
        objects.length - 8,
        " \u9879\uFF0C\u8BF7\u5728\u77E5\u8BC6\u5E93\u4E2D\u7EE7\u7EED\u7B5B\u9009\u3002"
      ] })
    ] }) : /* @__PURE__ */ u2("p", { class: "quality-issue-empty", children: "\u5F53\u524D\u6784\u5EFA\u672A\u53D1\u73B0\u6B64\u7C7B\u5143\u6570\u636E\u7F3A\u53E3\u3002" })
  ] });
}
var QualityPage_default = (() => {
  const QualityPage2 = (props) => {
    const currentSlug = "quality";
    const objects = getKnowledgeObjects(props.allFiles);
    const summary = getKnowledgeQualitySummary(objects);
    const missingDescriptions = objects.filter((object) => !object.hasDescription);
    const missingTags = objects.filter((object) => object.tags.length === 0);
    const missingDates = objects.filter((object) => object.updatedAt === null);
    const ingestHref = resolveRelative(currentSlug, "ingest");
    return /* @__PURE__ */ u2("main", { class: "knowledge-quality", children: [
      /* @__PURE__ */ u2("header", { class: "knowledge-quality-header", children: [
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("p", { children: "\u6784\u5EFA\u671F\u53EF\u9A8C\u8BC1\u8303\u56F4" }),
          /* @__PURE__ */ u2("h1", { children: "\u77E5\u8BC6\u8D28\u91CF" }),
          /* @__PURE__ */ u2("span", { children: "\u68C0\u67E5\u5F53\u524D\u9759\u6001\u7D22\u5F15\u4E2D\u7684\u5143\u6570\u636E\u5B8C\u6574\u6027\uFF1B\u65AD\u94FE\u3001\u77DB\u76FE\u548C\u5165\u5E93\u9A8C\u8BC1\u4EE5\u771F\u5B9E\u4EFB\u52A1\u7ED3\u679C\u4E3A\u51C6\u3002" })
        ] }),
        /* @__PURE__ */ u2("a", { href: ingestHref, children: "\u67E5\u770B\u5165\u5E93\u9A8C\u8BC1" })
      ] }),
      /* @__PURE__ */ u2("section", { class: "quality-summary", "aria-label": "\u77E5\u8BC6\u8D28\u91CF\u6982\u89C8", children: [
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("span", { children: "\u5DF2\u7D22\u5F15\u5BF9\u8C61" }),
          /* @__PURE__ */ u2("strong", { children: summary.total }),
          /* @__PURE__ */ u2("small", { children: "\u672C\u6B21 Quartz \u6784\u5EFA" })
        ] }),
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("span", { children: "\u53D7\u5F71\u54CD\u5BF9\u8C61" }),
          /* @__PURE__ */ u2("strong", { children: summary.affectedObjects }),
          /* @__PURE__ */ u2("small", { children: "\u81F3\u5C11\u6709\u4E00\u9879\u5143\u6570\u636E\u7F3A\u53E3" })
        ] }),
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("span", { children: "\u65AD\u94FE\u4E0E\u77DB\u76FE" }),
          /* @__PURE__ */ u2("strong", { children: "\u2014" }),
          /* @__PURE__ */ u2("small", { children: "\u9759\u6001\u7D22\u5F15\u672A\u6267\u884C\u6B64\u9879\u68C0\u67E5" })
        ] }),
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("span", { children: "\u53D1\u5E03\u72B6\u6001" }),
          /* @__PURE__ */ u2("strong", { children: "\u2014" }),
          /* @__PURE__ */ u2("small", { children: "\u9700\u901A\u8FC7\u53D1\u5E03\u6D41\u7A0B\u786E\u8BA4" })
        ] })
      ] }),
      /* @__PURE__ */ u2("section", { class: "quality-boundary", "aria-labelledby": "quality-boundary-title", children: [
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("p", { children: "\u68C0\u67E5\u8FB9\u754C" }),
          /* @__PURE__ */ u2("h2", { id: "quality-boundary-title", children: "\u672C\u9875\u4E0D\u8BA1\u7B97\u865A\u5047\u7684\u5065\u5EB7\u5206\u6570" })
        ] }),
        /* @__PURE__ */ u2("dl", { children: [
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2("dt", { children: "\u6807\u9898\u4E0E\u5BF9\u8C61\u7C7B\u578B" }),
            /* @__PURE__ */ u2("dd", { class: "is-checked", children: "\u5DF2\u68C0\u67E5" })
          ] }),
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2("dt", { children: "\u6458\u8981\u3001\u6807\u7B7E\u3001\u66F4\u65B0\u65F6\u95F4" }),
            /* @__PURE__ */ u2("dd", { class: "is-checked", children: "\u5DF2\u68C0\u67E5" })
          ] }),
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2("dt", { children: "\u65AD\u94FE\u3001\u77DB\u76FE\u3001\u672A\u7D22\u5F15" }),
            /* @__PURE__ */ u2("dd", { children: "\u67E5\u770B\u5177\u4F53 Ingest \u4EFB\u52A1" })
          ] }),
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2("dt", { children: "Quartz \u662F\u5426\u5DF2\u53D1\u5E03" }),
            /* @__PURE__ */ u2("dd", { children: "\u9759\u6001\u9875\u9762\u65E0\u6CD5\u81EA\u884C\u5224\u65AD" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ u2("div", { class: "quality-issues", id: "metadata-gaps", children: [
        /* @__PURE__ */ u2(
          QualityIssueGroup,
          {
            title: "\u7F3A\u5C11\u6458\u8981",
            count: summary.missingDescriptions,
            description: "\u5BF9\u8C61\u6CA1\u6709\u53EF\u7528\u4E8E\u76EE\u5F55\u548C\u641C\u7D22\u7ED3\u679C\u7684 description\u3002",
            objects: missingDescriptions,
            currentSlug
          }
        ),
        /* @__PURE__ */ u2(
          QualityIssueGroup,
          {
            title: "\u7F3A\u5C11\u6807\u7B7E",
            count: summary.missingTags,
            description: "\u5BF9\u8C61\u5C1A\u672A\u63D0\u4F9B\u53EF\u7528\u4E8E\u4E3B\u9898\u805A\u5408\u7684 tags\u3002",
            objects: missingTags,
            currentSlug
          }
        ),
        /* @__PURE__ */ u2(
          QualityIssueGroup,
          {
            title: "\u66F4\u65B0\u65F6\u95F4\u672A\u77E5",
            count: summary.missingDates,
            description: "frontmatter \u548C\u6784\u5EFA\u6570\u636E\u4E2D\u90FD\u6CA1\u6709\u53EF\u786E\u8BA4\u7684\u66F4\u65B0\u65F6\u95F4\u3002",
            objects: missingDates,
            currentSlug
          }
        )
      ] })
    ] });
  };
  return QualityPage2;
});

// src/components/KnowledgePage.tsx
var HomePage = HomePage_default();
var LibraryPage = LibraryPage_default();
var QualityPage = QualityPage_default();
var KnowledgePage_default = (() => {
  const KnowledgePage = (props) => {
    if (props.fileData.slug === "library") return LibraryPage(props);
    if (props.fileData.slug === "quality") return QualityPage(props);
    return HomePage(props);
  };
  KnowledgePage.afterDOMLoaded = [HomePage.afterDOMLoaded, LibraryPage.afterDOMLoaded].filter((script) => typeof script === "string").join("\n");
  return KnowledgePage;
});

// src/pageType.ts
var KnowledgePageType = () => ({
  name: "KnowledgePageType",
  priority: 100,
  match: ({ slug: slug2 }) => slug2 === "index" || slug2 === "library" || slug2 === "quality",
  generate() {
    const virtualPages = [
      {
        slug: "library",
        title: "\u77E5\u8BC6\u5E93",
        data: {
          unlisted: true,
          description: "\u6309\u6765\u6E90\u8D44\u6599\u3001\u77E5\u8BC6\u5B9E\u4F53\u3001\u6838\u5FC3\u6982\u5FF5\u548C\u4E13\u9898\u5206\u6790\u6D4F\u89C8\u5DF2\u53D1\u5E03\u5185\u5BB9\u3002"
        }
      },
      {
        slug: "quality",
        title: "\u77E5\u8BC6\u8D28\u91CF",
        data: {
          unlisted: true,
          description: "\u68C0\u67E5\u5F53\u524D\u6784\u5EFA\u53EF\u786E\u8BA4\u7684\u77E5\u8BC6\u5BF9\u8C61\u5143\u6570\u636E\u5B8C\u6574\u6027\u3002"
        }
      }
    ];
    return virtualPages;
  },
  layout: "knowledge",
  frame: "default",
  body: KnowledgePage_default,
  treeTransforms: () => [
    (_root, slug2, componentData) => {
      if (slug2 !== "index") return;
      componentData.fileData.frontmatter = {
        ...componentData.fileData.frontmatter,
        title: "\u4E2D\u538B-\u5E02\u573A\u90E8 \u6837\u672C\u77E5\u8BC6\u5E93",
        description: "\u68C0\u7D22\u4EA7\u54C1\u3001\u6280\u672F\u53C2\u6570\u3001\u6807\u51C6\u4E0E\u8BBE\u5907\u5173\u7CFB\uFF0C\u5E76\u57FA\u4E8E\u5DF2\u53D1\u5E03\u8D44\u6599\u5F00\u5C55\u77E5\u8BC6\u95EE\u7B54\u3002"
      };
      componentData.fileData.description = "\u68C0\u7D22\u4EA7\u54C1\u3001\u6280\u672F\u53C2\u6570\u3001\u6807\u51C6\u4E0E\u8BBE\u5907\u5173\u7CFB\uFF0C\u5E76\u57FA\u4E8E\u5DF2\u53D1\u5E03\u8D44\u6599\u5F00\u5C55\u77E5\u8BC6\u95EE\u7B54\u3002";
    }
  ]
});

export { KnowledgePageType };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map