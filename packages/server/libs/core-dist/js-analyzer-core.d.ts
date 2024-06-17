import { SourceLocation } from '@babel/parser';

// 引用信息
interface UsingItem {
    source: string,
    vars: string,
    fullPath?: string,
    loc: SourceLocation
}

interface ImportDepItem {
    num: number,
    using: UsingItem []
}

interface ImportDeps {
    [path: string]: ImportDepItem
}

// 导出信息
interface ExportDepItem {
    [vars: string]: {
        num: number,
        using: string []
    }
}

interface ExportDeps {
    [path: string]: ExportDepItem
}

interface FileQuoteItem {
    num: number,
    using: UsingItem []
    deps: UsingItem []
}

interface FileQuote {
    [path: string]: FileQuoteItem
}

// 文件依赖信息
interface FileDeps {
    importDeps: UsingItem [],
    exportInfo: ExportDepItem
}

// 自定义插件
interface Plugin {
    name: string,
    output: {
        data: Record<string, unknown>
        file: string
    },
    ScriptParser?: (data: { file: string, content: string }) => Record<string, unknown>,
    AfterScriptParser?: () => void
}

// 配置信息
interface Config {
    root: string,
    ignore?: (string | RegExp) [],
    extensions?: string [],
    alias?: Record<string, string>,
    path?: string,
    outputPath?: string,
    plugins?: Plugin []
}


// 核心导出信息
interface DataCollector {
    files: string [],
    fileQuote: ImportDeps,
    exportQuote: ExportDeps,
    packageQuote: ImportDeps,
    unknownQuote: ImportDeps,
}

interface MaterialPackage {
    'files': string [],
    'import-files': ImportDeps,
    'export': ExportDeps,
    'import-package': ImportDeps,
    'import-unknown': ImportDeps,
}

export { Config, DataCollector, ExportDepItem, ExportDeps, FileDeps, FileQuote, FileQuoteItem, ImportDepItem, ImportDeps, MaterialPackage, Plugin, UsingItem };
