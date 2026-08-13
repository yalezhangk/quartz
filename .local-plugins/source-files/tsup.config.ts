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
    "@quartz-community/types",
    "@quartz-community/types/*",
    "@jackyzha0/quartz",
    "@jackyzha0/quartz/*",
  ],
  outDir: "dist",
  platform: "node",
}
