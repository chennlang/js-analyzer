import { SourceLocation } from '@babel/parser'
// 引用信息
export interface UsingItem {
    source: string,
    vars: string,
    fullPath?: string,
    loc: SourceLocation,
    autoImport?: boolean,
    autoImportType?: 'vue-component' | 'auto-import' | 'type-re-export',
    autoImportName?: string
}

export interface ImportDepItem {
    num: number,
    using: UsingItem []
}

export interface ImportDeps {
    [path: string]: ImportDepItem
}

// 导出信息
export interface ExportDepItem {
    [vars: string]: {
        num: number,
        using: string [],
        autoImport?: boolean,
        autoImportType?: 'vue-component' | 'auto-import' | 'type-re-export',
        autoImportPath?: string,
        autoImportExportName?: string,
        sourceFile?: string
    }
}

export interface ExportDeps {
    [path: string]: ExportDepItem
}

export interface FileQuoteItem {
    num: number,
    using: UsingItem []
    deps: UsingItem []
}

export interface FileQuote {
    [path: string]: FileQuoteItem
}

// 文件依赖信息
export interface FileDeps {
    importDeps: UsingItem [],
    exportInfo: ExportDepItem
}

// 自定义插件
export interface Plugin {
    name: string,
    output: {
        data: Record<string, unknown>
        file: string
    },
    ScriptParser?: (data: { file: string, content: string }) => Record<string, unknown>,
    AfterScriptParser?: () => void
}

// 配置信息
export interface Config {
    root: string,
    ignore?: (string | RegExp) [],
    extensions?: string [],
    alias?: Record<string, string>,
    path?: string,
    outputPath?: string,
    plugins?: Plugin [],
    ide?: string
}


// 核心导出信息
export interface DataCollector {
    files: string [],
    fileQuote: ImportDeps,
    exportQuote: ExportDeps,
    packageQuote: ImportDeps,
    unknownQuote: ImportDeps,
    autoImports: AutoImportDeps,
}

// 自动导入相关的数据结构
export interface AutoImportQuote {
    name: string          // 变量名/组件名
    importPath: string    // 导入路径
    exportName: string    // 导出名
    type: 'vue-component' | 'auto-import' | 'type-re-export'
    sourceFile: string    // 来源的声明文件
    globalDeclaration?: boolean // 是否为全局变量声明
}

export interface ComponentQuote {
    name: string          // 组件名
    importPath: string    // 导入路径
    exportName: string    // 导出名，通常是 'default'
    type: 'vue-component'
    sourceFile: string    // 来源的声明文件
}

export interface AutoImportDeps {
    [path: string]: AutoImportQuote[]
}

export interface MaterialPackage {
    'files': string [],
    'import-files': ImportDeps,
    'export': ExportDeps,
    'import-package': ImportDeps,
    'import-unknown': ImportDeps,
    'auto-imports': AutoImportDeps,
}