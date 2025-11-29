module.exports = {
  root: "/Users/ll/Desktop/work/deepexi/textin-open-demo",
  extensions: [".js", ".ts", ".tsx", ".vue", ".json", ".jsx"],
  ignore: ["**/node_modules/**", "**/dist/**", "**/static/**"],
  server: {
    port: 8088,
  },
  alias: {
    "@@/": "/src/.umi/",
    "@/": "/src/",
  },
  plugins: [],
  ide: "cursor"
};
