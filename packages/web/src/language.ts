import { computed } from "vue"

type Lang = 'en' | 'ja'
const defaultLanguage = 'en'

export const languageOptions = [
    { value: 'en', text: 'English' },
    { value: 'zh_CN', text: '中文(简体)' },
    { value: 'ja', text: '日本語' },
]

export const languageMap = {
    "关系图": { "en": "Graph", "ja": "関係図" },
    "包管理": { "en": "Packages", "ja": "パッケージ管理" },
    "热词": { "en": "Hot Words", "ja": "ホットワード" },
    "隐式引用": { "en": "Undeclared", "ja": "暗黙の参照" },
    "默认标题": { "en": "Default Title", "ja": "デフォルトのタイトル" },
    "导出信息": { "en": "Export Information", "ja": "情報をエクスポートする" },
    "我的项目": { "en": "My Project", "ja": "私のプロジェクト" },
    "项目管理": { "en": "Project Management", "ja": "プロジェクト管理" },
    "例如：/user/app/my-project": { "en": "For example: /user/app/my-project", "ja": "例：/user/app/my-project" },
    "别名,例如：@/": { "en": "Alias, for example: @/", "ja": "別名、例：@/" },
    "映射名，例如：src/": { "en": "Mapping name, for example: src/", "ja": "マッピング名、例：src/" },
    "逗号隔开，默认：node_modules,dist": { "en": "Separated by commas, default: node_modules,dist", "ja": "カンマ区切り、デフォルト：node_modules,dist" },
    "更新中...": { "en": "Updating...", "ja": "更新中..." },
    "更新": { "en": "Update", "ja": "更新" },
    "代码预览": { "en": "Code Preview", "ja": "コードプレビュー" },
    "全部": { "en": "All", "ja": "全て" },
    "未被引用文件": { "en": "Unreferenced Files", "ja": "未参照ファイル" },
    "搜索": { "en": "Search", "ja": "検索" },
    "被依赖视图": { "en": "Dependency View", "ja": "依存関係ビュー" },
    "依赖视图": { "en": "Dependency View", "ja": "依存関係ビュー" },
    "上游依赖图": { "en": "Upstream Dependency Graph", "ja": "上流依存グラフ" },
    "文件夹关系图": { "en": "Folder Relationship Map", "ja": "フォルダー関係図" },
    "默认": { "en": "Default", "ja": "デフォルト" },
    "依赖分析视图": { "en": "Dependency Analysis View", "ja": "依存性分析ビュー" },
    "重置": { "en": "Reset", "ja": "リセット" },
    "显示节点文字": { "en": "Show Node Text", "ja": "ノードテキストを表示" },
    "文件详情": { "en": "File Details", "ja": "ファイルの詳細" },
    "文件名": { "en": "Filename", "ja": "ファイル名" },
    "被引用次数": { "en": "Number of References", "ja": "参照回数" },
    "绝对路径": { "en": "Absolute Path", "ja": "絶対パス" },
    "导出变量": { "en": "Exported Variables", "ja": "エクスポートされた変数" },
    "引用次数": { "en": "Number of References", "ja": "参照回数" },
    "引用文件": { "en": "Referenced File", "ja": "参照ファイル" },
    "包名": { "en": "Package Name", "ja": "パッケージ名" },
    "名称": { "en": "Name", "ja": "名前" },
    "引用名": { "en": "Reference Name", "ja": "参照名" },
    "引用源": { "en": "Source of Reference", "ja": "参照元" },
    "引用源未注册到项目中": { "en": "Reference Source Not Registered in the Project", "ja": "参照元がプロジェクトに登録されていない" },
    "引用列表": { "en": "Reference List", "ja": "参照リスト" },
    "被引用": {
        "en": "Cited",
        "ja": "引用された"
      },
      "占比": {
        "en": "Proportion",
        "ja": "割合"
      },
      "基础信息": {
        "en": "Basic Information",
        "ja": "基本情報"
      },
      "例如：我的项目": {
        "en": "For example: My Project",
        "ja": "例：私のプロジェクト"
      },
      '路径': { 'en': 'path', 'ja': 'パス' },
      '别名映射': { 'en': 'Alias Mapping', 'ja': 'エイリアスマッピング' },
      '项目名称': { 'en': 'Project Name', 'ja': 'プロジェクト名' },
      '项目路径': { 'en': 'Project Path', 'ja': 'プロジェクトパス' },
      '忽略路径': { 'en': 'Ignore Path', 'ja': 'パスを無視する' },
      '请尽量完善以下信息，这能分析结果更加准确！': { 'en': 'Please provide more detailed information, it will help to analyze the results more accurately!', 'ja': '詳細な情報を提供していただくと、結果をより正確に分析できます！' },
  } as const

export const currentLanguage = localStorage.getItem('language') || defaultLanguage

export function $tf(text: keyof typeof languageMap): string {
    if (currentLanguage === 'zh_CN') return text

    return languageMap[text][currentLanguage as Lang]
}

export function switchLanguage (type: Lang) {
    localStorage.setItem('language', type)
    window.location.reload()
}