const ts = require('typescript')
const path = require('upath')
const fs = require('fs')
import { AutoImportQuote, AutoImportDeps, Config } from '../types'
import logger from '../logger'

/**
 * 自动导入声明文件解析器
 * 用于解析 unplugin-vue-components 和 unplugin-auto-import 生成的 .d.ts 文件
 */
export class AutoImportParser {
    private config: Config
    private cache: Map<string, AutoImportQuote[]> = new Map()

    constructor(config: Config) {
        this.config = config
    }

    /**
     * 解析自动导入声明文件
     * @param filePath 声明文件路径
     * @returns 解析结果
     */
    parseDeclarationFile(filePath: string): AutoImportQuote[] {
        if (this.cache.has(filePath)) {
            return this.cache.get(filePath)!
        }

        const fileName = path.basename(filePath)
        let results: AutoImportQuote[] = []

        try {
            const content = fs.readFileSync(filePath, 'utf-8')

            if (fileName === 'components.d.ts') {
                results = this.parseComponentsDeclaration(content, filePath)
            } else if (fileName === 'auto-imports.d.ts') {
                results = this.parseAutoImportsDeclaration(content, filePath)
            }

            this.cache.set(filePath, results)
            logger.info(`解析自动导入文件完成: ${filePath}, 发现 ${results.length} 个导入`)

        } catch (error) {
            logger.error(`解析自动导入文件失败: ${filePath}`, error)
            results = []
        }

        return results
    }

    /**
     * 解析 components.d.ts 文件
     * @param content 文件内容
     * @param sourceFile 文件路径
     * @returns 组件引用信息
     */
    private parseComponentsDeclaration(content: string, sourceFile: string): AutoImportQuote[] {
        const components: AutoImportQuote[] = []
        const sourceFileObj = ts.createSourceFile(
            sourceFile,
            content,
            ts.ScriptTarget.Latest,
            true
        )

        const visit = (node: any) => {
            // 查找 declare module 'vue' 语句
            if (ts.isModuleDeclaration(node) &&
                node.name?.kind === ts.SyntaxKind.StringLiteral &&
                node.name.text === 'vue') {

                this.visitVueModuleDeclaration(node, sourceFile, components)
            }

            ts.forEachChild(node, visit)
        }

        visit(sourceFileObj)
        return components
    }

    /**
     * 解析 auto-imports.d.ts 文件
     * @param content 文件内容
     * @param sourceFile 文件路径
     * @returns 自动导入引用信息
     */
    private parseAutoImportsDeclaration(content: string, sourceFile: string): AutoImportQuote[] {
        const autoImports: AutoImportQuote[] = []
        const sourceFileObj = ts.createSourceFile(
            sourceFile,
            content,
            ts.ScriptTarget.Latest,
            true
        )

        const visit = (node: any) => {
            // 解析全局变量声明 declare global
            if (ts.isModuleDeclaration(node) &&
                node.name?.kind === ts.SyntaxKind.Identifier &&
                node.name.text === 'global') {

                this.visitGlobalModuleDeclaration(node, sourceFile, autoImports)
            }

            // 解析 declare module 'vue' 中的 ComponentCustomProperties
            if (ts.isModuleDeclaration(node) &&
                node.name?.kind === ts.SyntaxKind.StringLiteral &&
                node.name.text === 'vue') {

                this.visitVueModuleDeclaration(node, sourceFile, autoImports)
            }

            ts.forEachChild(node, visit)
        }

        visit(sourceFileObj)
        return autoImports
    }

    /**
     * 访问 Vue 模块声明，提取 GlobalComponents 接口信息
     */
    private visitVueModuleDeclaration(
        node: any,
        sourceFile: string,
        results: AutoImportQuote[]
    ) {
        if (!node.body || !ts.isModuleBlock(node.body)) return

        ts.forEachChild(node.body, (child: any) => {
            if (ts.isInterfaceDeclaration(child) && child.name.text === 'GlobalComponents') {
                this.visitGlobalComponentsInterface(child, sourceFile, results)
            }

            if (ts.isInterfaceDeclaration(child) && child.name.text === 'ComponentCustomProperties') {
                this.visitComponentCustomPropertiesInterface(child, sourceFile, results)
            }
        })
    }

    /**
     * 访问全局模块声明，提取全局变量信息
     */
    private visitGlobalModuleDeclaration(
        node: any,
        sourceFile: string,
        results: AutoImportQuote[]
    ) {
        if (!node.body || !ts.isModuleBlock(node.body)) return

        ts.forEachChild(node.body, (child: any) => {
            if (ts.isVariableStatement(child)) {
                this.visitGlobalVariableStatement(child, sourceFile, results)
            }
        })
    }

    /**
     * 访问 GlobalComponents 接口
     */
    private visitGlobalComponentsInterface(
        node: any,
        sourceFile: string,
        results: AutoImportQuote[]
    ) {
        ts.forEachChild(node, (member: any) => {
            if (ts.isPropertySignature(member) && member.name) {
                const componentName = member.name.getText()
                const typeNode = member.type

                if (typeNode) {
                    const componentInfo = this.extractComponentInfo(typeNode, componentName, sourceFile)
                    if (componentInfo) {
                        results.push(componentInfo)
                    }
                }
            }
        })
    }

    /**
     * 访问 ComponentCustomProperties 接口
     */
    private visitComponentCustomPropertiesInterface(
        node: any,
        sourceFile: string,
        results: AutoImportQuote[]
    ) {
        ts.forEachChild(node, (member: any) => {
            if (ts.isPropertySignature(member) && member.name) {
                const propertyName = member.name.getText()
                const typeNode = member.type

                if (typeNode) {
                    const autoImportInfo = this.extractAutoImportInfo(typeNode, propertyName, sourceFile, true)
                    if (autoImportInfo) {
                        results.push(autoImportInfo)
                    }
                }
            }
        })
    }

    /**
     * 访问全局变量语句
     */
    private visitGlobalVariableStatement(
        node: any,
        sourceFile: string,
        results: AutoImportQuote[]
    ) {
        ts.forEachChild(node, (declarationList: any) => {
            if (ts.isVariableDeclarationList(declarationList)) {
                ts.forEachChild(declarationList, (declaration: any) => {
                    if (ts.isVariableDeclaration(declaration) &&
                        declaration.name &&
                        ts.isIdentifier(declaration.name)) {

                        const varName = declaration.name.text
                        const typeNode = declaration.type

                        if (typeNode) {
                            const autoImportInfo = this.extractAutoImportInfo(typeNode, varName, sourceFile, true)
                            if (autoImportInfo) {
                                results.push(autoImportInfo)
                            }
                        }
                    }
                })
            }
        })
    }

    /**
     * 从类型节点中提取组件信息
     */
    private extractComponentInfo(
        typeNode: any,
        componentName: string,
        sourceFile: string
    ): AutoImportQuote | null {
        const typeText = typeNode.getText()

        // 匹配模式: typeof import('path')['default']
        const typeofMatch = typeText.match(/typeof\s+import\(['"]([^'"]+)['"]\)\s*\[['"]([^'"]+)['"]\]/)

        if (typeofMatch) {
            const [, importPath, exportName] = typeofMatch
            return {
                name: componentName,
                importPath: this.resolveImportPath(importPath, sourceFile),
                exportName,
                type: 'vue-component',
                sourceFile
            }
        }

        return null
    }

    /**
     * 从类型节点中提取自动导入信息
     */
    private extractAutoImportInfo(
        typeNode: any,
        varName: string,
        sourceFile: string,
        globalDeclaration: boolean
    ): AutoImportQuote | null {
        let typeText = typeNode.getText()

        // 处理 UnwrapRef 包装器
        const unwrapRefMatch = typeText.match(/UnwrapRef<(.+)>/)
        if (unwrapRefMatch) {
            typeText = unwrapRefMatch[1]
        }

        // 处理 readonly 修饰符
        const readonlyMatch = typeText.match(/readonly\s+(.+)/)
        if (readonlyMatch) {
            typeText = readonlyMatch[1]
        }

        // 匹配模式: typeof import('path')['exportName']
        const typeofMatch = typeText.match(/typeof\s+import\(['"]([^'"]+)['"]\)\s*\[['"]([^'"]+)['"]\]/)

        if (typeofMatch) {
            const [, importPath, exportName] = typeofMatch
            return {
                name: varName,
                importPath: this.resolveImportPath(importPath, sourceFile),
                exportName,
                type: 'auto-import',
                sourceFile,
                globalDeclaration
            }
        }

        return null
    }

    /**
     * 解析导入路径，处理相对路径和别名
     */
    private resolveImportPath(importPath: string, sourceFile: string): string {
        // 如果是相对路径
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const sourceDir = path.dirname(sourceFile)
            const resolvedPath = path.resolve(sourceDir, importPath)
            return resolvedPath
        }

        // 如果是别名路径，使用现有的别名解析逻辑
        if (this.config.alias) {
            const aliasKeys = Object.keys(this.config.alias).sort().reverse()
            for (const key of aliasKeys) {
                if (importPath.startsWith(key)) {
                    const val = this.config.alias[key]
                    return path.join(this.config.root, val, importPath.substring(key.length))
                }
            }
        }

        // 其他情况返回原路径
        return importPath
    }

    /**
     * 获取所有自动导入信息
     * @param projectRoot 项目根目录
     * @returns 自动导入依赖信息
     */
    getAllAutoImports(projectRoot: string): AutoImportDeps {
        const result: AutoImportDeps = {}

        // 查找自动导入声明文件
        const componentsDts = path.join(projectRoot, 'components.d.ts')
        const autoImportsDts = path.join(projectRoot, 'auto-imports.d.ts')

        if (fs.existsSync(componentsDts)) {
            const components = this.parseDeclarationFile(componentsDts)
            if (components.length > 0) {
                result[componentsDts] = components
            }
        }

        if (fs.existsSync(autoImportsDts)) {
            const autoImports = this.parseDeclarationFile(autoImportsDts)
            if (autoImports.length > 0) {
                result[autoImportsDts] = autoImports
            }
        }

        return result
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear()
    }
}