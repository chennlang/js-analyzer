module.exports = {
  root: "/Users/alang/Desktop/code/work/deepexi-datafacts-web/apps/copilot",
  extensions: [".js", ".ts", ".tsx", ".vue", ".json", ".jsx"],
  ignore: ["**/node_modules/**", "**/dist/**", "**/static/**"],
  server: {
    port: 8088,
  },
  alias: {
    "@@/": "/src/.umi/",
    "@/": "/src/",
    "~/": "/src/",
  },
  plugins: [],
  ide: "cursor"
};
