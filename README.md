<div align="center" style="text-align: center;">
    <h1 style="text-align: center;">Js Analyzer</h1>
    <p style="text-align: center;">一个可视化可交互的 Web 文件依赖分析工具</p>
    <p style="text-align: center;">跨框架,可用于 Vue React Svelte Angular Node 等前端项目</p>
    <img src="http://oss.ailan.top/20230603000655.png" style="width: 100%;height: auto;" />
</div>

## 功能

- 代码重构：通过分析依赖关系，我们可以更好地理解代码的结构和逻辑，从而更容易地进行代码重构和优化。
- 模块化开发：通过分析依赖关系，我们可以将项目拆分成多个模块，每个模块都有清晰的职责和依赖关系，从而实现模块化开发和管理。
- 代码测试：通过分析依赖关系，我们可以更容易地编写和运行单元测试，从而提高代码的质量和可靠性。
- 代码维护：通过分析依赖关系，我们可以更容易地定位和解决代码中的问题，从而提高代码的可维护性和可扩展性。

## NEWS

- 支持 VUE SETUP 类型
- 可自定义插件，生成你想要的数据
- 内置项目热词插件支持
- 文件依赖视图：支持单个文件夹内依赖关系视图
- Sass、Less、Css 等样式文件分析(New, 已支持)
- 支持项目变量热词图

## 功能/特性

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

## 场景

- 代码模块越来越多,依赖关系越来越复杂?使用我们的依赖分析工具,一秒钟了解你的整个代码架构,清晰知道每个模块的输入输出关系。
- 发现大量的文件需要删除，删除这些文件很简单，不过想要删除这些文件间接引用的文件就变得很难，需要挨个文件去查看它们的依赖信息，用它！
- 正在修改一个被多处引用的公共组件（模块），想要知道该组件的影响范围，正在被哪些文件（模块）引用，用它！
- 想要删除项目中未使用的文件、未使用的库、未被引用的导出变量，用它！
- 查看项目中引用最多的组件、函数，添加单元测试，用它！
- 查看组件间的引用关系，清晰的知道被组件的影响范围，用它！

## 全局安装

```shell
npm install @js-analyzer/server -g
```

**使用**

控制台进入到任意项目根目录下，执行 `js-analyzer --root ./`

```shell
cd /xxx/project

js-analyzer --root ./
```

## 局部安装

```shell
npm install @js-analyzer/server -D
```

**使用**

1.在 scripts 中添加 js-analyzer 命令

```json
"scripts": {
  "js-analyzer": "js-analyzer --root ./"
},
```

2.在控制台输入 yarn js-analyzer，访问 http://localhost:8088/ 就能看到了。

```shell
yarn js-analyzer
# Service started：http://localhost:8088/
```

## 配置文件

通过上面的命令已经能很快启动一个分析服务了，可是每个项目的整体架构不同，想要 js-analyzer 更好的更准确的分析，还需要配置一些必要信息。

指定配置文件只需要将上面的启动命令修改一下

```json
"scripts": {
  "js-analyzer": "js-analyzer --config ./js-analyzer.js"
},
```

js-analyzer.js

```js
module.exports = {
  // 根目录
  root: "./",
  // 不需要分析的目录
  ignore: ["**/node_modules/**", "**/dist/**"], 
  // 解析没有扩展名的文件时优先查找顺序
  extensions: [".js", ".ts", ".tsx", ".vue", ".json", "jsx"],
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

## TODO LIST

- 项目组件文档生成共享模块
- 循环依赖分析
- 模块稳定性指标分析

## 插件开发

自定义生成数据，默认访问地址 'http://localhost:8087/data/test.json'

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

## 邀请

继承整洁代码意志，希望更多的人加入到这个项目中，目标是构建一个能帮助所有前端程序员重构/整洁代码的辅助工具。
