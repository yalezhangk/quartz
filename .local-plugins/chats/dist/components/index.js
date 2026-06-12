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

// src/components/styles/chat.scss
var chat_default = '.page:has(.chat-shell) {\n  max-width: none;\n  width: 100%;\n}\n\n.page:has(.chat-shell) > #quartz-body {\n  grid-template-columns: 320px minmax(0, 1fr);\n  grid-template-rows: auto minmax(0, 1fr) auto;\n  grid-template-areas: "grid-sidebar-left grid-header" "grid-sidebar-left grid-center" "grid-sidebar-left grid-footer";\n  column-gap: 1rem;\n}\n\n.page:has(.chat-shell) > #quartz-body > .sidebar.right {\n  display: none;\n}\n\n.page:has(.chat-shell) > #quartz-body > .center,\n.page:has(.chat-shell) > #quartz-body > footer {\n  max-width: 100%;\n  width: 100%;\n}\n\n.page:has(.chat-shell) .page-header {\n  display: none;\n}\n\n.chat-nav-link {\n  display: inline-block;\n  padding: 0 0.75rem;\n  font-size: 1.15rem;\n  font-weight: 700;\n  color: var(--dark);\n  text-decoration: none;\n}\n\n.chat-nav-link:hover {\n  color: var(--secondary);\n}\n\n.chat-shell {\n  display: grid;\n  grid-template-columns: 320px minmax(0, 1fr);\n  gap: 1.25rem;\n  width: 100%;\n  min-height: calc(100vh - 8rem);\n  max-width: none;\n  margin: 0;\n}\n\n.chat-page-sidebar {\n  width: 100%;\n  min-height: calc(100vh - 8rem);\n  padding: 1rem 0.9rem;\n  border: 1px solid rgba(20, 20, 20, 0.06);\n  border-radius: 24px;\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(245, 245, 245, 0.92));\n  box-shadow: 0 16px 40px rgba(30, 44, 60, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.8);\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n\n.chats-sidebar-top {\n  display: flex;\n  flex-direction: column;\n  gap: 0.9rem;\n}\n\n.chats-brand {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0.35rem 0.3rem;\n}\n\n.chats-brand-title {\n  font-family: var(--titleFont);\n  font-size: 1.65rem;\n  font-weight: 700;\n  letter-spacing: -0.03em;\n  color: #222;\n}\n\n.new-chat-button {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  width: 100%;\n  padding: 0.95rem 1rem;\n  background: linear-gradient(135deg, #fff7f8 0%, #ffffff 55%, #fff7ee 100%);\n  color: #202124;\n  border: 1px solid rgba(20, 20, 20, 0.08);\n  border-radius: 18px;\n  cursor: pointer;\n  font-family: inherit;\n  font-size: 1.15rem;\n  font-weight: 700;\n  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;\n  box-shadow: 0 8px 20px rgba(22, 31, 45, 0.06);\n}\n.new-chat-button:hover {\n  transform: translateY(-1px);\n  border-color: rgba(40, 75, 99, 0.2);\n  box-shadow: 0 12px 24px rgba(22, 31, 45, 0.1);\n}\n.new-chat-button svg {\n  flex-shrink: 0;\n  width: 18px;\n  height: 18px;\n  padding: 0.35rem;\n  border-radius: 999px;\n  color: #fff;\n  background: linear-gradient(135deg, #ff6a88 0%, #ff9a52 100%);\n  box-sizing: content-box;\n}\n\n.chats-history-panel {\n  flex: 1;\n  min-height: 0;\n  display: flex;\n  flex-direction: column;\n  border: 1px solid rgba(20, 20, 20, 0.08);\n  border-radius: 20px;\n  background: rgba(255, 255, 255, 0.78);\n  overflow: hidden;\n}\n\n.chats-header {\n  padding: 0.8rem 0.9rem 0.5rem;\n}\n.chats-header h2 {\n  margin: 0;\n  font-size: 1rem;\n  font-weight: 600;\n  color: rgba(34, 34, 34, 0.86);\n}\n\n.chats-history {\n  flex: 1;\n  min-height: 0;\n  overflow-y: auto;\n  padding: 0.35rem 0.45rem 0.6rem;\n}\n\n.chats-empty-state {\n  padding: 1.2rem 0.8rem;\n  text-align: center;\n  color: var(--gray);\n  font-size: 0.9rem;\n  font-style: italic;\n}\n\n.chat-history-item {\n  display: block;\n  padding: 0.8rem 0.72rem;\n  margin: 0.18rem 0;\n  border-radius: 14px;\n  cursor: pointer;\n  text-decoration: none;\n  color: var(--darkgray);\n  transition: background 0.15s ease, transform 0.15s ease;\n  overflow: hidden;\n}\n.chat-history-item:hover {\n  background: rgba(40, 75, 99, 0.08);\n  transform: translateX(1px);\n}\n.chat-history-item.active {\n  background: linear-gradient(135deg, rgba(40, 75, 99, 0.12), rgba(132, 165, 157, 0.1));\n  color: var(--dark);\n}\n\n.chat-item-title {\n  font-size: 0.95rem;\n  font-weight: 500;\n  color: var(--dark);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.chat-item-preview {\n  margin-top: 0.28rem;\n  font-size: 0.8rem;\n  color: var(--gray);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.chat-page {\n  min-width: 0;\n  min-height: calc(100vh - 8rem);\n  padding: 0.35rem 0 1rem;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  gap: 1.25rem;\n  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.9), rgba(250, 248, 248, 0.72) 34%, rgba(250, 248, 248, 0) 60%);\n}\n\n.chat-stage {\n  flex: 1;\n  min-height: 0;\n  display: flex;\n  flex-direction: column;\n}\n\n.chat-hero {\n  padding: 10vh 1rem 1.25rem;\n  text-align: center;\n}\n\n.chat-hero-title {\n  margin: 0;\n  font-family: var(--titleFont);\n  font-size: clamp(2.5rem, 4vw, 4.25rem);\n  line-height: 1.05;\n  letter-spacing: -0.05em;\n  color: #202124;\n}\n\n.chat-hero-subtitle {\n  margin: 1rem auto 0;\n  max-width: 44rem;\n  font-size: 1rem;\n  color: rgba(43, 43, 43, 0.62);\n}\n\n.chat-page.has-messages .chat-hero {\n  display: none;\n}\n\n.chat-messages {\n  flex: 1;\n  min-height: 0;\n  overflow-y: auto;\n  padding: 0 0.35rem;\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n\n.chat-page:not(.has-messages) .chat-messages {\n  justify-content: center;\n}\n\n.message-greeting {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex: 1;\n  text-align: center;\n  color: var(--gray);\n}\n.message-greeting .greeting-content h2 {\n  margin: 0 0 0.55rem;\n  font-size: 1.3rem;\n  color: rgba(43, 43, 43, 0.82);\n}\n.message-greeting .greeting-content p {\n  margin: 0;\n  font-size: 0.95rem;\n}\n\n.message {\n  max-width: min(88%, 72rem);\n  padding: 1rem 1.1rem;\n  border-radius: 22px;\n  line-height: 1.7;\n  word-wrap: break-word;\n  animation: message-fade-in 0.22s ease;\n  box-shadow: 0 10px 30px rgba(34, 34, 34, 0.05);\n}\n\n@keyframes message-fade-in {\n  from {\n    opacity: 0;\n    transform: translateY(4px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.message-user {\n  align-self: flex-end;\n  background: linear-gradient(135deg, #284b63 0%, #355f7b 100%);\n  color: #faf8f8;\n  border-bottom-right-radius: 8px;\n}\n\n.message-assistant {\n  align-self: flex-start;\n  background: rgba(255, 255, 255, 0.92);\n  color: var(--dark);\n  border: 1px solid rgba(20, 20, 20, 0.07);\n  border-bottom-left-radius: 8px;\n  display: flex;\n  gap: 0.85rem;\n  align-items: flex-start;\n}\n\n.message-body {\n  min-width: 0;\n}\n\n.message-avatar {\n  flex-shrink: 0;\n  width: 30px;\n  height: 30px;\n  border-radius: 12px;\n  background: linear-gradient(135deg, rgba(40, 75, 99, 0.12), rgba(132, 165, 157, 0.22));\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: var(--secondary);\n  margin-top: 0.1rem;\n}\n\n.message-content {\n  min-width: 0;\n}\n.message-content p,\n.message-content ul,\n.message-content li,\n.message-content h1,\n.message-content h2,\n.message-content h3,\n.message-content h4,\n.message-content h5,\n.message-content h6 {\n  margin-top: 0;\n  color: inherit;\n}\n.message-content p,\n.message-content ul {\n  margin-bottom: 0.95rem;\n}\n.message-content h1,\n.message-content h2,\n.message-content h3,\n.message-content h4,\n.message-content h5,\n.message-content h6 {\n  margin-bottom: 0.8rem;\n  line-height: 1.3;\n  color: #1f2933;\n}\n.message-content h1 {\n  font-size: 1.5rem;\n}\n.message-content h2 {\n  font-size: 1.28rem;\n}\n.message-content h3 {\n  font-size: 1.12rem;\n}\n.message-content ul {\n  padding-left: 1.35rem;\n}\n.message-content li + li {\n  margin-top: 0.45rem;\n}\n.message-content code {\n  padding: 0.14rem 0.35rem;\n  border-radius: 6px;\n  background: rgba(40, 75, 99, 0.08);\n  font-family: var(--codeFont);\n  font-size: 0.92em;\n}\n.message-content a {\n  color: var(--secondary);\n  text-decoration: none;\n}\n.message-content .chat-wikilink {\n  display: inline-block;\n  padding: 0.04rem 0.32rem;\n  border-radius: 999px;\n  background: rgba(40, 75, 99, 0.08);\n  color: var(--secondary);\n  font-size: 0.95em;\n}\n\n.message-loading {\n  display: none;\n  color: var(--gray);\n  font-size: 0.8rem;\n  font-style: italic;\n  animation: loading-pulse 1.5s ease-in-out infinite;\n}\n\n.message-sources {\n  display: none;\n  margin-top: 1rem;\n  padding-top: 0.85rem;\n  border-top: 1px solid rgba(20, 20, 20, 0.08);\n}\n\n.message-actions {\n  display: flex;\n  justify-content: flex-end;\n  margin-top: 0.7rem;\n}\n\n.message-copy-button {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 2.25rem;\n  height: 2.25rem;\n  border: 1px solid rgba(20, 20, 20, 0.08);\n  border-radius: 12px;\n  background: rgba(255, 255, 255, 0.95);\n  color: rgba(43, 43, 43, 0.68);\n  cursor: pointer;\n  transition: transform 0.15s ease, color 0.15s ease, background 0.15s ease, border-color 0.15s ease;\n}\n.message-copy-button:hover {\n  transform: translateY(-1px);\n  color: var(--secondary);\n  border-color: rgba(40, 75, 99, 0.18);\n  background: rgba(40, 75, 99, 0.05);\n}\n.message-copy-button.copied {\n  color: #1f7a4d;\n  border-color: rgba(31, 122, 77, 0.22);\n  background: rgba(31, 122, 77, 0.08);\n}\n.message-copy-button.copy-failed {\n  color: #b54747;\n  border-color: rgba(181, 71, 71, 0.22);\n  background: rgba(181, 71, 71, 0.08);\n}\n\n.message-sources-title {\n  margin-bottom: 0.55rem;\n  font-size: 0.82rem;\n  font-weight: 700;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: rgba(43, 43, 43, 0.58);\n}\n\n.message-sources-list {\n  margin: 0;\n  padding-left: 1.1rem;\n}\n\n.message-source-item {\n  color: rgba(43, 43, 43, 0.82);\n}\n\n.message-source-item + .message-source-item {\n  margin-top: 0.35rem;\n}\n\n@keyframes loading-pulse {\n  0%, 100% {\n    opacity: 0.4;\n  }\n  50% {\n    opacity: 1;\n  }\n}\n.chat-input-wrap {\n  padding: 0 0.45rem 0.35rem;\n}\n\n.chat-input-card {\n  max-width: none;\n  margin: 0 auto;\n  padding: 1rem 1.2rem 1.05rem;\n  border-radius: 28px;\n  background: rgba(255, 255, 255, 0.94);\n  border: 1px solid rgba(20, 20, 20, 0.08);\n  box-shadow: 0 24px 60px rgba(33, 44, 62, 0.12), 0 4px 10px rgba(33, 44, 62, 0.04);\n}\n\n.chat-input-label {\n  display: block;\n  margin-bottom: 0.65rem;\n  font-size: 0.95rem;\n  color: rgba(43, 43, 43, 0.58);\n}\n\n.chat-input-area {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;\n  gap: 0.6rem;\n  align-items: end;\n}\n\n.chat-attach-button,\n.chat-send-button {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 3rem;\n  height: 3rem;\n  border-radius: 18px;\n  border: 1px solid rgba(20, 20, 20, 0.08);\n  background: #fff;\n  color: rgba(32, 33, 36, 0.72);\n  transition: transform 0.15s ease, background 0.15s ease, opacity 0.15s ease;\n  flex-shrink: 0;\n  padding: 0;\n}\n\n.chat-attach-button:disabled {\n  opacity: 0.75;\n  cursor: not-allowed;\n}\n\n.chat-input {\n  min-width: 0;\n  min-height: 3rem;\n  max-height: 220px;\n  padding: 0.78rem 0.25rem 0.45rem;\n  border: none;\n  background: transparent;\n  font-family: inherit;\n  font-size: 1.02rem;\n  color: var(--dark);\n  resize: none;\n  outline: none;\n  line-height: 1.6;\n}\n.chat-input::placeholder {\n  color: rgba(43, 43, 43, 0.42);\n}\n\n.chat-send-button {\n  cursor: pointer;\n  background: linear-gradient(135deg, #284b63 0%, #355f7b 100%);\n  color: #fff;\n  border: none;\n}\n.chat-send-button:hover:not(:disabled) {\n  transform: translateY(-1px);\n}\n.chat-send-button:disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n\n@media all and (max-width: 1100px) {\n  .page:has(.chat-shell) > #quartz-body {\n    grid-template-columns: 280px minmax(0, 1fr);\n  }\n  .chat-shell {\n    grid-template-columns: 280px minmax(0, 1fr);\n  }\n}\n@media all and (max-width: 900px) {\n  .page:has(.chat-shell) > #quartz-body {\n    grid-template-columns: 1fr;\n    grid-template-areas: "grid-sidebar-left" "grid-center" "grid-footer";\n  }\n  .chat-shell {\n    grid-template-columns: 1fr;\n  }\n  .chat-page-sidebar {\n    min-height: auto;\n  }\n  .chat-page {\n    min-height: calc(100vh - 6rem);\n  }\n  .chat-hero {\n    padding-top: 3rem;\n  }\n  .message {\n    max-width: 92%;\n  }\n}\n@media all and (max-width: 600px) {\n  .chat-page-sidebar {\n    padding: 0.8rem;\n    border-radius: 20px;\n  }\n  .chat-page {\n    padding: 0.25rem 0 0.75rem;\n  }\n  .chat-input-card {\n    padding: 0.85rem 0.95rem 0.95rem;\n    border-radius: 22px;\n  }\n  .chat-input-area {\n    grid-template-columns: 1fr auto;\n  }\n  .chat-attach-button {\n    display: none;\n  }\n}';

// src/components/Chats.tsx
var defaultOptions = {
  title: "Chats"
};
var Chats_default = ((userOpts) => {
  const opts = { ...defaultOptions, ...userOpts };
  const ChatsSidebar = (props) => {
    const displayClass = props.displayClass;
    const chatsHref = resolveRelative(props.fileData.slug, "chats");
    return /* @__PURE__ */ u2("div", { class: displayClass, children: /* @__PURE__ */ u2("a", { class: "chat-nav-link", href: chatsHref, "aria-label": opts.title, children: opts.title }) });
  };
  ChatsSidebar.css = chat_default;
  return ChatsSidebar;
});

// src/i18n/index.ts
var localeStrings = {
  "en-US": {
    title: "Chats",
    newChat: "New Chat",
    placeholder: "Type a message...",
    send: "Send",
    loading: "AI is thinking...",
    emptyHistory: "No conversations yet",
    newChatGreeting: "Start a new conversation!"
  },
  "zh-CN": {
    title: "\u804A\u5929",
    newChat: "\u65B0\u5BF9\u8BDD",
    placeholder: "\u8F93\u5165\u6D88\u606F...",
    send: "\u53D1\u9001",
    loading: "AI \u6B63\u5728\u601D\u8003...",
    emptyHistory: "\u6682\u65E0\u804A\u5929\u8BB0\u5F55",
    newChatGreeting: "\u5F00\u59CB\u4E00\u6BB5\u65B0\u5BF9\u8BDD\uFF01"
  }
};
function i18n(locale) {
  return localeStrings[locale] ?? localeStrings["en-US"];
}

// src/components/scripts/chat.inline.ts
var chat_inline_default = 'var j="chats:conversations",$="chats:current",L="chats:intent",E=null;function G(e){return{proxyUrl:e.getAttribute("data-proxy-url")||"/api"}}function X(e){let t=sessionStorage.getItem(L);if(!t)return null;e&&sessionStorage.removeItem(L);try{return JSON.parse(t)}catch{return t}}function R(e){let t=e.getAttribute("data-chats-path")||"/chats/";return new URL(t,window.location.href)}function A(){return sessionStorage.getItem($)}function v(e){e?sessionStorage.setItem($,e):sessionStorage.removeItem($)}function C(){let e=localStorage.getItem(j);if(!e)return[];try{let t=JSON.parse(e);return Array.isArray(t)?t.filter(n=>n&&typeof n.id=="string"&&Array.isArray(n.messages)):[]}catch{return[]}}function Z(e){localStorage.setItem(j,JSON.stringify(e))}function U(e){return C().find(t=>t.id===e)??null}function B(e){let n=C().filter(s=>s.id!==e.id);n.unshift(e),Z(n)}function h(e){return e.trim().toLowerCase()}async function ee(){return E||(E=(async()=>{try{let e=await fetch("/static/contentIndex.json");return e.ok?e.json():null}catch{return null}})(),E)}async function te(e){let t=e.trim().replace(/^\\/+|\\/+$/g,"");if(!t)return"#";let n=h(t),s=await ee();if(s)for(let[r,o]of Object.entries(s)){let a=r.split("/").pop()||r,i=typeof o?.title=="string"?o.title:"",c=(typeof o?.filePath=="string"?o.filePath:"").split("/").pop()?.replace(/\\.md$/i,"")||"";if([h(r),h(a),h(i),h(c)].includes(n))return`/${r.split("/").map(d=>encodeURIComponent(d)).join("/")}`}return`/${t.split("/").map(r=>encodeURIComponent(r)).join("/")}`}function S(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\'/g,"&#39;")}function M(e){let t=S(e);return t=t.replace(/`([^`]+)`/g,"<code>$1</code>"),t=t.replace(/\\*\\*([^*]+)\\*\\*/g,"<strong>$1</strong>"),t=t.replace(/\\*([^*]+)\\*/g,"<em>$1</em>"),t=t.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g,\'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>\'),t=t.replace(/\\[\\[([^|\\]]+)\\|([^\\]]+)\\]\\]/g,(n,s,r)=>`<a class="chat-wikilink unresolved" data-wiki-target="${S(s)}" href="#">${r}</a>`),t=t.replace(/\\[\\[([^\\]]+)\\]\\]/g,(n,s)=>`<a class="chat-wikilink unresolved" data-wiki-target="${S(s)}" href="#">${s}</a>`),t}function D(e){let t=e.replace(/\\r\\n/g,`\n`).split(`\n`),n=[],s=[],r=[],o=()=>{s.length!==0&&(n.push(`<p>${M(s.join(" "))}</p>`),s=[])},a=()=>{r.length!==0&&(n.push(`<ul>${r.map(i=>`<li>${M(i)}</li>`).join("")}</ul>`),r=[])};for(let i of t){let l=i.trim();if(l.length===0){o(),a();continue}let c=l.match(/^(#{1,6})\\s+(.*)$/);if(c){o(),a();let d=c[1].length;n.push(`<h${d}>${M(c[2])}</h${d}>`);continue}let u=l.match(/^[-*]\\s+(.*)$/);if(u){o(),r.push(u[1]);continue}a(),s.push(l)}return o(),a(),n.join("")}function ne(e){return e.replace(/\\r\\n/g,`\n`).replace(/^#{1,6}\\s+/gm,"").replace(/^[-*]\\s+/gm,"").replace(/\\[\\[([^|\\]]+)\\|([^\\]]+)\\]\\]/g,"$2").replace(/\\[\\[([^\\]]+)\\]\\]/g,"$1").replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g,"$1").replace(/`([^`]+)`/g,"$1").replace(/\\*\\*([^*]+)\\*\\*/g,"$1").replace(/\\*([^*]+)\\*/g,"$1").replace(/\\n+/g," ").trim()}function se(){if(typeof crypto<"u"){if(typeof crypto.randomUUID=="function")return crypto.randomUUID();if(typeof crypto.getRandomValues=="function"){let e=crypto.getRandomValues(new Uint8Array(16));e[6]=e[6]&15|64,e[8]=e[8]&63|128;let t=Array.from(e,n=>n.toString(16).padStart(2,"0"));return`${t.slice(0,4).join("")}-${t.slice(4,6).join("")}-${t.slice(6,8).join("")}-${t.slice(8,10).join("")}-${t.slice(10,16).join("")}`}}return`chat-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function re(e){let t=e.trim().slice(0,36)||"New Chat",n=new Date().toISOString();return{id:se(),title:t,lastMessage:"",updatedAt:n,messageCount:0,messages:[]}}function N(e,t){e.messages.push(t),e.messageCount=e.messages.length,e.lastMessage=ne(t.content),e.updatedAt=new Date(t.timestamp).toISOString()}function oe(e){let t=e.replace(/\\/+$/,"");return t.endsWith("/api/query")?t:t.endsWith("/api")?`${t}/query`:`${t}/api/query`}async function ae(e,t){let n=await fetch(oe(e),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:t})});if(!n.ok){let s=await n.text().catch(()=>"");throw new Error(`API ${n.status}: ${s.substring(0,200)}`)}return n.json()}function ie(e){return(e.answer||"").trim()||"No answer returned."}function ce(e){return Array.isArray(e.sources)?e.sources.filter(Boolean).map(t=>t.trim()).filter(Boolean):[]}function O(e,t){let n=e.trim(),s=Array.isArray(t)?t.filter(Boolean).map(r=>r.trim()).filter(Boolean):[];return s.length===0?n:`${n}\n\n## Sources\n\n- ${s.join(`\n- `)}`}function _(e,t){if(!e)return;if(!t||t.length===0){e.innerHTML="",e.style.display="none";return}let n=t.map(s=>`<li class="message-source-item">${M(s)}</li>`).join("");e.innerHTML=`\n    <div class="message-sources-title">Sources</div>\n    <ul class="message-sources-list">${n}</ul>\n  `,e.style.display="block"}function k(e){for(;e.firstChild;)e.removeChild(e.firstChild)}async function F(e){let t=Array.from(e.querySelectorAll(".chat-wikilink.unresolved"));await Promise.all(t.map(async n=>{let s=n.dataset.wikiTarget;s&&(n.href=await te(s),n.classList.remove("unresolved"))}))}function K(e,t){e&&(e.dataset.copyMarkdown=t,e.onclick=async()=>{let n=e.dataset.copyMarkdown||"";try{await navigator.clipboard.writeText(n),e.classList.add("copied"),window.setTimeout(()=>e.classList.remove("copied"),1200)}catch{e.classList.add("copy-failed"),window.setTimeout(()=>e.classList.remove("copy-failed"),1200)}})}function q(e,t){let n=e.closest(".chat-page");n&&(t?n.classList.add("has-messages"):n.classList.remove("has-messages"))}function z(e,t,n,s){if(k(t),n.length===0){let o=document.createElement("div");o.className="chats-empty-state",o.textContent="No conversations yet",t.appendChild(o);return}let r=document.getElementById("template-chat-item");if(r)for(let o of n){let a=r.content.cloneNode(!0),i=a.querySelector(".chat-history-item"),l=a.querySelector(".chat-item-title"),c=a.querySelector(".chat-item-preview");i&&(i.href="#",i.setAttribute("data-chat-id",o.id),o.id===s&&i.classList.add("active"),i.addEventListener("click",u=>{u.preventDefault(),v(o.id),sessionStorage.setItem(L,JSON.stringify({mode:"chat",id:o.id})),window.spaNavigate(R(e))})),l&&(l.textContent=o.title||"Untitled"),c&&(c.textContent=o.lastMessage||""),t.appendChild(a)}}function le(e){k(e),q(e,!1);let t=document.createElement("div");t.className="message-greeting",t.innerHTML=`\n    <div class="greeting-content">\n      <h2>AI Chat</h2>\n      <p>Start a conversation by typing a message below.</p>\n    </div>\n  `,e.appendChild(t)}function ue(e,t){k(e),q(e,t.length>0);let n=document.getElementById("template-message-user"),s=document.getElementById("template-message-assistant");for(let r of t){if(r.role==="user"){if(!n)continue;let u=n.content.cloneNode(!0),d=u.querySelector(".message-content");d&&(d.textContent=r.content),e.appendChild(u);continue}if(!s)continue;let o=s.content.cloneNode(!0),a=o.querySelector(".message-content"),i=o.querySelector(".message-sources"),l=o.querySelector(".message-copy-button"),c=o.querySelector(".message-loading");a&&(a.innerHTML=D(r.content)),_(i,r.sources),K(l,O(r.content,r.sources)),c&&(c.style.display="none"),e.appendChild(o),F(e)}}function de(e,t){q(e,!0);let n=document.getElementById("template-message-user");if(!n)return;let s=n.content.cloneNode(!0),r=s.querySelector(".message-content");r&&(r.textContent=t),e.appendChild(s)}function me(e){let t=document.getElementById("template-message-assistant");if(!t){let i=document.createElement("div");return i.className="message message-assistant",e.appendChild(i),{contentEl:i,sourcesEl:i,copyButton:i,loadingEl:i}}let n=t.content.cloneNode(!0),s=n.querySelector(".message-content"),r=n.querySelector(".message-sources"),o=n.querySelector(".message-copy-button"),a=n.querySelector(".message-loading");return e.appendChild(n),{contentEl:s,sourcesEl:r,copyButton:o,loadingEl:a}}function H(e){requestAnimationFrame(()=>{e.scrollTop=e.scrollHeight})}function b(e,t){t.disabled=e.value.trim().length===0}function ge(e){e.style.height="auto",e.style.height=Math.min(e.scrollHeight,200)+"px"}function pe(){let e=X(!0);if(e){if(e==="new")return{type:"new"};if(e.mode==="chat"&&e.id)return{type:"chat",id:e.id}}let t=A();return t&&U(t)?{type:"chat",id:t}:{type:"new"}}var I=[];function T(e){I.push(e)}function fe(){I.forEach(e=>e()),I.length=0}function P(){let e=A(),t=C();for(let n of Array.from(document.querySelectorAll(".chats-sidebar"))){let s=n.querySelector(".chats-history");s&&z(n,s,t,e)}}async function he(e){let t=G(e),n=e.querySelector(".chat-messages"),s=e.querySelector(".chat-input"),r=e.querySelector(".chat-send-button");if(!n||!s||!r)return;let o=pe(),a=o.type==="chat"?U(o.id):null,i=!1;a?(v(a.id),ue(n,a.messages)):le(n),H(n);let l=()=>{b(s,r),ge(s)};s.addEventListener("input",l),T(()=>s.removeEventListener("input",l));let c=async()=>{let m=s.value.trim();if(!m||i)return;i=!0,r.disabled=!0,s.disabled=!0;let x=n.querySelector(".message-greeting");x&&x.remove(),a||(a=re(m),v(a.id));let J={role:"user",content:m,timestamp:Date.now()};N(a,J),B(a),P(),de(n,m),s.value="",s.style.height="auto",H(n);let{contentEl:y,sourcesEl:Q,copyButton:V,loadingEl:g}=me(n);g&&(g.style.display="block"),H(n);try{let p=await ae(t.proxyUrl,m),f=ie(p),w=ce(p);y&&(y.innerHTML=D(f)),_(Q,w),K(V,O(f,w)),F(n),g&&(g.style.display="none");let Y={role:"assistant",content:f,timestamp:Date.now(),sources:w};N(a,Y),B(a),P()}catch(p){let f=p instanceof Error?p.message:String(p);y&&(y.textContent=`Error: ${f}`),g&&(g.style.display="none")}finally{i=!1,s.disabled=!1,s.focus(),b(s,r)}},u=()=>c();r.addEventListener("click",u),T(()=>r.removeEventListener("click",u));let d=m=>{m.key==="Enter"&&!m.shiftKey&&(m.preventDefault(),c())};s.addEventListener("keydown",d),T(()=>s.removeEventListener("keydown",d))}async function ye(e){let t=e.querySelector(".chats-history"),n=e.querySelector("[data-new-chat]");if(!t||!n)return;z(e,t,C(),A());let s=r=>{r.preventDefault(),v(null),sessionStorage.setItem(L,"new"),window.spaNavigate(R(e))};n.addEventListener("click",s),T(()=>n.removeEventListener("click",s))}async function W(){fe();let e=document.querySelectorAll(".chats-sidebar");for(let n of Array.from(e))await ye(n);let t=document.querySelectorAll(".chat-page");for(let n of Array.from(t))await he(n)}document.addEventListener("nav",W);document.addEventListener("render",W);\n';

// src/components/ChatPage.tsx
var defaultOptions2 = {
  // NOTE: 当前后端地址是直接写死到本地开发地址的。
  // 后续若接入正式 wiki-backend、反向代理或多环境配置，优先把它改成可配置项，
  // 不要继续依赖这里的硬编码默认值。
  proxyUrl: "/api"
};
var ChatPage_default = ((userOpts) => {
  const opts = { ...defaultOptions2, ...userOpts };
  const ChatPage = (props) => {
    const locale = props.cfg?.locale ?? "en-US";
    const strings = i18n(locale);
    const chatsHref = resolveRelative(props.fileData.slug, "chats");
    return /* @__PURE__ */ u2("div", { class: "chat-shell", "data-proxy-url": opts.proxyUrl, "data-chats-path": chatsHref, children: [
      /* @__PURE__ */ u2("aside", { class: "chats-sidebar chat-page-sidebar", "data-proxy-url": opts.proxyUrl, "data-chats-path": chatsHref, children: [
        /* @__PURE__ */ u2("div", { class: "chats-sidebar-top", children: [
          /* @__PURE__ */ u2("div", { class: "chats-brand", children: /* @__PURE__ */ u2("span", { class: "chats-brand-title", children: "MVC WIKI" }) }),
          /* @__PURE__ */ u2("button", { type: "button", class: "new-chat-button", "data-new-chat": true, "aria-label": strings.newChat, children: [
            /* @__PURE__ */ u2(
              "svg",
              {
                xmlns: "http://www.w3.org/2000/svg",
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                children: [
                  /* @__PURE__ */ u2("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
                  /* @__PURE__ */ u2("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
                ]
              }
            ),
            /* @__PURE__ */ u2("span", { children: strings.newChat })
          ] })
        ] }),
        /* @__PURE__ */ u2("div", { class: "chats-history-panel", children: [
          /* @__PURE__ */ u2("div", { class: "chats-header", children: /* @__PURE__ */ u2("h2", { children: strings.title }) }),
          /* @__PURE__ */ u2("div", { class: "chats-history", children: /* @__PURE__ */ u2("div", { class: "chats-empty-state", children: strings.emptyHistory }) })
        ] }),
        /* @__PURE__ */ u2("template", { id: "template-chat-item", children: /* @__PURE__ */ u2("a", { class: "chat-history-item", href: "#", "data-chat-id": "", children: [
          /* @__PURE__ */ u2("div", { class: "chat-item-title" }),
          /* @__PURE__ */ u2("div", { class: "chat-item-preview" })
        ] }) })
      ] }),
      /* @__PURE__ */ u2("div", { class: "chat-page", "data-proxy-url": opts.proxyUrl, children: [
        /* @__PURE__ */ u2("div", { class: "chat-stage", children: [
          /* @__PURE__ */ u2("div", { class: "chat-hero", children: [
            /* @__PURE__ */ u2("h1", { class: "chat-hero-title", children: "Welcome, how can I help?" }),
            /* @__PURE__ */ u2("p", { class: "chat-hero-subtitle", children: "Ask about your wiki knowledge base, sources, entities, and relationships." })
          ] }),
          /* @__PURE__ */ u2("div", { class: "chat-messages", id: "chat-messages" })
        ] }),
        /* @__PURE__ */ u2("div", { class: "chat-input-wrap", children: /* @__PURE__ */ u2("div", { class: "chat-input-card", children: [
          /* @__PURE__ */ u2("label", { class: "chat-input-label", for: "chat-input-box", children: "Message Wiki Copilot" }),
          /* @__PURE__ */ u2("div", { class: "chat-input-area", children: [
            /* @__PURE__ */ u2("button", { type: "button", class: "chat-attach-button", "aria-label": "Add attachment", disabled: true, children: /* @__PURE__ */ u2("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
              /* @__PURE__ */ u2("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
              /* @__PURE__ */ u2("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
            ] }) }),
            /* @__PURE__ */ u2(
              "textarea",
              {
                id: "chat-input-box",
                class: "chat-input",
                placeholder: strings.placeholder,
                rows: 1,
                "aria-label": strings.placeholder
              }
            ),
            /* @__PURE__ */ u2("button", { class: "chat-send-button", disabled: true, "aria-label": strings.send, children: /* @__PURE__ */ u2(
              "svg",
              {
                xmlns: "http://www.w3.org/2000/svg",
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                children: [
                  /* @__PURE__ */ u2("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
                  /* @__PURE__ */ u2("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
                ]
              }
            ) })
          ] })
        ] }) }),
        /* @__PURE__ */ u2("template", { id: "template-message-user", children: /* @__PURE__ */ u2("div", { class: "message message-user", children: /* @__PURE__ */ u2("div", { class: "message-content" }) }) }),
        /* @__PURE__ */ u2("template", { id: "template-message-assistant", children: /* @__PURE__ */ u2("div", { class: "message message-assistant", children: [
          /* @__PURE__ */ u2("div", { class: "message-avatar", children: /* @__PURE__ */ u2("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
            /* @__PURE__ */ u2("path", { d: "M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ u2("path", { d: "M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" }),
            /* @__PURE__ */ u2("path", { d: "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" }),
            /* @__PURE__ */ u2("path", { d: "M17 17a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4" })
          ] }) }),
          /* @__PURE__ */ u2("div", { class: "message-body", children: [
            /* @__PURE__ */ u2("div", { class: "message-content" }),
            /* @__PURE__ */ u2("div", { class: "message-sources" }),
            /* @__PURE__ */ u2("div", { class: "message-actions", children: /* @__PURE__ */ u2("button", { type: "button", class: "message-copy-button", "aria-label": "Copy answer", children: /* @__PURE__ */ u2("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.9", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
              /* @__PURE__ */ u2("rect", { x: "9", y: "9", width: "13", height: "13", rx: "3", ry: "3" }),
              /* @__PURE__ */ u2("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
            ] }) }) }),
            /* @__PURE__ */ u2("div", { class: "message-loading", children: strings.loading })
          ] })
        ] }) })
      ] })
    ] });
  };
  ChatPage.css = chat_default;
  ChatPage.afterDOMLoaded = chat_inline_default;
  return ChatPage;
});

export { ChatPage_default as ChatPage, Chats_default as Chats };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map