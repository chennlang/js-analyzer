import { SourceLocation } from '@babel/parser'
// 引用信息
export interface UsingItem {
    source: string,
    vars: string,
    fullPath?: string,
    loc: SourceLocation
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
        using: string []
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
}

export interface MaterialPackage {
    'files': string [],
    'import-files': ImportDeps,
    'export': ExportDeps,
    'import-package': ImportDeps,
    'import-unknown': ImportDeps,
}