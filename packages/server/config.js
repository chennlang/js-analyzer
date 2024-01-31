module.exports = {
  //   root: "/Users/ll/Desktop/work/deepexi/fastdataforflink_frontend",
  root: "/Users/ll/Desktop/work/deepexi/dxp-cdp-data-ui",
  // root: '/Users/ll/Desktop/work/deepexi/dxp-cdp-data-ui/packages/page-components/scene-module/daw-scene-detail.vue',
  extensions: [".js", ".ts", ".tsx", ".vue", ".json", ".jsx"],
  ignore: ["**/node_modules/**", "**/dist/**", "**/static/**"],
  server: {
    port: 8088,
  },
  alias: {
    "@@/": "/",
    "~~/": "/",
    "@/": "/examples/",
    "~/": "/examples/",
    "@p/": "/packages/",
    "~@p/": "/packages/",
  },
  plugins: [],
};
