export default {
  entry: {
    index: "src/index.tsx",
    "components/index": "src/components/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  splitting: false,
  noExternal: [/.*/],
  external: [
    "preact",
    "preact/hooks",
    "preact/jsx-runtime",
    "preact/compat",
    "@jackyzha0/quartz",
    "@jackyzha0/quartz/*",
    "vfile",
    "vfile/*",
    "unified",
  ],
  outDir: "dist",
  platform: "node",
  esbuildOptions(options: { jsx?: string; jsxImportSource?: string }) {
    options.jsx = "automatic"
    options.jsxImportSource = "preact"
  },
}
