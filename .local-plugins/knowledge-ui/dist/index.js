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
        /* @__PURE__ */ u2("h1", { children: "\u4E2D\u538B\u5E02\u573A\u90E8\u77E5\u8BC6\u5E93" }),
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

// src/components/scripts/quality.inline.ts
var qualityScript = `
document.addEventListener("nav", () => {
  const root = document.querySelector(".knowledge-quality")
  if (!(root instanceof HTMLElement) || root.dataset.bound === "true") return
  root.dataset.bound = "true"

  const snapshot = root.querySelector("[data-quality-snapshot]")
  const stateLabels = {
    available: "\u53EF\u7528",
    stale: "\u62A5\u544A\u5DF2\u8FC7\u671F",
    missing: "\u62A5\u544A\u7F3A\u5931",
    parse_failed: "\u62A5\u544A\u65E0\u6CD5\u89E3\u6790",
    not_run: "\u5C1A\u672A\u8FD0\u884C",
    incomplete: "\u62A5\u544A\u4E0D\u5B8C\u6574",
  }
  const categories = ["consistency", "structure", "graph", "freshness"]

  const isRecord = (value) => typeof value === "object" && value !== null
  const setText = (selector, value) => {
    const element = root.querySelector(selector)
    if (element) element.textContent = value
  }
  const stateLabel = (state) => stateLabels[state] ?? "\u72B6\u6001\u672A\u77E5"
  const formatDate = (value) => {
    if (typeof value !== "string") return "\u65F6\u95F4\u672A\u77E5"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "\u65F6\u95F4\u672A\u77E5"
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  }
  const clear = (element) => element.replaceChildren()
  const appendText = (parent, tagName, className, value) => {
    const element = document.createElement(tagName)
    if (className) element.className = className
    element.textContent = value
    parent.append(element)
    return element
  }

  const showEvidenceEmpty = (message) => {
    const target = root.querySelector("[data-quality-evidence-body]")
    if (!(target instanceof HTMLElement)) return
    clear(target)
    target.className = "quality-evidence-empty"
    target.textContent = message
    setText("[data-quality-evidence-state]", "\u6682\u65E0\u53EF\u9009\u53D1\u73B0\u9879")
  }
  const showActionNote = (title, message) => {
    const note = root.querySelector("[data-quality-action-note]")
    if (!(note instanceof HTMLElement)) return
    setText("[data-quality-action-note-title]", title)
    setText("[data-quality-action-note-body]", message)
    note.hidden = false
    note.focus()
  }

  const renderEvidence = (finding, index, total) => {
    const target = root.querySelector("[data-quality-evidence-body]")
    if (!(target instanceof HTMLElement) || !isRecord(finding)) return
    clear(target)
    target.className = "quality-evidence-content"
    setText("[data-quality-evidence-state]", "\u7B2C " + String(index + 1) + " / " + String(total) + " \u6761")

    const evidence = Array.isArray(finding.evidence) ? finding.evidence.filter(isRecord).slice(0, 2) : []
    if (evidence.length === 0) {
      appendText(target, "p", "quality-evidence-empty", "\u8BE5\u53D1\u73B0\u9879\u6CA1\u6709\u53EF\u5B89\u5168\u5C55\u793A\u7684\u7ED3\u6784\u5316\u6765\u6E90\u8BC1\u636E\u3002")
    }
    evidence.forEach((item) => {
      const source = document.createElement("section")
      source.className = "quality-evidence-source"
      const heading = document.createElement("div")
      heading.className = "quality-evidence-source-heading"
      appendText(heading, "strong", "", String(item.source_label ?? item.label ?? "\u6765\u6E90\u8BC1\u636E"))
      appendText(heading, "span", "", typeof item.location === "string" ? item.location : "\u4F4D\u7F6E\u672A\u77E5")
      source.append(heading)
      appendText(source, "blockquote", "", typeof item.quote === "string" ? item.quote : "\u672A\u63D0\u4F9B\u5F15\u7528\u5185\u5BB9\u3002")
      target.append(source)
    })

    const pages = Array.isArray(finding.pages) && finding.pages.length > 0 ? finding.pages.join(" \xB7 ") : "\u672A\u80FD\u53EF\u9760\u63D0\u53D6\u6D89\u53CA\u9875\u9762"
    const recommendation = typeof finding.recommendation === "string" && finding.recommendation
      ? finding.recommendation
      : "\u8BF7\u56DE\u5230\u6765\u6E90\u8D44\u6599\u4EBA\u5DE5\u6838\u5BF9\u3002"
    const summary = document.createElement("dl")
    summary.className = "quality-evidence-summary"
    appendText(summary, "dt", "", "\u6D89\u53CA\u9875\u9762")
    appendText(summary, "dd", "", pages)
    appendText(summary, "dt", "", "\u5EFA\u8BAE\u6838\u5BF9\u6765\u6E90")
    appendText(summary, "dd", "", recommendation)
    target.append(summary)
  }

  const renderFindings = (selector, findings, unavailableMessage, selectFirst) => {
    const target = root.querySelector(selector)
    if (!(target instanceof HTMLElement)) return null
    clear(target)
    if (!Array.isArray(findings)) {
      target.className = "quality-section-placeholder"
      target.textContent = unavailableMessage
      return null
    }
    if (findings.length === 0) {
      target.className = "quality-section-placeholder"
      target.textContent = "\u6700\u8FD1\u53EF\u7528\u62A5\u544A\u672A\u63D0\u4F9B\u9700\u8981\u4EBA\u5DE5\u5904\u7406\u7684\u53D1\u73B0\u9879\u3002"
      return null
    }
    target.className = "quality-finding-list"
    findings.filter(isRecord).forEach((finding, index) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "quality-finding"
      button.dataset.qualityFinding = String(finding.id ?? index)
      const severity = typeof finding.severity === "string" ? finding.severity : "unknown"
      appendText(button, "span", "quality-finding-marker is-" + severity, "")
      const copy = document.createElement("span")
      copy.className = "quality-finding-copy"
      appendText(copy, "strong", "", typeof finding.title === "string" ? finding.title : "\u672A\u547D\u540D\u53D1\u73B0\u9879")
      appendText(copy, "small", "", typeof finding.summary === "string" ? finding.summary : "\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u6458\u8981\u3002")
      button.append(copy)
      const status = typeof finding.status === "string" ? finding.status : "needs_review"
      appendText(button, "span", "quality-finding-status", status === "documented_difference" ? "\u5DF2\u6807\u6CE8\u5DEE\u5F02" : "\u9700\u4EBA\u5DE5\u786E\u8BA4")
      button.addEventListener("click", () => {
        target.querySelectorAll(".quality-finding").forEach((item) => item.classList.remove("is-active"))
        button.classList.add("is-active")
        renderEvidence(finding, index, findings.length)
      })
      target.append(button)
    })
    const first = target.querySelector(".quality-finding")
    if (selectFirst && first instanceof HTMLButtonElement) first.click()
    return first
  }

  const renderStructural = (checks, unavailableMessage) => {
    const target = root.querySelector("[data-quality-structural]")
    if (!(target instanceof HTMLTableSectionElement)) return
    clear(target)
    const appendCheck = (label, result, detail) => {
      const row = document.createElement("tr")
      appendText(row, "td", "", label)
      appendText(row, "td", "", result)
      appendText(row, "td", "", detail)
      target.append(row)
    }
    if (!Array.isArray(checks)) {
      appendCheck("\u7A7A\u9875 / \u8FC7\u77ED\u9875", unavailableMessage, "\u7B49\u5F85\u6700\u8FD1\u7ED3\u6784\u5DE1\u68C0\u62A5\u544A\u3002")
      appendCheck("\u7D22\u5F15\u540C\u6B65", unavailableMessage, "\u7B49\u5F85\u6700\u8FD1\u7ED3\u6784\u5DE1\u68C0\u62A5\u544A\u3002")
      appendCheck("\u65E5\u5FD7\u8986\u76D6", unavailableMessage, "\u7B49\u5F85\u6700\u8FD1\u7ED3\u6784\u5DE1\u68C0\u62A5\u544A\u3002")
      appendCheck("\u574F\u94FE\u4E0E\u5B64\u513F\u9875", unavailableMessage, "\u7B49\u5F85\u6700\u8FD1\u7ED3\u6784\u5DE1\u68C0\u62A5\u544A\u3002")
      appendCheck("\u7A00\u758F\u94FE\u63A5", unavailableMessage, "\u7B49\u5F85\u6700\u8FD1\u7ED3\u6784\u5DE1\u68C0\u62A5\u544A\u3002")
      return
    }

    const checkByLabel = new Map(checks.filter(isRecord).map((check) => [check.label, check]))
    const resultFor = (label, success) => {
      const check = checkByLabel.get(label)
      if (!isRecord(check) || typeof check.state !== "string") return "\u672A\u63D0\u4F9B"
      if (check.state !== "available") return stateLabel(check.state)
      return success
    }
    appendCheck(
      "\u7A7A\u9875 / \u8FC7\u77ED\u9875",
      resultFor("\u7A7A\u9875\u6216\u77ED\u9875", "\u672A\u53D1\u73B0"),
      "\u9875\u9762\u6B63\u6587\u8FBE\u5230\u6700\u5C0F\u5185\u5BB9\u9608\u503C\u3002",
    )
    appendCheck(
      "\u7D22\u5F15\u540C\u6B65",
      resultFor("\u7D22\u5F15\u540C\u6B65", "\u5DF2\u540C\u6B65"),
      "wiki/index.md \u4E0E\u78C1\u76D8\u9875\u9762\u4E00\u81F4\u3002",
    )
    appendCheck(
      "\u65E5\u5FD7\u8986\u76D6",
      resultFor("\u5165\u5E93\u65E5\u5FD7\u8986\u76D6", "\u5DF2\u8986\u76D6"),
      "\u6765\u6E90\u9875\u5177\u5907\u5BF9\u5E94 ingest \u8BB0\u5F55\u3002",
    )
  }

  const renderStructuralFindings = (findings) => {
    const target = root.querySelector("[data-quality-structural]")
    if (!(target instanceof HTMLTableSectionElement) || !Array.isArray(findings)) return
    const issues = findings.filter(isRecord)
    const pagesFor = (predicate) => {
      const pages = new Set()
      issues.filter(predicate).forEach((finding) => {
        if (!Array.isArray(finding.pages)) return
        finding.pages.filter((page) => typeof page === "string").forEach((page) => pages.add(page))
      })
      return pages.size
    }
    const brokenOrOrphan = issues.filter((finding) => /^(\u5931\u6548 WikiLink|\u5BFC\u822A\u5B64\u513F\u9875\u9762)/.test(String(finding.title ?? ""))).length
    const sparse = pagesFor((finding) => /^\u4F4E\u51FA\u94FE\u9875\u9762/.test(String(finding.title ?? "")))
    const appendFinding = (label, count, unit, detail) => {
      const row = document.createElement("tr")
      appendText(row, "td", "", label)
      appendText(row, "td", "", count === 0 ? "\u672A\u53D1\u73B0" : String(count) + unit)
      appendText(row, "td", "", detail)
      target.append(row)
    }
    appendFinding("\u574F\u94FE\u4E0E\u5B64\u513F\u9875", brokenOrOrphan, " \u6761", "\u67E5\u770B\u5177\u4F53\u5F15\u7528\u4F4D\u7F6E\u540E\u518D\u51B3\u5B9A\u8865\u94FE\u6216\u4FDD\u7559\u3002")
    appendFinding("\u7A00\u758F\u94FE\u63A5", sparse, " \u9875", "\u5C11\u4E8E 2 \u4E2A\u51FA\u7AD9 WikiLink\uFF0C\u53EF\u80FD\u5F62\u6210\u77E5\u8BC6\u788E\u7247\u3002")
  }

  const renderRecommendations = (recommendations, unavailableMessage) => {
    const target = root.querySelector("[data-quality-recommendations]")
    if (!(target instanceof HTMLElement)) return
    clear(target)
    if (!Array.isArray(recommendations)) {
      target.className = "quality-section-placeholder"
      target.textContent = unavailableMessage
      return
    }
    if (recommendations.length === 0) {
      target.className = "quality-section-placeholder"
      target.textContent = "\u5C1A\u65E0\u6765\u6E90\u65B0\u9C9C\u5EA6\u5FEB\u7167\u6216\u4FEE\u590D\u5EFA\u8BAE\u3002"
      return
    }
    target.className = "quality-recommendation-list"
    recommendations.filter(isRecord).forEach((item, index) => {
      const row = document.createElement("article")
      row.className = "quality-recommendation"
      appendText(row, "span", "quality-recommendation-index", String(index + 1).padStart(2, "0"))
      const copy = document.createElement("div")
      appendText(copy, "h3", "", typeof item.title === "string" ? item.title : "\u672A\u547D\u540D\u5EFA\u8BAE")
      appendText(copy, "p", "", typeof item.summary === "string" ? item.summary : "\u8BF7\u4EBA\u5DE5\u6838\u5BF9\u6765\u6E90\u8D44\u6599\u3002")
      row.append(copy)
      target.append(row)
    })
  }

  const setSectionCount = (category, value) => {
    setText("[data-quality-section-count='" + category + "']", value)
  }
  const setTabCount = (category, value) => {
    setText("[data-quality-tab-count='" + category + "']", value)
  }
  const bindTabs = () => {
    const tabs = Array.from(root.querySelectorAll("[data-quality-tab]"))
    const select = (category) => {
      tabs.forEach((tab) => {
        if (!(tab instanceof HTMLButtonElement)) return
        const active = tab.dataset.qualityTab === category
        tab.classList.toggle("is-active", active)
        tab.setAttribute("aria-selected", String(active))
        tab.tabIndex = active ? 0 : -1
      })
      categories.forEach((item) => {
        const section = root.querySelector("[data-quality-section='" + item + "']")
        if (section instanceof HTMLElement) section.hidden = category !== "all" && item !== category
      })
    }
    tabs.forEach((tab) => {
      if (!(tab instanceof HTMLButtonElement)) return
      tab.addEventListener("click", () => select(tab.dataset.qualityTab ?? "all"))
      tab.addEventListener("keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return
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
        select(nextTab.dataset.qualityTab ?? "all")
        nextTab.focus()
      })
    })
    select("all")
  }
  const bindActions = () => {
    const reportButton = root.querySelector("[data-quality-report]")
    if (reportButton instanceof HTMLButtonElement) {
      reportButton.addEventListener("click", () => {
        loadSnapshot(true)
      })
    }
    const runButton = root.querySelector("[data-quality-run]")
    if (runButton instanceof HTMLButtonElement) {
      runButton.addEventListener("click", () => {
        showActionNote(
          "\u8FD0\u884C\u68C0\u67E5\u9700\u8981\u7BA1\u7406\u6388\u6743",
          "\u8D28\u91CF\u68C0\u67E5\u5FC5\u987B\u901A\u8FC7\u53D7\u63A7\u8FD0\u7EF4\u6D41\u7A0B\u6267\u884C\u3002\u672C\u9875\u9762\u4E0D\u4F1A\u53D1\u8D77\u5DE1\u68C0\u3001\u5199\u5165 Wiki \u6216\u521B\u5EFA\u540E\u53F0\u4EFB\u52A1\u3002",
        )
      })
    }
  }
  const showUnavailable = () => {
    if (snapshot instanceof HTMLElement) snapshot.setAttribute("aria-busy", "false")
    setText("[data-quality-generated-at]", "\u5FEB\u7167\u4E0D\u53EF\u7528")
    setText("[data-quality-generated-detail]", "\u672A\u80FD\u8BFB\u53D6\u6700\u8FD1\u8D28\u91CF\u5FEB\u7167")
    setText("[data-quality-coverage]", "\u5FEB\u7167\u4E0D\u53EF\u7528")
    setText("[data-quality-coverage-detail]", "\u9759\u6001 metadata \u8865\u5145\u4ECD\u53EF\u7528")
    setText("[data-quality-graph-state]", "\u5FEB\u7167\u4E0D\u53EF\u7528")
    setText("[data-quality-graph-detail]", "\u4E0D\u4F1A\u663E\u793A\u5386\u53F2\u56FE\u8C31\u7ED3\u8BBA")
    setText("[data-quality-lint-state]", "\u5FEB\u7167\u4E0D\u53EF\u7528")
    setText("[data-quality-lint-detail]", "\u4E0D\u4F1A\u663E\u793A\u5386\u53F2\u8BED\u4E49\u7ED3\u8BBA")
    setTabCount("all", "\u2014")
    categories.forEach((category) => {
      setTabCount(category, "\u2014")
      setSectionCount(category, "\u5FEB\u7167\u4E0D\u53EF\u7528")
    })
    renderFindings("[data-quality-findings='consistency']", null, "\u6700\u8FD1\u8BED\u4E49\u5DE1\u68C0\u62A5\u544A\u4E0D\u53EF\u7528\u3002", false)
    renderFindings("[data-quality-findings='graph']", null, "\u6700\u8FD1\u56FE\u8C31\u5065\u5EB7\u5EA6\u62A5\u544A\u4E0D\u53EF\u7528\u3002", false)
    renderStructural(null, "\u6700\u8FD1\u7ED3\u6784\u5DE1\u68C0\u62A5\u544A\u4E0D\u53EF\u7528\u3002")
    renderRecommendations(null, "\u5C1A\u65E0\u53EF\u7528\u6765\u6E90\u65B0\u9C9C\u5EA6\u5FEB\u7167\u3002")
    showEvidenceEmpty("\u6700\u8FD1\u8D28\u91CF\u5FEB\u7167\u4E0D\u53EF\u7528\uFF1B\u9759\u6001 metadata \u8865\u5145\u4ECD\u4FDD\u7559\u5728\u9875\u9762\u4E0B\u65B9\u3002")
  }
  const renderSnapshot = (payload) => {
    if (!isRecord(payload) || !isRecord(payload.snapshot) || !isRecord(payload.snapshot.checks) || !isRecord(payload.tab_counts)) {
      showUnavailable()
      return
    }
    const data = payload.snapshot
    const checks = data.checks
    const health = checks.health
    const lint = checks.lint
    const graph = checks.graph
    const freshness = checks.freshness
    if (!isRecord(health) || !isRecord(lint) || !isRecord(graph) || !isRecord(freshness) || !isRecord(data.coverage)) {
      showUnavailable()
      return
    }
    if (snapshot instanceof HTMLElement) snapshot.setAttribute("aria-busy", "false")
    setText("[data-quality-generated-at]", formatDate(data.generated_at))
    setText("[data-quality-generated-detail]", stateLabel(data.status))
    const objectCount = typeof data.current_object_count === "number" ? String(data.current_object_count) : "\u2014"
    setText("[data-quality-coverage]", objectCount + "/" + objectCount + " \u5BF9\u8C61")
    setText("[data-quality-coverage-detail]", "\u5B8C\u6574\u8986\u76D6\u5F53\u524D\u9759\u6001\u7D22\u5F15")
    setText("[data-quality-graph-state]", stateLabel(graph.state))
    setText("[data-quality-graph-detail]", typeof graph.message === "string" ? graph.message : "\u672A\u63D0\u4F9B\u56FE\u8C31\u8BF4\u660E")
    const lintCount = typeof payload.tab_counts.consistency === "number" && lint.state === "available"
      ? String(payload.tab_counts.consistency) + " \u6761\u5F85\u6838\u5BF9"
      : stateLabel(lint.state)
    setText("[data-quality-lint-state]", lintCount)
    setText("[data-quality-lint-detail]", typeof lint.message === "string" ? lint.message : "\u672A\u63D0\u4F9B\u8BED\u4E49\u5DE1\u68C0\u8BF4\u660E")

    const tabCounts = payload.tab_counts
    const currentChecks = { consistency: lint, structure: health, graph, freshness }
    const allCurrent = categories.reduce((total, category) => {
      const check = currentChecks[category]
      return total + (check.state === "available" && typeof tabCounts[category] === "number" ? tabCounts[category] : 0)
    }, 0)
    setTabCount("all", String(allCurrent))
    categories.forEach((category) => {
      const check = currentChecks[category]
      const count = check.state === "available" && typeof tabCounts[category] === "number" ? String(tabCounts[category]) : "\u2014"
      setTabCount(category, count)
      setSectionCount(category, check.state === "available" ? count + " \u9879" : stateLabel(check.state))
    })

    const selected = lint.state === "available"
      ? renderFindings("[data-quality-findings='consistency']", payload.consistency?.findings, "\u6700\u8FD1\u8BED\u4E49\u5DE1\u68C0\u62A5\u544A\u4E0D\u53EF\u7528\u3002", true)
      : renderFindings("[data-quality-findings='consistency']", null, typeof lint.message === "string" ? lint.message : "\u6700\u8FD1\u8BED\u4E49\u5DE1\u68C0\u62A5\u544A\u4E0D\u53EF\u7528\u3002", false)
    if (!(selected instanceof HTMLButtonElement)) showEvidenceEmpty("\u8BF7\u9009\u62E9\u6709\u6765\u6E90\u8BC1\u636E\u7684\u53D1\u73B0\u9879\uFF1B\u6CA1\u6709\u53D1\u73B0\u9879\u65F6\u672C\u680F\u4F1A\u4FDD\u6301\u4E3A\u7A7A\u72B6\u6001\u3002")
    renderStructural(health.state === "available" ? payload.structural?.checks : null, typeof health.message === "string" ? health.message : "\u6700\u8FD1\u7ED3\u6784\u5DE1\u68C0\u62A5\u544A\u4E0D\u53EF\u7528\u3002")
    renderStructuralFindings(health.state === "available" ? payload.structural?.findings : null)
    renderFindings("[data-quality-findings='graph']", graph.state === "available" ? payload.graph?.findings : null, typeof graph.message === "string" ? graph.message : "\u6700\u8FD1\u56FE\u8C31\u5065\u5EB7\u5EA6\u62A5\u544A\u4E0D\u53EF\u7528\u3002", false)
    renderRecommendations(freshness.state === "available" ? payload.freshness?.recommendations : null, typeof freshness.message === "string" ? freshness.message : "\u5C1A\u65E0\u53EF\u7528\u6765\u6E90\u65B0\u9C9C\u5EA6\u5FEB\u7167\u3002")
  }
  const loadSnapshot = (announce) => {
    const reportButton = root.querySelector("[data-quality-report]")
    const previousLabel = reportButton instanceof HTMLButtonElement ? reportButton.textContent : null
    if (reportButton instanceof HTMLButtonElement) {
      reportButton.disabled = true
      reportButton.textContent = "\u6B63\u5728\u8BFB\u53D6\u2026"
    }
    if (snapshot instanceof HTMLElement) snapshot.setAttribute("aria-busy", "true")
    return fetch("/api/quality/latest", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("quality snapshot unavailable")
        return response.json()
      })
      .then((payload) => {
        renderSnapshot(payload)
        if (announce) {
          const generatedAt = isRecord(payload) && isRecord(payload.snapshot)
            ? formatDate(payload.snapshot.generated_at)
            : "\u65F6\u95F4\u672A\u77E5"
          showActionNote(
            "\u5DE1\u68C0\u62A5\u544A\u5DF2\u5237\u65B0",
            "\u5DF2\u4ECE Agent \u83B7\u53D6\u6700\u8FD1\u8D28\u91CF\u5FEB\u7167\uFF08\u62A5\u544A\u65F6\u95F4\uFF1A" + generatedAt + "\uFF09\u3002\u9875\u9762\u4E2D\u7684\u6982\u89C8\u3001\u53D1\u73B0\u9879\u548C\u8BC1\u636E\u5DF2\u66F4\u65B0\uFF1B\u539F\u59CB Markdown \u62A5\u544A\u4E0D\u4F1A\u5411\u6D4F\u89C8\u5668\u66B4\u9732\u3002",
          )
        }
      })
      .catch(() => {
        showUnavailable()
        if (announce) {
          showActionNote(
            "\u5DE1\u68C0\u62A5\u544A\u8BFB\u53D6\u5931\u8D25",
            "\u672A\u80FD\u4ECE Agent \u83B7\u53D6\u6700\u8FD1\u8D28\u91CF\u5FEB\u7167\u3002\u9875\u9762\u5DF2\u4FDD\u7559\u6784\u5EFA\u671F\u9759\u6001 metadata \u68C0\u67E5\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u68C0\u67E5 wiki-backend \u4E0E\u540C\u6E90 /api \u4EE3\u7406\u3002",
          )
        }
      })
      .finally(() => {
        if (reportButton instanceof HTMLButtonElement) {
          reportButton.disabled = false
          reportButton.textContent = previousLabel || "\u67E5\u770B\u5DE1\u68C0\u62A5\u544A"
        }
      })
  }

  bindTabs()
  bindActions()
  loadSnapshot(false)
})
`;

// src/components/QualityPage.tsx
function QualityIssueGroup({
  title,
  count,
  description,
  objects,
  currentSlug
}) {
  return /* @__PURE__ */ u2("section", { class: "quality-metadata-group", children: [
    /* @__PURE__ */ u2("header", { children: [
      /* @__PURE__ */ u2("div", { children: [
        /* @__PURE__ */ u2("h2", { children: title }),
        /* @__PURE__ */ u2("p", { children: description })
      ] }),
      /* @__PURE__ */ u2("strong", { children: count })
    ] }),
    objects.length > 0 ? /* @__PURE__ */ u2("div", { class: "quality-metadata-list", children: [
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
    ] }) : /* @__PURE__ */ u2("p", { class: "quality-metadata-empty", children: "\u5F53\u524D\u6784\u5EFA\u672A\u53D1\u73B0\u6B64\u7C7B\u5143\u6570\u636E\u7F3A\u53E3\u3002" })
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
    return /* @__PURE__ */ u2("main", { class: "knowledge-quality", children: [
      /* @__PURE__ */ u2("header", { class: "knowledge-quality-header", children: [
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("p", { children: "\u8D28\u91CF\u5DE1\u68C0\u5FEB\u7167" }),
          /* @__PURE__ */ u2("h1", { children: "\u77E5\u8BC6\u8D28\u91CF" }),
          /* @__PURE__ */ u2("span", { children: "\u4EE5\u6700\u8FD1\u4E00\u6B21\u6210\u529F\u7684 health\u3001lint \u4E0E graph \u5DE1\u68C0\u4E3A\u4F9D\u636E\uFF1B\u8BED\u4E49\u53D1\u73B0\u5747\u9700\u56DE\u5230\u6765\u6E90\u8D44\u6599\u4EBA\u5DE5\u786E\u8BA4\u3002" })
        ] }),
        /* @__PURE__ */ u2("div", { class: "quality-header-actions", children: [
          /* @__PURE__ */ u2("button", { type: "button", class: "quality-action-secondary", "data-quality-report": true, children: "\u67E5\u770B\u5DE1\u68C0\u62A5\u544A" }),
          /* @__PURE__ */ u2("button", { type: "button", class: "quality-action-primary", "data-quality-run": true, children: "\u8FD0\u884C\u65B0\u4E00\u8F6E\u68C0\u67E5" })
        ] })
      ] }),
      /* @__PURE__ */ u2("section", { class: "quality-action-note", "data-quality-action-note": true, "aria-live": "polite", tabindex: -1, hidden: true, children: [
        /* @__PURE__ */ u2("strong", { "data-quality-action-note-title": true, children: "\u8D28\u91CF\u9875\u8BF4\u660E" }),
        /* @__PURE__ */ u2("p", { "data-quality-action-note-body": true })
      ] }),
      /* @__PURE__ */ u2("section", { class: "quality-status", "aria-label": "\u5DE1\u68C0\u6982\u89C8", "data-quality-snapshot": true, "aria-busy": "true", children: [
        /* @__PURE__ */ u2("div", { class: "quality-status-item", children: [
          /* @__PURE__ */ u2("span", { class: "quality-status-label", children: "\u62A5\u544A\u751F\u6210\u65F6\u95F4" }),
          /* @__PURE__ */ u2("strong", { "data-quality-generated-at": true, children: "\u6B63\u5728\u8BFB\u53D6" }),
          /* @__PURE__ */ u2("small", { "data-quality-generated-detail": true, children: "\u7B49\u5F85\u6700\u8FD1\u8D28\u91CF\u5FEB\u7167" })
        ] }),
        /* @__PURE__ */ u2("div", { class: "quality-status-item", children: [
          /* @__PURE__ */ u2("span", { class: "quality-status-label", children: "\u68C0\u67E5\u8986\u76D6" }),
          /* @__PURE__ */ u2("strong", { "data-quality-coverage": true, children: "\u6B63\u5728\u8BFB\u53D6" }),
          /* @__PURE__ */ u2("small", { "data-quality-coverage-detail": true, children: "\u7B49\u5F85\u6700\u8FD1\u8D28\u91CF\u5FEB\u7167" })
        ] }),
        /* @__PURE__ */ u2("div", { class: "quality-status-item", children: [
          /* @__PURE__ */ u2("span", { class: "quality-status-label", children: "\u56FE\u8C31\u72B6\u6001" }),
          /* @__PURE__ */ u2("strong", { "data-quality-graph-state": true, children: "\u6B63\u5728\u8BFB\u53D6" }),
          /* @__PURE__ */ u2("small", { "data-quality-graph-detail": true, children: "\u56FE\u8C31\u4E0D\u4F1A\u4EE5\u5386\u53F2\u7ED3\u679C\u4EE3\u66FF\u5F53\u524D\u7ED3\u8BBA" })
        ] }),
        /* @__PURE__ */ u2("div", { class: "quality-status-item", children: [
          /* @__PURE__ */ u2("span", { class: "quality-status-label", children: "\u8BED\u4E49\u5DE1\u68C0" }),
          /* @__PURE__ */ u2("strong", { "data-quality-lint-state": true, children: "\u6B63\u5728\u8BFB\u53D6" }),
          /* @__PURE__ */ u2("small", { "data-quality-lint-detail": true, children: "\u8BED\u4E49\u68C0\u67E5\u8303\u56F4\u5C06\u5728\u5FEB\u7167\u4E2D\u8BF4\u660E" })
        ] })
      ] }),
      /* @__PURE__ */ u2("nav", { class: "quality-tabs", "aria-label": "\u8D28\u91CF\u7C7B\u522B", role: "tablist", children: [
        /* @__PURE__ */ u2("button", { type: "button", class: "is-active", "data-quality-tab": "all", role: "tab", "aria-selected": "true", children: [
          "\u5168\u90E8\u53D1\u73B0\u9879 ",
          /* @__PURE__ */ u2("span", { "data-quality-tab-count": "all", children: "\u2014" })
        ] }),
        /* @__PURE__ */ u2("button", { type: "button", "data-quality-tab": "structure", role: "tab", "aria-selected": "false", tabindex: -1, children: [
          "\u7ED3\u6784\u5B8C\u6574\u6027 ",
          /* @__PURE__ */ u2("span", { "data-quality-tab-count": "structure", children: "\u2014" })
        ] }),
        /* @__PURE__ */ u2("button", { type: "button", "data-quality-tab": "consistency", role: "tab", "aria-selected": "false", tabindex: -1, children: [
          "\u5185\u5BB9\u4E00\u81F4\u6027 ",
          /* @__PURE__ */ u2("span", { "data-quality-tab-count": "consistency", children: "\u2014" })
        ] }),
        /* @__PURE__ */ u2("button", { type: "button", "data-quality-tab": "graph", role: "tab", "aria-selected": "false", tabindex: -1, children: [
          "\u56FE\u8C31\u5065\u5EB7\u5EA6 ",
          /* @__PURE__ */ u2("span", { "data-quality-tab-count": "graph", children: "\u2014" })
        ] }),
        /* @__PURE__ */ u2("button", { type: "button", "data-quality-tab": "freshness", role: "tab", "aria-selected": "false", tabindex: -1, children: [
          "\u65B0\u9C9C\u5EA6\u4E0E\u4FEE\u590D ",
          /* @__PURE__ */ u2("span", { "data-quality-tab-count": "freshness", children: "\u2014" })
        ] })
      ] }),
      /* @__PURE__ */ u2("div", { class: "quality-layout", children: [
        /* @__PURE__ */ u2("div", { class: "quality-stream", "aria-live": "polite", children: [
          /* @__PURE__ */ u2("section", { class: "quality-section", "data-quality-section": "structure", children: [
            /* @__PURE__ */ u2("header", { class: "quality-section-header", children: [
              /* @__PURE__ */ u2("div", { children: [
                /* @__PURE__ */ u2("p", { children: "Health + Lint \xB7 \u786E\u5B9A\u6027\u68C0\u67E5" }),
                /* @__PURE__ */ u2("h2", { children: "\u7ED3\u6784\u5B8C\u6574\u6027" }),
                /* @__PURE__ */ u2("span", { children: "\u7ED3\u6784\u7ED3\u679C\u53EF\u590D\u73B0\uFF1B\u672C\u9875\u4E0D\u4F1A\u7528\u5355\u4E00\u5065\u5EB7\u5206\u6570\u66FF\u4EE3\u5177\u4F53\u68C0\u67E5\u9879\u3002" })
              ] }),
              /* @__PURE__ */ u2("strong", { "data-quality-section-count": "structure", children: "\u7B49\u5F85\u5FEB\u7167" })
            ] }),
            /* @__PURE__ */ u2("table", { class: "quality-check-matrix", children: [
              /* @__PURE__ */ u2("thead", { children: /* @__PURE__ */ u2("tr", { children: [
                /* @__PURE__ */ u2("th", { children: "\u68C0\u67E5\u9879" }),
                /* @__PURE__ */ u2("th", { children: "\u672C\u6B21\u7ED3\u679C" }),
                /* @__PURE__ */ u2("th", { children: "\u8BF4\u660E" })
              ] }) }),
              /* @__PURE__ */ u2("tbody", { "data-quality-structural": true, children: /* @__PURE__ */ u2("tr", { children: /* @__PURE__ */ u2("td", { colSpan: 3, children: "\u6B63\u5728\u8BFB\u53D6\u6700\u8FD1\u7ED3\u6784\u5DE1\u68C0\u62A5\u544A\u3002" }) }) })
            ] })
          ] }),
          /* @__PURE__ */ u2("section", { class: "quality-section", "data-quality-section": "consistency", children: [
            /* @__PURE__ */ u2("header", { class: "quality-section-header", children: [
              /* @__PURE__ */ u2("div", { children: [
                /* @__PURE__ */ u2("p", { children: "Lint \xB7 \u8BED\u4E49\u5DE1\u68C0" }),
                /* @__PURE__ */ u2("h2", { children: "\u5185\u5BB9\u4E00\u81F4\u6027" }),
                /* @__PURE__ */ u2("span", { children: "\u540C\u4E00\u4E3B\u9898\u5728\u4E0D\u540C\u8D44\u6599\u4E2D\u7684\u51B2\u7A81\u6216\u53E3\u5F84\u5DEE\u5F02\uFF0C\u9700\u8981\u4EBA\u5DE5\u56DE\u5230\u6765\u6E90\u8D44\u6599\u786E\u8BA4\u3002" })
              ] }),
              /* @__PURE__ */ u2("strong", { "data-quality-section-count": "consistency", children: "\u7B49\u5F85\u5FEB\u7167" })
            ] }),
            /* @__PURE__ */ u2("div", { class: "quality-section-placeholder", "data-quality-findings": "consistency", children: "\u6B63\u5728\u8BFB\u53D6\u6700\u8FD1\u8BED\u4E49\u5DE1\u68C0\u62A5\u544A\u3002" })
          ] }),
          /* @__PURE__ */ u2("section", { class: "quality-section", "data-quality-section": "graph", children: [
            /* @__PURE__ */ u2("header", { class: "quality-section-header", children: [
              /* @__PURE__ */ u2("div", { children: [
                /* @__PURE__ */ u2("p", { children: "Graph \xB7 \u5173\u8054\u97E7\u6027" }),
                /* @__PURE__ */ u2("h2", { children: "\u56FE\u8C31\u5065\u5EB7\u5EA6" }),
                /* @__PURE__ */ u2("span", { children: "\u4EC5\u4F7F\u7528\u4E0E\u5F53\u524D Wiki \u540C\u6B65\u7684\u56FE\u8C31\u7ED3\u679C\uFF1B\u8FC7\u671F\u56FE\u8C31\u4E0D\u4F1A\u4F5C\u4E3A\u5F53\u524D\u7ED3\u8BBA\u5C55\u793A\u3002" })
              ] }),
              /* @__PURE__ */ u2("strong", { "data-quality-section-count": "graph", children: "\u7B49\u5F85\u5FEB\u7167" })
            ] }),
            /* @__PURE__ */ u2("div", { class: "quality-section-placeholder", "data-quality-findings": "graph", children: "\u6B63\u5728\u8BFB\u53D6\u6700\u8FD1\u56FE\u8C31\u5065\u5EB7\u5EA6\u62A5\u544A\u3002" })
          ] }),
          /* @__PURE__ */ u2("section", { class: "quality-section", "data-quality-section": "freshness", children: [
            /* @__PURE__ */ u2("header", { class: "quality-section-header", children: [
              /* @__PURE__ */ u2("div", { children: [
                /* @__PURE__ */ u2("p", { children: "Refresh + Heal \xB7 \u53D7\u63A7\u4FEE\u590D" }),
                /* @__PURE__ */ u2("h2", { children: "\u65B0\u9C9C\u5EA6\u4E0E\u4FEE\u590D" }),
                /* @__PURE__ */ u2("span", { children: "\u672C\u9875\u4EC5\u5C55\u793A\u5DF2\u6709\u6765\u6E90\u5FEB\u7167\u548C\u5EFA\u8BAE\uFF1B\u4E0D\u4F1A\u76F4\u63A5\u8FD0\u884C refresh \u6216 heal\u3002" })
              ] }),
              /* @__PURE__ */ u2("strong", { "data-quality-section-count": "freshness", children: "\u7B49\u5F85\u5FEB\u7167" })
            ] }),
            /* @__PURE__ */ u2("div", { class: "quality-section-placeholder", "data-quality-recommendations": true, children: "\u6B63\u5728\u8BFB\u53D6\u6765\u6E90\u65B0\u9C9C\u5EA6\u5FEB\u7167\u3002" })
          ] }),
          /* @__PURE__ */ u2("section", { class: "quality-metadata", "data-quality-metadata": true, id: "metadata-gaps", children: [
            /* @__PURE__ */ u2("header", { class: "quality-section-header", children: [
              /* @__PURE__ */ u2("div", { children: [
                /* @__PURE__ */ u2("p", { children: "Quartz \xB7 \u6784\u5EFA\u671F\u7D22\u5F15" }),
                /* @__PURE__ */ u2("h2", { children: "\u9759\u6001 metadata \u8865\u5145" }),
                /* @__PURE__ */ u2("span", { children: "\u7EDF\u8BA1\u672C\u6B21\u6784\u5EFA\u4E2D\u516C\u5F00\u5C55\u793A\u7684 source\u3001entity\u3001concept\u3001synthesis \u9875\u9762\uFF1B\u4E09\u7C7B\u7F3A\u53E3\u5206\u522B\u8BA1\u6570\uFF0C\u540C\u4E00\u5BF9\u8C61\u53EF\u540C\u65F6\u51FA\u73B0\u3002" })
              ] }),
              /* @__PURE__ */ u2("strong", { children: [
                summary.affectedObjects,
                " \u9879\u7F3A\u53E3"
              ] })
            ] }),
            /* @__PURE__ */ u2("div", { class: "quality-metadata-grid", children: [
              /* @__PURE__ */ u2(
                QualityIssueGroup,
                {
                  title: "\u7F3A\u5C11\u6458\u8981",
                  count: summary.missingDescriptions,
                  description: "\u6784\u5EFA\u6570\u636E\u548C frontmatter \u4E2D\u5747\u6CA1\u6709\u975E\u7A7A description\u3002",
                  objects: missingDescriptions,
                  currentSlug
                }
              ),
              /* @__PURE__ */ u2(
                QualityIssueGroup,
                {
                  title: "\u7F3A\u5C11\u6807\u7B7E",
                  count: summary.missingTags,
                  description: "frontmatter \u4E2D\u6CA1\u6709\u975E\u7A7A tags \u6570\u7EC4\u3002",
                  objects: missingTags,
                  currentSlug
                }
              ),
              /* @__PURE__ */ u2(
                QualityIssueGroup,
                {
                  title: "\u66F4\u65B0\u65F6\u95F4\u672A\u77E5",
                  count: summary.missingDates,
                  description: "last_updated\u3001modified \u548C\u6784\u5EFA\u8BB0\u5F55\u4E2D\u5747\u6CA1\u6709\u53EF\u786E\u8BA4\u7684\u66F4\u65B0\u65F6\u95F4\u3002",
                  objects: missingDates,
                  currentSlug
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ u2("aside", { class: "quality-side", children: /* @__PURE__ */ u2("section", { class: "quality-evidence-panel", "data-quality-evidence": true, "aria-live": "polite", children: [
          /* @__PURE__ */ u2("header", { class: "quality-evidence-header", children: [
            /* @__PURE__ */ u2("div", { children: [
              /* @__PURE__ */ u2("p", { children: "\u9009\u4E2D\u53D1\u73B0\u9879" }),
              /* @__PURE__ */ u2("h2", { children: "\u8BC1\u636E\u5BF9\u6BD4" })
            ] }),
            /* @__PURE__ */ u2("span", { "data-quality-evidence-state": true, children: "\u7B49\u5F85\u5FEB\u7167" })
          ] }),
          /* @__PURE__ */ u2("div", { class: "quality-evidence-empty", "data-quality-evidence-body": true, children: "\u6700\u8FD1\u8D28\u91CF\u5FEB\u7167\u52A0\u8F7D\u540E\uFF0C\u6B64\u5904\u5C06\u663E\u793A\u6D89\u53CA\u9875\u9762\u3001\u6700\u591A\u4E24\u6761\u6765\u6E90\u8BC1\u636E\u4E0E\u5EFA\u8BAE\u6838\u5BF9\u52A8\u4F5C\u3002" })
        ] }) })
      ] })
    ] });
  };
  QualityPage2.afterDOMLoaded = qualityScript;
  return QualityPage2;
});

// src/components/SettingsPage.tsx
var settingsSections = [
  {
    title: "Prompt",
    description: "\u7EF4\u62A4\u95EE\u7B54\u3001\u5165\u5E93\u548C\u77E5\u8BC6\u7EFC\u5408\u4F7F\u7528\u7684\u63D0\u793A\u6A21\u677F\u4E0E\u7248\u672C\u8BB0\u5F55\u3002",
    status: "\u7248\u672C\u5316\u7BA1\u7406",
    items: ["\u95EE\u7B54\u63D0\u793A\u6A21\u677F", "\u6587\u6863\u5165\u5E93\u6A21\u677F", "\u7EFC\u5408\u5206\u6790\u6A21\u677F"]
  },
  {
    title: "\u53D1\u5E03",
    description: "\u786E\u8BA4\u77E5\u8BC6\u53D8\u66F4\u4F55\u65F6\u91CD\u65B0\u6784\u5EFA\u4E3A\u53EF\u8BBF\u95EE\u7684\u9759\u6001\u7AD9\u70B9\u3002",
    status: "\u9700\u6267\u884C\u6784\u5EFA",
    items: ["\u5F85\u53D1\u5E03\u53D8\u66F4", "Quartz \u6784\u5EFA", "\u7F13\u5B58\u5931\u6548\u7B56\u7565"]
  },
  {
    title: "\u7528\u6237\u4E0E\u5BA1\u8BA1",
    description: "\u67E5\u770B\u8BBF\u95EE\u6743\u9650\u3001\u5173\u952E\u64CD\u4F5C\u548C\u914D\u7F6E\u8C03\u6574\u7684\u53EF\u8FFD\u6EAF\u8BB0\u5F55\u3002",
    status: "\u5F85\u63A5\u5165\u6743\u9650\u670D\u52A1",
    items: ["\u8BBF\u95EE\u89D2\u8272", "\u64CD\u4F5C\u5BA1\u8BA1", "\u914D\u7F6E\u53D8\u66F4\u8BB0\u5F55"]
  }
];
var modelUsageSections = [
  {
    key: "fast",
    title: "\u5FEB\u901F\u95EE\u7B54\u6A21\u578B",
    description: "FAST\uFF0C\u7531\u670D\u52A1\u7AEF\u5185\u90E8\u8C03\u7528\uFF0C\u4E0D\u53D7\u77E5\u8BC6\u95EE\u7B54 Chat \u7684\u6A21\u578B\u9009\u62E9\u5F71\u54CD\u3002",
    items: [
      "\u77E5\u8BC6\u95EE\u7B54\uFF1A\u5173\u952E\u8BCD\u4E0E\u56FE\u8C31\u672A\u627E\u5230\u8DB3\u591F\u9875\u9762\u65F6\u9009\u62E9\u76F8\u5173\u9875\u9762",
      "\u65E0\u72B6\u6001\u95EE\u7B54\uFF1A\u9009\u62E9\u76F8\u5173\u9875\u9762",
      "\u77E5\u8BC6\u56FE\u8C31\uFF1A\u542F\u7528\u5173\u7CFB\u63A8\u65AD\u65F6\u5206\u6790\u9875\u9762\u5173\u7CFB"
    ]
  },
  {
    key: "main",
    title: "\u6DF1\u5EA6\u5206\u6790\u6A21\u578B",
    description: "MAIN\uFF0C\u7531\u670D\u52A1\u7AEF\u5185\u90E8\u8C03\u7528\uFF0C\u4E0D\u53D7\u77E5\u8BC6\u95EE\u7B54 Chat \u7684\u6A21\u578B\u9009\u62E9\u5F71\u54CD\u3002",
    items: [
      "\u65E0\u72B6\u6001\u95EE\u7B54\uFF1A\u751F\u6210\u6700\u7EC8\u7B54\u6848",
      "\u6587\u6863\u5165\u5E93\uFF1A\u62BD\u53D6\u5185\u5BB9\u5E76\u751F\u6210\u77E5\u8BC6\u9875\u9762",
      "\u77E5\u8BC6\u8D28\u91CF\uFF1A\u6267\u884C\u8BED\u4E49\u5206\u6790\u4E0E\u751F\u6210\u5DE1\u68C0\u62A5\u544A"
    ]
  }
];
var settingsScript = `
document.addEventListener("nav", () => {
  const container = document.querySelector("[data-model-profiles-overview]")
  const internalModelNodes = document.querySelectorAll("[data-internal-model]")
  if (!(container instanceof HTMLElement) || container.dataset.bound === "true") return
  container.dataset.bound = "true"

  const renderFailure = () => {
    container.replaceChildren()
    const message = document.createElement("p")
    message.className = "settings-model-profiles-empty"
    message.textContent = "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u670D\u52A1\u7AEF\u6A21\u578B\u914D\u7F6E\uFF1B\u8BF7\u786E\u8BA4\u540E\u7AEF\u670D\u52A1\u53EF\u7528\u540E\u5237\u65B0\u9875\u9762\u3002"
    container.appendChild(message)
    for (const node of internalModelNodes) {
      if (node instanceof HTMLElement) {
        node.textContent = "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u670D\u52A1\u7AEF\u914D\u7F6E"
      }
    }
  }

  fetch("/api/model-profiles/overview", { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status))
      return response.json()
    })
    .then((overview) => {
      if (!overview || !Array.isArray(overview.chat_models)) throw new Error("invalid payload")
      container.replaceChildren()
      const validProfiles = overview.chat_models.filter((profile) =>
        profile &&
        typeof profile.label === "string",
      )
      if (validProfiles.length === 0) {
        const message = document.createElement("p")
        message.className = "settings-model-profiles-empty"
        message.textContent = "\u5F53\u524D\u6CA1\u6709\u5DF2\u542F\u7528\u7684\u56DE\u7B54\u6A21\u578B\u3002"
        container.appendChild(message)
      }

      for (const profile of validProfiles) {
        const row = document.createElement("article")
        row.className = "settings-model-profile"
        const name = document.createElement("strong")
        name.textContent = profile.label
        row.appendChild(name)
        container.appendChild(row)
      }

      for (const node of internalModelNodes) {
        if (!(node instanceof HTMLElement)) continue
        const model = overview[node.dataset.internalModel + "_model"]
        if (!model || typeof model.provider !== "string" || typeof model.model !== "string") {
          throw new Error("invalid internal model")
        }
        node.textContent = model.provider + " / " + model.model
      }
    })
    .catch(renderFailure)
})
`;
var SettingsPage_default = (() => {
  const SettingsPage2 = (props) => {
    const currentSlug = "settings";
    const qualityHref = resolveRelative(currentSlug, "quality");
    const ingestHref = resolveRelative(currentSlug, "ingest");
    return /* @__PURE__ */ u2("main", { class: "system-settings", children: [
      /* @__PURE__ */ u2("header", { class: "system-settings-header", children: [
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("p", { children: "\u8FD0\u884C\u7BA1\u7406" }),
          /* @__PURE__ */ u2("h1", { children: "\u7CFB\u7EDF\u8BBE\u7F6E" }),
          /* @__PURE__ */ u2("span", { children: "\u914D\u7F6E\u7BA1\u7406\u4E0E\u77E5\u8BC6\u53D1\u5E03\u5206\u5F00\u6267\u884C\uFF1B\u6B64\u9875\u9762\u53EA\u5448\u73B0\u53EF\u786E\u8BA4\u7684\u7BA1\u7406\u8FB9\u754C\uFF0C\u4E0D\u5C06\u9759\u6001\u754C\u9762\u4F2A\u88C5\u6210\u53EF\u5199\u5165\u7684\u8FD0\u884C\u914D\u7F6E\u3002" })
        ] }),
        /* @__PURE__ */ u2("div", { class: "system-settings-actions", children: [
          /* @__PURE__ */ u2("a", { href: qualityHref, children: "\u67E5\u770B\u77E5\u8BC6\u8D28\u91CF" }),
          /* @__PURE__ */ u2("a", { href: ingestHref, children: "\u8FDB\u5165\u6587\u6863\u5165\u5E93" })
        ] })
      ] }),
      /* @__PURE__ */ u2("section", { class: "settings-runtime-note", "aria-labelledby": "settings-runtime-note-title", children: [
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("p", { children: "\u5F53\u524D\u8FD0\u884C\u65B9\u5F0F" }),
          /* @__PURE__ */ u2("h2", { id: "settings-runtime-note-title", children: "\u53C2\u6570\u7531\u670D\u52A1\u7AEF\u914D\u7F6E\uFF0C\u7AD9\u70B9\u7531 Quartz \u5355\u72EC\u53D1\u5E03" })
        ] }),
        /* @__PURE__ */ u2("p", { children: "\u6A21\u578B\u4E0E Prompt \u7531 `wiki-backend` \u7684\u53D7\u63A7\u914D\u7F6E\u63D0\u4F9B\uFF1B\u6587\u6863\u5165\u5E93\u5B8C\u6210\u540E\u4ECD\u9700\u91CD\u65B0\u6784\u5EFA Quartz\uFF0C\u9759\u6001\u9875\u9762\u548C\u5185\u5BB9\u7D22\u5F15\u624D\u4F1A\u66F4\u65B0\u3002" })
      ] }),
      /* @__PURE__ */ u2("section", { class: "settings-model-profiles", "aria-labelledby": "settings-model-profiles-title", children: [
        /* @__PURE__ */ u2("header", { children: [
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2("p", { children: "\u53EA\u8BFB\u6982\u89C8" }),
            /* @__PURE__ */ u2("h2", { id: "settings-model-profiles-title", children: "\u77E5\u8BC6\u95EE\u7B54\u6A21\u578B" })
          ] }),
          /* @__PURE__ */ u2("span", { children: "\u7531\u540E\u7AEF\u53D7\u63A7\u6863\u6848\u63D0\u4F9B" })
        ] }),
        /* @__PURE__ */ u2("p", { children: "\u7531\u540E\u7AEF\u8FD4\u56DE\u77E5\u8BC6\u95EE\u7B54 Chat \u5F53\u524D\u53EF\u9009\u62E9\u7684\u6A21\u578B\u540D\u79F0\uFF1B\u6B64\u9875\u9762\u4E0D\u5141\u8BB8\u4FEE\u6539\u6A21\u578B\u670D\u52A1\u3001\u51ED\u636E\u3001Prompt \u6216\u7CFB\u7EDF\u9ED8\u8BA4\u914D\u7F6E\u3002" }),
        /* @__PURE__ */ u2("div", { class: "settings-model-profiles-list", "data-model-profiles-overview": true, children: /* @__PURE__ */ u2("p", { class: "settings-model-profiles-empty", children: "\u6B63\u5728\u52A0\u8F7D\u77E5\u8BC6\u95EE\u7B54\u6A21\u578B\u2026" }) })
      ] }),
      /* @__PURE__ */ u2("div", { class: "settings-section-grid settings-model-usage-grid", children: modelUsageSections.map((section) => /* @__PURE__ */ u2("section", { class: "settings-section", children: [
        /* @__PURE__ */ u2("header", { children: [
          /* @__PURE__ */ u2("div", { class: "settings-model-usage-copy", children: [
            /* @__PURE__ */ u2("h2", { children: section.title }),
            /* @__PURE__ */ u2("p", { children: section.description })
          ] }),
          /* @__PURE__ */ u2("strong", { class: "settings-internal-model", "data-internal-model": section.key, children: "\u6B63\u5728\u8BFB\u53D6\u670D\u52A1\u7AEF\u914D\u7F6E\u2026" })
        ] }),
        /* @__PURE__ */ u2("ul", { children: section.items.map((item) => /* @__PURE__ */ u2("li", { children: item })) })
      ] })) }),
      /* @__PURE__ */ u2("div", { class: "settings-section-grid", children: settingsSections.map((section) => /* @__PURE__ */ u2("section", { class: "settings-section", children: [
        /* @__PURE__ */ u2("header", { children: [
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2("h2", { children: section.title }),
            /* @__PURE__ */ u2("p", { children: section.description })
          ] }),
          /* @__PURE__ */ u2("span", { children: section.status })
        ] }),
        /* @__PURE__ */ u2("ul", { children: section.items.map((item) => /* @__PURE__ */ u2("li", { children: [
          item,
          /* @__PURE__ */ u2("span", { children: "\u67E5\u770B" })
        ] })) })
      ] })) }),
      /* @__PURE__ */ u2("p", { class: "settings-boundary", children: "\u5199\u5165\u6A21\u578B\u53C2\u6570\u3001Prompt\u3001\u53D1\u5E03\u64CD\u4F5C\u6216\u7528\u6237\u6743\u9650\u9700\u8981\u5BF9\u5E94\u7684\u540E\u7AEF API \u4E0E\u6388\u6743\u7B56\u7565\uFF1B\u5F53\u524D\u9759\u6001\u7AD9\u70B9\u4E0D\u4F1A\u76F4\u63A5\u6267\u884C\u8FD9\u4E9B\u53D8\u66F4\u3002" })
    ] });
  };
  SettingsPage2.afterDOMLoaded = settingsScript;
  return SettingsPage2;
});

// src/components/KnowledgePage.tsx
var HomePage = HomePage_default();
var LibraryPage = LibraryPage_default();
var QualityPage = QualityPage_default();
var SettingsPage = SettingsPage_default();
var KnowledgePage_default = (() => {
  const KnowledgePage = (props) => {
    if (props.fileData.slug === "library") return LibraryPage(props);
    if (props.fileData.slug === "quality") return QualityPage(props);
    if (props.fileData.slug === "settings") return SettingsPage(props);
    return HomePage(props);
  };
  KnowledgePage.afterDOMLoaded = [
    HomePage.afterDOMLoaded,
    LibraryPage.afterDOMLoaded,
    QualityPage.afterDOMLoaded,
    SettingsPage.afterDOMLoaded
  ].filter((script) => typeof script === "string").join("\n");
  return KnowledgePage;
});

// src/pageType.ts
var KnowledgePageType = () => ({
  name: "KnowledgePageType",
  priority: 100,
  match: ({ slug: slug2 }) => slug2 === "index" || slug2 === "library" || slug2 === "quality" || slug2 === "settings",
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
      },
      {
        slug: "settings",
        title: "\u7CFB\u7EDF\u8BBE\u7F6E",
        data: {
          unlisted: true,
          description: "\u67E5\u770B\u6A21\u578B\u3001Prompt\u3001\u53D1\u5E03\u3001\u7528\u6237\u4E0E\u5BA1\u8BA1\u7684\u8FD0\u884C\u7BA1\u7406\u8FB9\u754C\u3002"
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
        title: "\u4E2D\u538B\u5E02\u573A\u90E8\u77E5\u8BC6\u5E93",
        description: "\u68C0\u7D22\u4EA7\u54C1\u3001\u6280\u672F\u53C2\u6570\u3001\u6807\u51C6\u4E0E\u8BBE\u5907\u5173\u7CFB\uFF0C\u5E76\u57FA\u4E8E\u5DF2\u53D1\u5E03\u8D44\u6599\u5F00\u5C55\u77E5\u8BC6\u95EE\u7B54\u3002"
      };
      componentData.fileData.description = "\u68C0\u7D22\u4EA7\u54C1\u3001\u6280\u672F\u53C2\u6570\u3001\u6807\u51C6\u4E0E\u8BBE\u5907\u5173\u7CFB\uFF0C\u5E76\u57FA\u4E8E\u5DF2\u53D1\u5E03\u8D44\u6599\u5F00\u5C55\u77E5\u8BC6\u95EE\u7B54\u3002";
    }
  ]
});

export { KnowledgePageType };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map