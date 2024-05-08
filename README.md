<div align="center" style="text-align: center;">
    <h1 style="text-align: center;">🧬Js Analyzer</h1>
    <p style="text-align: center;">An interactive, visual front-end dependency analysis tool</p>
    <p style="text-align: center;">Applicable for any front-end project such as Vue, React, Svelte, Angular, Node</p>
    <p align='center'>
 <b>English</b> | <a href="https://github.com/chennlang/js-analyzer/blob/main/README_zh.md">简体中文</a>
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

## Global Installation

### 1. Installation

```shell
npm install @js-analyzer/server -g
# yarn add @js-analyzer/server -g
# pnpm install @js-analyzer/server -g
```

### 2. Usage

Enter the console into any project root directory and execute `js-analyzer --root ./`

```shell
cd /xxx/project

js-analyzer --root ./
```

## Local Installation

### 1. Installation

```shell
npm install @js-analyzer/server -D
# yarn add @js-analyzer/server -D
# pnpm install @js-analyzer/server -D
```

### 2. Usage

#### 1. Add the "js-analyzer" command in scripts

```json
"scripts": {
  "js-analyzer": "js-analyzer --root ./"
},
```

#### 2. Enter "npm run js-analyzer" in the console and visit http://localhost:8088/ to see it.

```shell
npm run js-analyzer
# Service started：http://localhost:8088/
```

## Configuration File

You can quickly start an analysis service using the above commands. However, each project's overall architecture is different, so if you want "js-analyzer" to be better and more accurate, you need to configure some necessary information.

To specify the configuration file, simply modify the start command as follows

```json
"scripts": {
  "js-analyzer": "js-analyzer --config ./js-analyzer.js"
},
```

js-analyzer.js

```js
module.exports = {
  // Root directory
  root: "/Users/ll/Downloads/react-admin-master",
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
