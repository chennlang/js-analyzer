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
    "包管理": { "en": "Packages", "ja": "パッケージ" },
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
      '当前项目': { 'en': 'Current Project', 'ja': '現在のプロジェクト' },
      '已就绪': { 'en': 'Ready', 'ja': '準備完了' },
      '配置异常': { 'en': 'Config Error', 'ja': '設定エラー' },
      '刷新项目': { 'en': 'Refresh Project', 'ja': 'プロジェクトを更新' },
      '刷新中...': { 'en': 'Refreshing...', 'ja': '更新中...' },
      '手动添加项目': { 'en': 'Add Project', 'ja': 'プロジェクトを追加' },
      '本地目录导入': { 'en': 'Import Local Directory', 'ja': 'ローカルディレクトリをインポート' },
      '请输入本地项目目录': { 'en': 'Enter local project directory', 'ja': 'ローカルプロジェクトのディレクトリを入力' },
      '导入中...': { 'en': 'Importing...', 'ja': 'インポート中...' },
      '导入并生成配置': { 'en': 'Import and Generate Config', 'ja': 'インポートして設定を生成' },
      '导入本地项目': { 'en': 'Import Local Project', 'ja': 'ローカルプロジェクトをインポート' },
      '选择本地目录': { 'en': 'Choose Local Directory', 'ja': 'ローカルディレクトリを選択' },
      '正在选择目录...': { 'en': 'Choosing Directory...', 'ja': 'ディレクトリを選択中...' },
      '选择本地目录后，会自动生成一份新项目配置，并立即加入项目列表。': { 'en': 'After you choose a local directory, a new project config is generated and added to the list immediately.', 'ja': 'ローカルディレクトリを選択すると、新しいプロジェクト設定が自動生成され、すぐに一覧へ追加されます。' },
      '最近导入目录': { 'en': 'Recently Imported', 'ja': '最近インポートしたディレクトリ' },
      '项目列表': { 'en': 'Projects', 'ja': 'プロジェクト一覧' },
      '个项目': { 'en': 'projects', 'ja': '件のプロジェクト' },
      '自动生成配置后，你仍然可以在这里微调。': { 'en': 'After auto-generation, you can still fine-tune the config here.', 'ja': '自動生成後も、ここで設定を微調整できます。' },
      '先导入一个本地项目': { 'en': 'Import a local project first', 'ja': 'まずローカルプロジェクトをインポートしてください' },
      '点击左侧按钮选择目录，系统会自动创建新项目配置。': { 'en': 'Use the button on the left to choose a directory, then the system creates a new project config automatically.', 'ja': '左側のボタンでディレクトリを選択すると、システムが新しいプロジェクト設定を自動作成します。' },
      '未命名项目': { 'en': 'Untitled Project', 'ja': '無題のプロジェクト' },
      '保存中...': { 'en': 'Saving...', 'ja': '保存中...' },
      '保存配置': { 'en': 'Save Config', 'ja': '設定を保存' },
      '切换为当前项目': { 'en': 'Set as Current', 'ja': '現在のプロジェクトに切り替え' },
      '删除项目': { 'en': 'Delete Project', 'ja': 'プロジェクトを削除' },
      '确认删除当前项目吗？': { 'en': 'Delete the current project?', 'ja': '現在のプロジェクトを削除しますか？' },
      '启动配置': { 'en': 'Startup', 'ja': '起動設定' },
      '导入项目': { 'en': 'Imported', 'ja': 'インポート済み' },
      '手动项目': { 'en': 'Manual', 'ja': '手動' },
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
