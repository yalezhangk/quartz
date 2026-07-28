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

// src/components/AppNavigation.tsx
function getAreaLabel(slug2) {
  if (slug2 === "index") return "\u9996\u9875";
  if (slug2 === "library") return "\u77E5\u8BC6\u5E93";
  if (slug2 === "chats" || slug2.startsWith("chats/")) return "\u77E5\u8BC6\u95EE\u7B54";
  if (slug2 === "ingest") return "\u6587\u6863\u5165\u5E93";
  if (slug2 === "quality") return "\u77E5\u8BC6\u8D28\u91CF";
  if (slug2 === "settings") return "\u7CFB\u7EDF\u8BBE\u7F6E";
  if (slug2 === "graph" || slug2.startsWith("graph/")) return "\u77E5\u8BC6\u56FE\u8C31";
  return "\u77E5\u8BC6\u6B63\u6587";
}
function NavigationIcon({ name }) {
  const common = {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.55",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  };
  if (name === "home") {
    return /* @__PURE__ */ u2("svg", { ...common, children: [
      /* @__PURE__ */ u2("path", { d: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" }),
      /* @__PURE__ */ u2("path", { d: "M9 21v-7h6v7" })
    ] });
  }
  if (name === "library") {
    return /* @__PURE__ */ u2("svg", { ...common, children: [
      /* @__PURE__ */ u2("path", { d: "M5 4h14v16H5z" }),
      /* @__PURE__ */ u2("path", { d: "M8 8h8M8 12h8M8 16h5" })
    ] });
  }
  if (name === "chat") {
    return /* @__PURE__ */ u2("span", { class: "app-question-mark", children: "?" });
  }
  if (name === "ingest") {
    return /* @__PURE__ */ u2("svg", { ...common, children: [
      /* @__PURE__ */ u2("path", { d: "M12 3v12" }),
      /* @__PURE__ */ u2("path", { d: "m8 7 4-4 4 4" }),
      /* @__PURE__ */ u2("path", { d: "M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" })
    ] });
  }
  if (name === "graph") {
    return /* @__PURE__ */ u2("svg", { ...common, children: [
      /* @__PURE__ */ u2("circle", { cx: "6", cy: "6", r: "2.5" }),
      /* @__PURE__ */ u2("circle", { cx: "18", cy: "6", r: "2.5" }),
      /* @__PURE__ */ u2("circle", { cx: "6", cy: "18", r: "2.5" }),
      /* @__PURE__ */ u2("circle", { cx: "18", cy: "18", r: "2.5" }),
      /* @__PURE__ */ u2("path", { d: "m8.2 7.2 7.6 3.6M8.2 16.8l7.6-3.6M6 8.5v7" })
    ] });
  }
  if (name === "quality") {
    return /* @__PURE__ */ u2("svg", { ...common, children: /* @__PURE__ */ u2("path", { d: "m5 12 4 4L19 5" }) });
  }
  return /* @__PURE__ */ u2("svg", { ...common, children: [
    /* @__PURE__ */ u2("circle", { cx: "12", cy: "12", r: "3" }),
    /* @__PURE__ */ u2("path", { d: "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.3 2.3-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.3-2.3.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.3-2.3.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3.5h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.3 2.3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" })
  ] });
}
var navigationScript = `
document.addEventListener("nav", () => {
  const mainContent = document.querySelector("#quartz-body > .center")
  if (mainContent instanceof HTMLElement) mainContent.id = "main-content"

  const topbar = document.querySelector("[data-app-topbar]")
  if (!(topbar instanceof HTMLElement) || topbar.dataset.bound === "true") return
  topbar.dataset.bound = "true"

  const searchTrigger = topbar.querySelector("[data-app-search]")
  if (searchTrigger instanceof HTMLButtonElement) {
    searchTrigger.addEventListener("click", () => {
      const quartzSearch = document.querySelector(".search > .search-button")
      if (quartzSearch instanceof HTMLButtonElement) quartzSearch.click()
    })
  }

  const copyTrigger = topbar.querySelector("[data-copy-page-link]")
  if (copyTrigger instanceof HTMLButtonElement) {
    copyTrigger.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        copyTrigger.textContent = "\u94FE\u63A5\u5DF2\u590D\u5236"
      } catch {
        copyTrigger.textContent = "\u590D\u5236\u5931\u8D25"
      }
      window.setTimeout(() => { copyTrigger.textContent = "\u590D\u5236\u94FE\u63A5" }, 1600)
    })
  }

  const healthCard = document.querySelector("[data-platform-health-card]")
  const healthCardDetail = document.querySelector("[data-platform-health-detail]")
  if (healthCard instanceof HTMLElement) {
    fetch("/api/health", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        healthCard.textContent = "\u7CFB\u7EDF\u8FD0\u884C\u6B63\u5E38"
        healthCard.classList.add("is-healthy")
        if (healthCardDetail instanceof HTMLElement) healthCardDetail.textContent = "\u540E\u7AEF\u5065\u5EB7\u68C0\u67E5\u5DF2\u901A\u8FC7"
      })
      .catch(() => {
        healthCard.textContent = "\u9700\u8981\u68C0\u67E5\u7CFB\u7EDF"
        healthCard.classList.add("is-unavailable")
        if (healthCardDetail instanceof HTMLElement) healthCardDetail.textContent = "\u65E0\u6CD5\u8FDE\u63A5 /api/health"
      })
  }
})
`;
var navigationItems = [
  { label: "\u9996\u9875", icon: "home", target: "index", active: (slug2) => slug2 === "index" },
  {
    label: "\u77E5\u8BC6\u5E93",
    icon: "library",
    target: "library",
    active: (slug2) => slug2 === "library" || /^(sources|entities|concepts|syntheses)(\/|$)/.test(slug2)
  },
  {
    label: "\u77E5\u8BC6\u95EE\u7B54",
    icon: "chat",
    target: "chats",
    active: (slug2) => slug2 === "chats" || slug2.startsWith("chats/")
  },
  {
    label: "\u6587\u6863\u5165\u5E93",
    icon: "ingest",
    target: "ingest",
    active: (slug2) => slug2 === "ingest"
  },
  {
    label: "\u77E5\u8BC6\u56FE\u8C31",
    icon: "graph",
    target: "graph",
    openInNewTab: true,
    active: (slug2) => slug2 === "graph" || slug2.startsWith("graph/")
  },
  { label: "\u77E5\u8BC6\u8D28\u91CF", icon: "quality", target: "quality", active: (slug2) => slug2 === "quality" }
];
var managementItems = [
  { label: "\u7CFB\u7EDF\u8BBE\u7F6E", icon: "settings", target: "settings", active: (slug2) => slug2 === "settings" }
];
var AppNavigation_default = (() => {
  const AppNavigation = (props) => {
    const currentSlug = String(props.fileData.slug ?? "index");
    const objects = getKnowledgeObjects(props.allFiles);
    const currentObject = objects.find((object) => object.slug === currentSlug);
    const areaLabel = getAreaLabel(currentSlug);
    const pageTitle = currentObject?.title ?? (typeof props.fileData.frontmatter?.title === "string" ? props.fileData.frontmatter.title : areaLabel);
    const homeHref = resolveRelative(currentSlug, "index");
    const chatsHref = resolveRelative(currentSlug, "chats");
    const graphHref = resolveRelative(currentSlug, "graph");
    const objectCount = objects.length;
    return /* @__PURE__ */ u2("div", { class: "app-navigation", children: [
      /* @__PURE__ */ u2("a", { class: "app-skip-link", href: "#main-content", children: "\u8DF3\u5230\u4E3B\u8981\u5185\u5BB9" }),
      /* @__PURE__ */ u2("header", { class: "app-topbar", "data-app-topbar": true, children: [
        /* @__PURE__ */ u2("div", { class: "app-breadcrumb", "aria-label": "\u5F53\u524D\u4F4D\u7F6E", children: [
          /* @__PURE__ */ u2("strong", { children: areaLabel }),
          pageTitle !== areaLabel && /* @__PURE__ */ u2("span", { "aria-hidden": "true", children: "/" }),
          pageTitle !== areaLabel && /* @__PURE__ */ u2("span", { title: pageTitle, children: pageTitle })
        ] }),
        currentObject && /* @__PURE__ */ u2("div", { class: "app-page-actions", "aria-label": "\u5F53\u524D\u77E5\u8BC6\u9875\u9762\u64CD\u4F5C", children: [
          /* @__PURE__ */ u2("a", { href: chatsHref, children: "\u77E5\u8BC6\u95EE\u7B54" }),
          /* @__PURE__ */ u2("button", { type: "button", "data-copy-page-link": true, children: "\u590D\u5236\u94FE\u63A5" }),
          /* @__PURE__ */ u2("a", { href: graphHref, children: "\u67E5\u770B\u56FE\u8C31" })
        ] }),
        /* @__PURE__ */ u2("button", { type: "button", class: "app-topbar-search", "data-app-search": true, children: [
          /* @__PURE__ */ u2("span", { children: "\u5168\u5C40\u641C\u7D22" }),
          /* @__PURE__ */ u2("kbd", { children: "Ctrl K" })
        ] })
      ] }),
      /* @__PURE__ */ u2("a", { class: "app-brand", href: homeHref, "aria-label": "\u4E2D\u538B\u5E02\u573A\u90E8\u77E5\u8BC6\u5E93\u9996\u9875", children: [
        /* @__PURE__ */ u2("span", { class: "app-brand-mark", "aria-hidden": "true", children: "MKT" }),
        /* @__PURE__ */ u2("span", { class: "app-brand-copy", children: [
          /* @__PURE__ */ u2("strong", { children: "\u4E2D\u538B\u5E02\u573A\u90E8\u77E5\u8BC6\u5E93" }),
          /* @__PURE__ */ u2("small", { children: "MKT / TECHNICAL ARCHIVE" })
        ] })
      ] }),
      /* @__PURE__ */ u2("p", { class: "app-navigation-label", children: "\u4E3B\u8981\u529F\u80FD" }),
      /* @__PURE__ */ u2("nav", { class: "app-navigation-items", "aria-label": "\u4EA7\u54C1\u4E3B\u5BFC\u822A", children: navigationItems.map((item) => {
        const active = item.active(currentSlug);
        const href = resolveRelative(currentSlug, item.target);
        return /* @__PURE__ */ u2(
          "a",
          {
            class: `app-navigation-item${active ? " is-active" : ""}`,
            href,
            target: item.openInNewTab ? "_blank" : void 0,
            rel: item.openInNewTab ? "noopener noreferrer" : void 0,
            "data-router-ignore": item.openInNewTab ? "" : void 0,
            "aria-current": active ? "page" : void 0,
            children: [
              /* @__PURE__ */ u2("span", { class: "app-navigation-icon", children: /* @__PURE__ */ u2(NavigationIcon, { name: item.icon }) }),
              /* @__PURE__ */ u2("span", { children: item.label })
            ]
          }
        );
      }) }),
      /* @__PURE__ */ u2("div", { class: "app-sidebar-footer", children: [
        /* @__PURE__ */ u2("div", { class: "app-management", children: [
          /* @__PURE__ */ u2("p", { class: "app-navigation-label", children: "\u7BA1\u7406" }),
          /* @__PURE__ */ u2("nav", { class: "app-navigation-items", "aria-label": "\u7CFB\u7EDF\u7BA1\u7406", children: managementItems.map((item) => {
            const active = item.active(currentSlug);
            const href = resolveRelative(currentSlug, item.target);
            return /* @__PURE__ */ u2("a", { class: `app-navigation-item${active ? " is-active" : ""}`, href, "aria-current": active ? "page" : void 0, children: [
              /* @__PURE__ */ u2("span", { class: "app-navigation-icon", children: /* @__PURE__ */ u2(NavigationIcon, { name: item.icon }) }),
              /* @__PURE__ */ u2("span", { children: item.label })
            ] });
          }) })
        ] }),
        /* @__PURE__ */ u2("div", { class: "app-index-status", "aria-live": "polite", children: [
          /* @__PURE__ */ u2("span", { class: "app-index-status-title", "data-platform-health-card": true, children: "\u7CFB\u7EDF\u68C0\u67E5\u4E2D" }),
          /* @__PURE__ */ u2("strong", { children: [
            objectCount.toLocaleString("zh-CN"),
            " \u4E2A\u77E5\u8BC6\u5BF9\u8C61"
          ] }),
          /* @__PURE__ */ u2("small", { "data-platform-health-detail": true, children: "\u6B63\u5728\u8FDE\u63A5\u540E\u7AEF\u5065\u5EB7\u68C0\u67E5" })
        ] })
      ] })
    ] });
  };
  AppNavigation.afterDOMLoaded = navigationScript;
  return AppNavigation;
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
  const QualityPage = (props) => {
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
  return QualityPage;
});

export { AppNavigation_default as AppNavigation, QualityPage_default as QualityPage };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map