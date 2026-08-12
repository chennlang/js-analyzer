<div align="center" style="text-align: center;">
    <h1 style="text-align: center;">🧬Js Analyzer</h1>
    <p style="text-align: center;"> 一个可视化可交互的前端依赖分析工具</p>
    <p style="text-align: center;">可用于 Vue React Svelte Angular Node 等任何前端项目</p>
    <p align='center'>
      <a href="https://github.com/chennlang/js-analyzer/blob/main/README.md">English</a>
      |
      <b>简体中文</b>
      |
      <a href="https://github.com/chennlang/js-analyzer/blob/main/README_jp.md">日本語</a>
    </p>
</div>

https://github.com/chennlang/js-analyzer/assets/41711206/63797bfd-440c-401e-a0d8-833a9c8caef0

## 功能

- 可交互的一体化`可视化`依赖分析系统
- 支持动态切换入口文件
- 支持`依赖反转`
- 支持显示文件被引用次数，以及引用地址
- 支持显示文件的导出变量被引用信息
- 适用于 ES6、CommonJs
- 支持的文件类型：JS、TS、JSX、TSX、Vue、Sass、Less、Css、html
- 支持 package 依赖分析
- 支持未引用 文件、npm 包分析
- 本地存储 `非常安全`，不涉及联网和上传

## 全局安装（推荐）

### 1. 安装

```shell
npm install @js-analyzer/server -g
# yarn add @js-analyzer/server -g
# pnpm install @js-analyzer/server -g
```

### 2. 启动服务

直接在控制台执行 `js-analyzer` 即可，无需进入某个项目目录，因为项目可以直接在页面上添加和配置。

```shell
js-analyzer
# Service started：http://localhost:8088/
```

然后访问 http://localhost:8088/ 打开分析页面。

### 3. 在页面上手动添加项目

1. 点击页面右上角的齿轮图标（⚙️），打开【项目管理】弹窗。
2. 点击【手动添加项目】，在右侧的 JSON 编辑器中填写项目配置：
   - `name`：项目名称
   - `root`：项目根目录的绝对路径（必填）
   - `ignore`：不需要分析的目录，例如 `["**/node_modules/**", "**/dist/**"]`
   - `extensions`：实际使用的源码扩展名，例如 `[".js", ".ts", ".tsx", ".vue", ".json", ".jsx"]`
   - `alias`：路径别名映射，例如 `{ "@/": "/src/" }`
   - `ide`：用于打开文件的 IDE，默认为 `"code"`
3. 点击【保存配置】，服务会自动分析该项目并展示依赖信息。
4. 可以添加多个项目，通过页头项目下拉框切换当前项目，也可以在【项目管理】中对每个项目进行刷新或删除。

> 💡 也可以使用 [AI 生成项目配置](#使用-ai-生成项目配置)，无需手动编写配置。

> ⚠️ 不再推荐局部安装。由于项目现在可以直接在页面上添加和配置，一次全局安装即可满足所有项目。

## 配置文件

通过上面的命令已经能很快启动一个分析服务了，可是每个项目的整体架构不同，想要 js-analyzer 更好的更准确的分析，还需要配置一些必要信息。（此为可选项，同样的配置也可以在页面的【项目管理】中直接编辑。）

指定配置文件，使用 `--config` 参数启动服务即可

```shell
js-analyzer --config ./js-analyzer.js
```

js-analyzer.js

```js
module.exports = {
  // 根目录
  root: "./",
  // 不需要分析的目录
  ignore: ["**/node_modules/**", "**/dist/**"],
  // 解析没有扩展名的文件时优先查找顺序
  extensions: [".js", ".ts", ".tsx", ".vue", ".json", ".jsx"],
  // 项目的别名映射路径
  alias: {
    "@@/": "/",
    "~~/": "/",
    "@/": "/src/",
    "~/": "/src/",
  },
  // 启动的服务器和端口相关
  server: {
    port: 8088,
    host: "localhost",
    openBrowser: true, // 启动后自动在浏览器打开
  },
};
```

## 使用 AI 生成项目配置

添加新项目时，可以使用 [js-analyzer-config-prompt.md](./js-analyzer-config-prompt.md) 中的中文提示词来自动生成项目配置。

1. 打开提示词文件并复制其中的内容。
2. 将提示词粘贴给你的 AI 助手，并提供要分析的项目绝对路径。
3. 将返回的 JSON 复制到项目配置表单中，或调整后用于 `js-analyzer.js`。

提示词会要求 AI 检查项目的 package 元数据、TypeScript 或 JavaScript 配置、构建配置、忽略规则以及源码文件扩展名，并要求响应中只包含 JSON 配置对象。

## 更新

- 支持 VUE SETUP 类型
- 可自定义插件，生成你想要的数据
- 内置项目热词插件支持
- 文件依赖视图：支持单个文件夹内依赖关系视图
- Sass、Less、Css 等样式文件分析(New, 已支持)
- 支持项目变量热词图

## TODO

- 项目组件文档生成共享模块
- 循环依赖分析
- 模块稳定性指标分析

## 插件开发

该工具原理是通过解析 AST 收集了相关依赖信息，理论上用户同样可以在这个过程中收集到自己想要的任何信息。所以提供了插件的方式，暴露出各个阶段的生命周期，允许用户在生命周期函数中执行任何逻辑。

### 示例：一个项目内使用到的变量名收集插件

```js
const myCustomPlugin = {
  name: "MyCustomPlugin",
  // 输出信息
  output: {
    data: [],
    file: "test.json",
  },
  // 解析 script 时执行
  ScriptParser({ file, content }) {
    const self = this;
    return {
      VariableDeclarator(tPath) {
        tPath.node.id && self.output.data.push(tPath.node.id.name);
      },
    };
  },
  // 解析完 script 时执行
  AfterScriptParser() {},
};

module.exports = {
  plugins: [myCustomPlugin],
};
```

自定义生成数据，默认访问地址 'http://localhost:8087/data/test.json'

## 指南

### 如何清理项目中的【垃圾文件】

什么是【垃圾文件】？指的是未被引用的文件。

- 方式一：在【关系图】中，左侧的目录树中，每一个文件后面都一个【被引用数】，数量为 `0` 表示未被引用。
- 方式二：在【关系图】中，在【文件夹关系图】视图下，可以看到每一个文件的【被引用数】，数量为 `0` 表示未被引用。

![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175023.png)

### 如何清理项目中的【未使用导出】

在开发项目中， `const` 目录或者 `api` 目录下，会有很多导出但并未使用的变量或者方法：

```ts
// const.ts | api.ts | utils.ts

export const STATUS = "status"; // 未使用

export const TEXT = "text"; // 未使用

export const api_fetch_data = () => {}; // 未使用

export const api_fetch_result = () => {}; // 未使用
```

我们可以在【文件详情】中查看导出信息，找到【未使用导出】并删除它。那么如何打开【文件详情】？

- 方式一：【关系图】页面右侧的图表中的任意节点都是对应左侧的文件，单击节点后，显示【文件详情】。
- 方式二：已在左侧目录中选中目标文件，点击图表右上角的文件详情按钮。

### 发现项目中的【隐式引用】

什么是【隐式引用】？指那些并未在 `package.json` 中注册，或者项目中使用的第三方库。

> 为什么会出现这样的场景，例如我们在项目中安装了一个 npm 包 `A`，而 `A` 依赖库 `a`、`b`，那么在 `node_modules`,在回存在三个库 `A`、`a`、`b`，固然我们在项目中就能直接使用 `a`、`b`，单这样是非常不安全的！

我们可以在【隐式引用】页面下找到所有这样的引用，查看目标文件。然后显示的在 `package.json` 注册有使用的库。

打开【文件详情】
![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175202.png)

【文件详情】
![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175411.png)

### 查看文件依赖路径

场景：有时候我们需要寻找某个文件的依赖上文，看看最终被哪个文件引用了。以确认修改文件的影响范围。

使用：可以选择单个文件后，切换【上游依赖关系图】后查看。

![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175559.png)

## 邀请

秉承整洁代码意志，希望更多的人加入到这个项目中，目标是构建一个能帮助所有前端程序员重构/整洁代码的辅助工具。
