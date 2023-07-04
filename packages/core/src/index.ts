const fs = require('fs');
const path = require("path")

const fg = require('fast-glob')
import injectExportQuoteNum from './inject-export-quote-num'
import scriptParser from './script-parser'
import styleParser from './style-parser'
import htmlParser from './html-parser'
import logger from '../logger'
const { parse: vueParse } = require('@vue/compiler-sfc')
import { writeFile, clearDist } from './utils'

import type {
    FileDeps,
    ImportDeps,
    FileQuote,
    ExportDeps,
    UsingItem,
    ExportDepItem,
    Config,
    DataCollector,
    MaterialPackage
} from '../types'

type LocalConfig = Required<Config>

// --------------------------------------------------------global variable-------------------------------------

const defEmptyDeps = (): FileDeps => ({
    importDeps: [],
    exportInfo: {}
})

// --------------------------------------------------------functions-------------------------------------

function defDependencies (filePath: string): {
    dep: ImportDeps,
    dependencies: string []
} {
    const dependenciesFile = fs.readFileSync(filePath)
    // 生产依赖
    const dependencies = Object.keys(JSON.parse(dependenciesFile).dependencies || {})

    const dep = dependencies.reduce((obj, key) => {
        obj[key] = { num: 0, using: [] }
        return obj
    }, {} as ImportDeps)

    return {
        dep,
        dependencies,
    }
}


/**
 * 解析路径中的别名
 * @param {String} targetPath 带解析目标文件路径
 * @param {String} filePath 当前所在文件路径
 * @returns 
 */
function resolvePath(targetPath: string, filePath: string, config: LocalConfig): string {
    const relativePathReg = /\.\/|\.\.\//
    const alias = config.alias

    if (alias) {
        for (const key in alias) {
            const reg = new RegExp(key)
            if (reg.test(targetPath)) {
                return targetPath
                    .replace(reg, config.root + alias[key])
                    // 兼容不同写法
                    .replace(/\/\//g, '/')
            }
        }
    }
    
    if (relativePathReg.test(targetPath)) {
        // if (targetPath.indexOf('index-card.png') > -1) {
        //     console.log({
        //         targetPath,
        //         filePath,
        //         dir: path.dirname(filePath),
        //         res01: path.resolve(filePath, targetPath),
        //         res0: path.join(filePath, targetPath),
        //         res1: path.join(path.dirname(filePath), targetPath),
        //         res2: path.resolve(path.dirname(filePath), targetPath),
        //     })
        // }
        const dir = path.dirname(filePath)
        return path.resolve(dir, targetPath)
    }

    return targetPath
}

/**
 * 自动添加文件扩展名
 * @param {*} filePath 文件路径
 * @returns 待后缀名的文件路径
 */
function addExtension(filePath: string, config: LocalConfig) {
    if (path.extname(filePath) === '' && filePath.indexOf(config.root) > -1) {
        const extFile = config.extensions.find(ext => fs.existsSync(filePath + ext))

        // 是否存在 name.ext
        if (!extFile) {
            const indexExt = config.extensions.find(ext => fs.existsSync(path.resolve(filePath, 'index' + ext)))
            
            // 是否存在 name/index.ext
            if (!indexExt) {
                const baseName = path.basename(filePath)
                const sameNameExt = config.extensions.find(ext => fs.existsSync(path.resolve(filePath, baseName + ext)))
                
                // 是否存在 name/name.ext
                if (!sameNameExt) {
                    return filePath
                }
                return path.resolve(filePath, baseName + sameNameExt)
            }
            return path.resolve(filePath, 'index' + indexExt)
        }
        return filePath + extFile
    }
    return filePath
}

/**
 * 解析返回依赖全路径
 * @param {String} targetPath 需要解析的路径
 * @param {String} filePath 当前所在文件路径
 * @returns targetPath 的全路径
 */
function getDepFullPath(targetPath: string, filePath: string, config: LocalConfig): string {
    // 去掉前单引号 | 双引号
    const s = targetPath.replace(/(^['"])|(['"]$)/g, '')
    const r = resolvePath(s, filePath, config)
    const f = addExtension(r, config)
    return f
}

/**
 * 搜集文件依赖信息和导出信息
 * @param {String} file 文件路径
 * @returns importDeps, exportInfo
 */
function getFileDeps (file: string, config: LocalConfig): FileDeps {
    const extname = path.extname(file)

    // 目前仅支持以下文件解析
    const supportExts = [
        '.js',
        '.mjs',
        '.jsx',
        '.ts',
        '.tsx',
        '.vue',
        '.scss',
        '.less',
        '.css',
        '.html'
    ]

    if (!supportExts.includes(extname)) {
        return defEmptyDeps()
    }

    // 读取文件
    const fileContent = fs.readFileSync(file, 'utf-8')

    if (['.js','.mjs','.jsx','.ts', '.tsx',].includes(extname)) {
        return scriptParser(fileContent, file, config)
    }

    if (['.css', '.less', '.scss'].includes(extname)) {
        return styleParser(fileContent, extname.replace('.', ''), config)
    }
    
    if (extname === '.html') {
        return htmlParser(fileContent, file, config)
    }

    if (extname === '.vue') {
        const descriptor = vueParse(fileContent).descriptor

        // script deps
        let scriptDeps = defEmptyDeps()
        if (descriptor.script || descriptor.scriptSetup) {
            let content = ''
            if (descriptor.script) {
                content = descriptor.script.content
            }
            if (descriptor.scriptSetup) {
                content = descriptor.scriptSetup.content
            }
            scriptDeps = scriptParser(content, file, config)
        }

        // style deps
        const styleDeps = descriptor.styles.reduce((pre: FileDeps, style: any) => {
            const d = styleParser(style.content, style.lang, config)
            Object.assign(pre.importDeps, d.importDeps)
            Object.assign(pre.exportInfo, d.exportInfo)
            return pre
        }, defEmptyDeps())

        // html deps
        let htmlDeps = defEmptyDeps()
        if (descriptor.template) {
            htmlDeps = htmlParser(descriptor.template.content, file, config)
        }

        return {
            importDeps: Object.assign([], scriptDeps.importDeps, styleDeps.importDeps, htmlDeps.importDeps),
            // TODO: 由于 exportInfo 是一个对象，会导致 assign 合并时存在重名覆盖
            // 目前看来问题不到，因为引用了同一个文件两次只采集到一次也合理
            // 但是如果 source 不一样就有问题了，例如 @import './css.css', @import '~/css.css'
            // 上面的情况是同一个文件会被认为是两个文件
            exportInfo: Object.assign({}, scriptDeps.exportInfo, styleDeps.exportInfo, htmlDeps.exportInfo)
        }
    }
    logger.error(`getFileDeps：未被处理的文件格式${extname}`)
    return defEmptyDeps()
}


/**
 * 注入 export 依赖
 * @param {Object} info 文件导出信息
 * @param {String} file 文件路径
 */
function injectExportInfo (info: ExportDepItem, file: string, exportQuote: ExportDeps) {
    exportQuote[file] = info
}

/**
 * 注入依赖
 * @param {Array} deps 文件依赖信息
 * @param {String} file 文件路径
 */
function injectFileDeps(
    deps: UsingItem [],
    file: string,
    fileQuote: FileQuote,
    packageQuote: ImportDeps,
    dependencies: string [],
    unknownQuote: ImportDeps,
    config: LocalConfig
) {
    for (const item of deps) {
        const { source, vars, loc } = item
        const depName = getDepFullPath(source, file, config)
        const targetKey = dependencies.find(key => {
            if (depName.startsWith('@')) { // package name has namespace
                return depName.startsWith(key)
            } else {
                return depName.split('/')[0] === key
            }
        })

        // 生产依赖
        if (targetKey) {
            packageQuote[targetKey].num += 1
            packageQuote[targetKey].using.push({ source: source, vars: vars, fullPath: file, loc })
        } else if (fileQuote[depName]) { // 文件依赖
            fileQuote[depName].num += 1
            fileQuote[depName].using.push({ source: source, vars: vars, fullPath: file, loc })
        } else { // 未知依赖
            if (unknownQuote[depName]) {
                unknownQuote[depName].num += 1
                unknownQuote[depName].using.push({
                    source: source,
                    vars: vars,
                    fullPath: file,
                    loc: {}
                })
            } else {
                unknownQuote[depName] = {
                    num: 1,
                    using: [{
                        source: source,
                        vars: vars,
                        fullPath: file,
                        loc: {}
                    }]
                }
            }
        }
    }
}




// ---------------------------------------------execute------------------------------------------------

/**
 * 主程序
 */
async function main(config: LocalConfig): Promise<DataCollector> {
    if (!config.root) {
        throw new Error('root must be in the config file')
    }

    const fileQuote: FileQuote = {}
    const exportQuote: ExportDeps = {}
    const unknownQuote: ImportDeps = {}

    const configPath = config.path || config.root
    const searchPath = fs.lstatSync(configPath).isDirectory()
        ? configPath + '/**/*'
        : configPath
    const files: string [] = await fg([searchPath], {
        ignore: config.ignore || ['**/node_modules/**', '**/dist/**']
    })

    // 同一个项目下可能存在多个 package.json 文件，这里主要是合并所有依赖信息
    const packages = files.filter(file => file.endsWith('package.json'))
        .map(file => defDependencies(file))
    const packageQuote = packages
        .reduce((collector, item) => {
            Object.assign(collector, item.dep)
            return collector
        }, {} as ImportDeps)
    const dependencies = packages
        .reduce((collector, item) => {
            collector = Array.from(new Set([...collector, ...item.dependencies]))
            return collector
        }, [] as string [])
  
    files.forEach(file => {
        fileQuote[file] = {
            num: 0,
            using: [],
            deps: []
        }
    })

    files.forEach(file => {
        try {
            const { importDeps, exportInfo } = getFileDeps(file, config)
            fileQuote[file].deps = importDeps
            
            injectFileDeps(importDeps, file, fileQuote, packageQuote, dependencies, unknownQuote, config)
            injectExportInfo(exportInfo, file, exportQuote)
        } catch (error) {
            logger.error(error, {
                fn: 'main',
                file: file,
            })
        }
    })
    injectExportQuoteNum({
        packageQuote,
        unknownQuote,
        fileQuote,
    }, exportQuote)
    return {
        files,
        fileQuote,
        exportQuote,
        packageQuote,
        unknownQuote,
    }
}

export class JsAnalyzer {
    private config: LocalConfig
    private materialPackage: MaterialPackage = {
        'import-files': {},
        'import-package': {},
        'import-unknown': {},
        'files': [],
        'export': {},
    }
    
    constructor (config: LocalConfig){
        this.config = config
    }
    
    /**
     * 
     * @param config 配置文件
     * @returns MaterialPackage 物料包
     */
    async init (config: Partial<LocalConfig>): Promise<MaterialPackage> {
        this.config = Object.assign(this.config, config)
        this.config.outputPath && await clearDist(this.config.outputPath)

        return main(this.config)
            .then(res => {
                this.materialPackage = {
                    'import-files': res.fileQuote,
                    'import-package': res.packageQuote,
                    'import-unknown': res.unknownQuote,
                    'files': res.files,
                    'export': res.exportQuote,
                }

                this.config.outputPath && this.write()
                this.config.outputPath && this.writeFromPlugin()
                
                return this.materialPackage
            })
    }
    
    
    /**
     * 获取依赖信息
     * @returns data 依赖信息
     */
    getData () {
        return this.materialPackage
    }
    
    /**
     * 将输出信息写入文件
     */
    write () {
        Object.keys(this.materialPackage).forEach(name => {
            writeFile(
                name + '.json',
                this.materialPackage[name as keyof MaterialPackage],
                this.config.outputPath
            )
        })
    }

    writeFromPlugin () {
        const plugins = this.config.plugins || []
        const dataPlugins = plugins.filter(plugin => plugin.output && plugin.output.data)
        dataPlugins.forEach(plugin => {
            writeFile(
                plugin.output.file,
                plugin.output.data,
                this.config.outputPath
            )
        })
    }

}


