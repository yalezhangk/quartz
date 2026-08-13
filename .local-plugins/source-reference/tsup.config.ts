export default {
  entry: {
    index: "src/index.ts",
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
    "@quartz-community/types",
    "@quartz-community/types/*",
    "@jackyzha0/quartz",
    "@jackyzha0/quartz/*",
  ],
  outDir: "dist",
  platform: "node",
  esbuildOptions(options: { jsx?: string; jsxImportSource?: string }) {
    options.jsx = "automatic"
    options.jsxImportSource = "preact"
  },
}
