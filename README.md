<div align="center" style="text-align: center;">
    <h1 style="text-align: center;">🧬Js Analyzer</h1>
    <p style="text-align: center;">An interactive, visual front-end dependency analysis tool</p>
    <p style="text-align: center;">Applicable for any front-end project such as Vue, React, Svelte, Angular, Node</p>
    <p align='center'>
      <b>English</b>
      |
      <a href="https://github.com/chennlang/js-analyzer/blob/main/README_zh.md">简体中文</a>
      |
      <a href="https://github.com/chennlang/js-analyzer/blob/main/README_jp.md">日本語</a>
    </p>
</div>

https://github.com/chennlang/js-analyzer/assets/41711206/63797bfd-440c-401e-a0d8-833a9c8caef0

## Features

- Interactive, integrated `visual` dependency analysis system
- Supports dynamic switching of entry files
- Supports `Dependency Inversion`
- Displays the number of times a file is referenced, as well as the reference address
- Displays information on references to the exported variables of a file
- Suitable for ES6, CommonJS
- Supported file types: JS, TS, JSX, TSX, Vue, Sass, Less, Css, html
- Supports package dependency analysis
- Analyzes unimported files and npm packages
- Local storage, `Very secure`, does not involve networking and uploading

## 🤝 Contributors

Thank you to the following contributors for supporting this project! 🎉

- [@mannymu](https://github.com/mannymu)
- [@rxx-qingyi](https://github.com/rxx-qingyi)

_✨ Thank you for your contributions!_

## Global Installation (Recommended)

### 1. Installation

```shell
npm install @js-analyzer/server -g
# yarn add @js-analyzer/server -g
# pnpm install @js-analyzer/server -g
```

### 2. Start the service

Execute `js-analyzer` directly in the console. There is no need to enter a specific project directory, since the project is added and configured directly on the page.

```shell
js-analyzer
# Service started：http://localhost:8088/
```

Then visit http://localhost:8088/ to open the analysis page.

### 3. Manually add a project on the page

1. Click the gear icon (⚙️) in the upper right corner of the header to open the **"Project Management"** dialog.
2. Click **"Manually Add Project"**, and fill in the project configuration in the JSON editor on the right:
   - `name`: project name
   - `root`: absolute path of the project root directory (required)
   - `ignore`: directories that do not need to be analyzed, e.g. `["**/node_modules/**", "**/dist/**"]`
   - `extensions`: source file extensions actually used, e.g. `[".js", ".ts", ".tsx", ".vue", ".json", ".jsx"]`
   - `alias`: path alias mapping, e.g. `{ "@/": "/src/" }`
   - `ide`: the IDE used to open files, default is `"code"`
3. Click **"Save Config"**, and the service will automatically analyze the project and display the dependency information.
4. Multiple projects can be added, and you can switch the current project through the project dropdown in the header. Each project can also be refreshed or deleted in the **"Project Management"** dialog.

> 💡 You can also use [AI to generate the project configuration](#use-ai-to-generate-project-configuration), so you don't need to write the configuration manually.

> ⚠️ Local installation is no longer recommended. Since the project is now added and configured directly on the page, a single global installation is enough for all projects.

## Configuration File

You can quickly start an analysis service using the above commands. However, each project's overall architecture is different, so if you want "js-analyzer" to be better and more accurate, you need to configure some necessary information. (This is optional — the same configuration can also be done directly in the **"Project Management"** dialog on the page.)

To specify the configuration file, start the service with the `--config` option as follows

```shell
js-analyzer --config ./js-analyzer.js
```

js-analyzer.js

```js
module.exports = {
  // Root directory
  root: "./",
  // Directories that do not need to be analyzed
  ignore: ["**/node_modules/**", "**/dist/**"],
  // Order of preference when parsing files without extensions
  extensions: [".js", ".ts", ".tsx", ".vue", ".json", ".jsx"],
  // Path mapping of the project's alias
  alias: {
    "@@/": "/",
    "~~/": "/",
    "@/": "/src/",
    "~/": "/src/",
  },
  // Server and port related information
  server: {
    port: 8088,
    host: "localhost",
    openBrowser: true, // Automatically open in browser after startup
  },
};
```

## Use AI to Generate Project Configuration

When adding a new project, you can use the Chinese prompt in [js-analyzer-config-prompt.md](./js-analyzer-config-prompt.md) to generate the project configuration automatically.

1. Open the prompt file and copy its contents.
2. Paste the prompt into your AI assistant, then provide the absolute path of the project to analyze.
3. Copy the returned JSON into the project's configuration form or adapt it to `js-analyzer.js`.

The prompt asks the AI to inspect the project's package metadata, TypeScript or JavaScript configuration, build configuration, ignore rules, and source file extensions. It also requires the response to contain only the JSON configuration object.

## Updates

- Support for VUE SETUP type
- Customizable plugins, generate the data you want
- Support for built-in project hot-word plugins
- File dependency view: support for the dependency relationship view within a single folder
- Analysis of Sass, Less, Css, and other style files (New, Supported)
- Supports project variable hot-word map

## TODO

- Shared module for project component document generation
- Cycle dependency analysis
- Module stability indicator analysis

## Plugin Development

The principle of this tool is to parse AST collection of related dependency information, theoretically, users can also collect any information they want in this process. Therefore, a plugin approach is provided, exposing the lifecycle at various stages, allowing users to execute any logic in lifecycle functions.

### Example: A plugin that collects variable names used inside a project

```js
const myCustomPlugin = {
  name: "MyCustomPlugin",
  // Output information
  output: {
    data: [],
    file: "test.json",
  },
  // Run when parsing script
  ScriptParser({ file, content }) {
    const self = this;
    return {
      VariableDeclarator(tPath) {
        tPath.node.id && self.output.data.push(tPath.node.id.name);
      },
    };
  },
  // Run after parsing script
  AfterScriptParser() {},
};

module.exports = {
  plugins: [myCustomPlugin],
};
```

Custom data generation, default access address 'http://localhost:8087/data/test.json'

## Guides

### How to clean "Garbage files" in the project

What are "Garbage files"? These are files that are not referenced.

- Method one: In the "Relationship Map", in the directory tree on the left, there is a "reference count" at the end of each file, the number `0` indicates no reference.
- Method two: In the "Relationship Map", under the "Folder Relationship Map" view, you can see the "reference count" for each file, the number `0` indicates no reference.

![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175023.png)

### How to clean "unused exports" in the project

In the development project, there will be many exported but unused variables or methods in the `const` directory or `api` directory:

```ts
// const.ts | api.ts | utils.ts

export const STATUS = "status"; // Not used

export const TEXT = "text"; // Not used

export const api_fetch_data = () => {}; // Not used

export const api_fetch_result = () => {}; // Not used
```

We can view the export information in "File Details", find the "unused exports", and delete it. So how do we open "File Details"?

- Method one: Any node in the chart on the right side of the "Relationship Map" page corresponds to the file on the left. After clicking the node, the "File Details" will be displayed.
- Method two: If you have already selected the target file in the left directory, click the file details button in the upper right corner of the chart.

### Discover "Implicit References" in the project

What is an "Implicit Reference"? This refers to those third-party libraries that have not been registered in `package.json` or used in the project.

> Why this scenario would occur, for we installer an npm package `A` in the project, and `A` depends on libraries `a`,`b`. Then, in `node_modules` there would be three libraries `A`,`a`,`b`. Of course, we can use `a` or `b` directly in the project, but this is very risky!

We can find all such references in the "Implicit Reference" page, view the target file, and then register the library in use in `package.json`.

Open "File Details"
![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175202.png)

"File Details"
![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175411.png)

### View the dependency paths of files

Scenario: Sometimes we need to find the dependency context of a file and see which file it is ultimately referenced by. This is to determine the scope of impact of modifying the file.

Use: You can select a single file and switch to the "Upstream Dependency Relationship Map" to view.

![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175559.png)

## Invitation

Holding the will to clean code, we hope that more people can join this project. The goal is to build an assistant tool that can help all front-end programmers to refactor/clean code.
