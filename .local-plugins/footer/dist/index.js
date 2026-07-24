// node_modules/preact/dist/preact.mjs
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

// src/index.tsx
var style = `
footer {
  text-align: left;
  margin-bottom: 4rem;
  opacity: 0.7;
}
`;
var Footer = (() => {
  const FooterComponent = ({ displayClass }) => /* @__PURE__ */ u2("footer", { class: displayClass ?? "", children: /* @__PURE__ */ u2("p", { children: [
    "Created with",
    " ",
    /* @__PURE__ */ u2("a", { href: "https://github.com/yalezhangk/quartz", children: "MKT Digital Team" }),
    " \xA9 2026"
  ] }) });
  FooterComponent.css = style;
  return FooterComponent;
});
var src_default = Footer;

export { Footer, src_default as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map