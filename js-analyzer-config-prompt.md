# JS Analyzer 项目配置生成提示词

请扫描我指定的真实前端项目目录，读取其 `package.json`、`tsconfig.json` 或 `jsconfig.json`、构建配置文件、`.gitignore`，并结合实际源码文件后缀，生成可直接添加到 JS Analyzer 的项目配置。请自动推断项目名称、项目根目录、应忽略的目录、源码扩展名、路径别名和 IDE；路径别名优先从 `compilerOptions.paths`、构建工具配置及源码 import 语句中推断，统一转换为 JS Analyzer 需要的格式。

只返回下面结构的合法 JSON，不要添加 Markdown 代码块、解释文字或其他字段：

{
  "name": "项目名称",
  "root": "项目绝对路径",
  "ignore": [
    "需要忽略的目录匹配规则"
  ],
  "extensions": [
    "实际使用的源码扩展名"
  ],
  "alias": {
    "别名/": "对应目录绝对或项目根相对路径/"
  },
  "ide": "cursor"
}

其中：

- `name` 使用 `package.json` 的 `name`，没有时使用项目目录名。
- `root` 必须是绝对路径。
- `ignore` 至少包含依赖目录和构建产物目录。
- `extensions` 只保留项目中实际存在且 JS Analyzer 支持的扩展名。
- `alias` 的键和值都必须以 `/` 结尾；如果没有可靠的路径别名则返回空对象。
- `ide` 默认为 `"cursor"`。
