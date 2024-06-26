<div align="center" style="text-align: center;">
    <h1 style="text-align: center;">🧬Js Analyzer</h1>
    <p style="text-align: center;">フロントエンド依存関係分析のための視覚化、インタラクティブなツール</p>
    <p style="text-align: center;">Vue、React、Svelte、Angular、Nodeなど、あらゆるフロントエンドプロジェクトに適用可能</p>
    <p align='center'>
        <a href="https://github.com/chennlang/js-analyzer/blob/main/README.md">English</a>
        |
        <a href="https://github.com/chennlang/js-analyzer/blob/main/README_zh.md">简体中文</a>
        |
        <b>日本語</b>
    </p>
</div>

https://github.com/chennlang/js-analyzer/assets/41711206/63797bfd-440c-401e-a0d8-833a9c8caef0

## 機能

- 一体型でインタラクティブな`可視化`依存分析システム
- エントリーファイルの動的な切り替えをサポート
- `依存反転`をサポート
- ファイルが参照された回数と参照元のアドレスを表示するサポート
- ファイルのエクスポート変数が参照された情報を表示するサポート
- ES6、CommonJs に適用
- サポートされているファイルタイプ：JS、TS、JSX、TSX、Vue、Sass、Less、Css、html
- package 依存分析サポート
- 未参照ファイル、npm パッケージの分析サポート
- ローカルストレージは`非常に安全`で、ネットワークに接続したりアップロードする必要はありません

## グローバルインストール

### 1. インストール

```shell
npm install @js-analyzer/server -g
# yarn add @js-analyzer/server -g
# pnpm install @js-analyzer/server -g
```

````

### 2. 使用法

コンソールでプロジェクトルートディレクトリに入り、`js-analyzer --root ./`を実行します。

```shell
cd /xxx/project

js-analyzer --root ./
```

## ローカルインストール

### 1. インストール

```shell
npm install @js-analyzer/server -D
# yarn add @js-analyzer/server -D
# pnpm install @js-analyzer/server -D
```

### 2. 使用法

#### 1. scripts に js-analyzer コマンドを追加

```json
"scripts": {
  "js-analyzer": "js-analyzer --root ./"
},
```

#### 2. コンソールで npm run js-analyzer を入力し、http://localhost:8088/ にアクセスすると確認できます。

```shell
npm run js-analyzer
# Service started：http://localhost:8088/
```

## 設定ファイル

上記コマンドで分析サービスを迅速に起動することができますが、プロジェクトの全体的なアーキテクチャが異なるため、js-analyzer がより正確に分析するためには、いくつかの必要な情報を設定する必要があります。

設定ファイルを指定するには、上記の起動コマンドを次のように修正します。

```json
"scripts": {
  "js-analyzer": "js-analyzer --config ./js-analyzer.js"
},
```

js-analyzer.js

```js
module.exports = {
  // ルートディレクトリ
  root: "/Users/ll/Downloads/react-admin-master",
  // 分析不要なディレクトリ
  ignore: ["**/node_modules/**", "**/dist/**"],
  // 拡張子なしのファイルを解析する場合の優先順位
  extensions: [".js", ".ts", ".tsx", ".vue", ".json", ".jsx"],
  // プロジェクトのエイリアスマッピングパス
  alias: {
    "@@/": "/",
    "~~/": "/",
    "@/": "/src/",
    "~/": "/src/",
  },
  // サーバーとポートに関連する
  server: {
    port: 8088,
    host: "localhost",
    openBrowser: true, // 起動後にブラウザを自動的に開く
  },
};
```

## アップデート

- VUE SETUP タイプをサポート
- カスタムプラグインを自由に定義し、希望のデータを生成
- 内蔵されているプロジェクトのホットワードプラグインのサポート
- ファイル依存のビュー：単一のフォルダ内の依存関係ビューのサポート
- Sass、Less、Css などのスタイルファイル分析（新機能、サポート済み）
- プロジェクト変数のホットワード図のサポート

## TODO

- プロジェクトコンポーネント文書の生成共有モジュール
- 循環依存分析
- モジュール安定性指標分析

## プラグイン開発

このツールは AST を解析し、関連依存情報を収集することで原理が成り立っています。理論上、ユーザーはこのプロセスで任意の情報を収集できます。そのため、プラグインを提供し、各フェーズのライフサイクルを公開し、ライフサイクル関数内で任意のロジックを実行できるようにします。

### 例：プロジェクト内で使用される変数名を収集するカスタムプラグイン

```js
const myCustomPlugin = {
  name: "MyCustomPlugin",
  // 出力情報
  output: {
    data: [],
    file: "test.json",
  },
  // script解析時に実行
  ScriptParser({ file, content }) {
    const self = this;
    return {
      VariableDeclarator(tPath) {
        tPath.node.id && self.output.data.push(tPath.node.id.name);
      },
    };
  },
  // script解析完了後に実行
  AfterScriptParser() {},
};

module.exports = {
  plugins: [myCustomPlugin],
};
```

デフォルトで生成されたデータにアクセスするには 'http://localhost:8087/data/test.json'

## ガイド

### プロジェクトの【ジャンクファイル】をクリアする方法

何が【ジャンクファイル】ですか？ 参照されていないファイルを指します。

- 方法 1：【リレーションシップ図】では、左側のディレクトリツリーの各ファイルの後ろに【参照数】があり、その数が `0` の場合は参照されていないことを意味します。
- 方法 2：【リレーションシップ図】

### プロジェクトの中の「隠れた参照」を発見

「隠れた参照」とは何か？それは`package.json`に登録されていない、またはプロジェクト内で使用されている第三者のライブラリを指します。

> このような状況がどうして発生するのか、例えば私たちのプロジェクトで npm パッケージ`A`をインストールしたとします。そして、`A`はライブラリ`a`、`b`に依存しています。そうすると`node_modules`には`A`、`a`、`b`の三つのライブラリが存在することになります。確かに私たちはプロジェクト内で直接`a`、`b`を使用することができますが、これはとても危険です！

私たちは「隠れた参照」ページでこのような参照をすべて見つけることができ、使用しているライブラリを`package.json`に明示的に登録することができます。

【ファイル詳細】を開く
![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175202.png)

【ファイル詳細】
![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175411.png)

### ファイルの依存パスを確認

シナリオ：時々、あるファイルの依存関係を探し、最終的にどのファイルによって参照されているかを確認して、ファイルの変更の影響範囲を確認する必要があります。

使用方法：単一のファイルを選択した後、【上流依存関係グラフ】に切り替えて確認できます。

![](https://cdn.jsdelivr.net/gh/chennlang/doc-images//picGo/20240508175559.png)

## 招待

クリーンコードの精神を受け継ぎ、このプロジェクトに更に多くの人々が参加することを望んでいます。目標は、すべてのフロントエンドプログラマがコードをリファクタリング/整理するのを助ける助けとなるツールを構築することです。
````
