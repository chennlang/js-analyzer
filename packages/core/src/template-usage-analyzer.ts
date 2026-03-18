const fs = require('fs')
import { UsingItem, AutoImportDeps, AutoImportQuote } from '../types'
import logger from '../logger'

/**
 * Vue 模板使用情况分析器
 * 用于分析 Vue 模板中的自动导入组件和变量的使用情况
 */
export class TemplateUsageAnalyzer {
    private autoImports: AutoImportDeps
    private componentCache: Map<string, string[]>
    private variableCache: Map<string, string[]>

    constructor(autoImports: AutoImportDeps) {
        this.autoImports = autoImports
        this.componentCache = new Map()
        this.variableCache = new Map()
    }

    /**
     * 分析 Vue 文件中的模板使用情况
     * @param vueFiles Vue 文件路径数组
     * @returns 文件路径到使用情况的映射
     */
    analyzeVueTemplateUsings(vueFiles: string[]): Record<string, UsingItem[]> {
        const templateUsages: Record<string, UsingItem[]> = {}

        // 构建自动导入名称索引
        const autoImportIndex = this.buildAutoImportIndex()

        vueFiles.forEach(vueFile => {
            try {
                const usages = this.analyzeVueFile(vueFile, autoImportIndex)
                if (usages.length > 0) {
                    templateUsages[vueFile] = usages
                }
            } catch (error) {
                logger.error(`分析 Vue 文件模板使用失败: ${vueFile}`, error)
            }
        })

        return templateUsages
    }

    /**
     * 分析单个 Vue 文件
     */
    private analyzeVueFile(vueFile: string, autoImportIndex: {
        components: Map<string, AutoImportQuote>,
        variables: Map<string, AutoImportQuote>
    }): UsingItem[] {
        const content = fs.readFileSync(vueFile, 'utf-8')
        const usages: UsingItem[] = []

        // 提取模板内容
        const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/)
        if (!templateMatch) {
            return usages
        }

        const templateContent = templateMatch[1]

        // 分析组件使用
        const componentUsages = this.extractComponentUsages(templateContent, autoImportIndex.components)
        usages.push(...componentUsages)

        // 分析变量使用
        const variableUsages = this.extractVariableUsages(templateContent, autoImportIndex.variables)
        usages.push(...variableUsages)

        return usages
    }

    /**
     * 构建自动导入名称索引
     */
    private buildAutoImportIndex(): {
        components: Map<string, AutoImportQuote>,
        variables: Map<string, AutoImportQuote>
    } {
        const components = new Map<string, AutoImportQuote>()
        const variables = new Map<string, AutoImportQuote>()

        Object.values(this.autoImports).flat().forEach(autoImport => {
            if (autoImport.type === 'vue-component') {
                components.set(autoImport.name, autoImport)
                // 支持 kebab-case 转换 (MyButton → my-button)
                const kebabName = this.toKebabCase(autoImport.name)
                if (kebabName !== autoImport.name) {
                    components.set(kebabName, autoImport)
                }
            } else {
                variables.set(autoImport.name, autoImport)
            }
        })

        return { components, variables }
    }

    /**
     * 提取模板中的组件使用
     */
    private extractComponentUsages(template: string, autoImportComponents: Map<string, AutoImportQuote>): UsingItem[] {
        const usages: UsingItem[] = []
        const cacheKey = template

        if (this.componentCache.has(cacheKey)) {
            const cachedNames = this.componentCache.get(cacheKey)!
            return cachedNames.map(name => this.createUsingItem(name, autoImportComponents.get(name)!, 'vue-component'))
        }

        const usedComponents: string[] = []

        // 1. 匹配自闭合标签: <MyButton />, <my-card />
        const selfClosingPattern = /<([A-Za-z][A-Za-z0-9-_]*)[^>]*?\/>/g
        let match
        while ((match = selfClosingPattern.exec(template)) !== null) {
            const componentName = match[1]
            if (this.isLikelyComponent(componentName) && autoImportComponents.has(componentName)) {
                usedComponents.push(componentName)
            }
        }

        // 2. 匹配开始标签: <MyButton>, <my-card>
        const openTagPattern = /<([A-Za-z][A-Za-z0-9-_]*)[^>]*?(?!\/)>/g
        while ((match = openTagPattern.exec(template)) !== null) {
            const componentName = match[1]
            if (this.isLikelyComponent(componentName) && autoImportComponents.has(componentName)) {
                usedComponents.push(componentName)
            }
        }

        // 3. 匹配动态组件: <component :is="someComponent">
        const dynamicComponentPattern = /<component[^>]*?:is\s*=\s*["']([^"']+)["']/g
        while ((match = dynamicComponentPattern.exec(template)) !== null) {
            const componentName = match[1]
            if (autoImportComponents.has(componentName)) {
                usedComponents.push(componentName)
            }
        }

        // 去重
        const uniqueComponents = Array.from(new Set(usedComponents))

        // 缓存结果
        this.componentCache.set(cacheKey, uniqueComponents)

        // 创建 UsingItem
        uniqueComponents.forEach(componentName => {
            const autoImport = autoImportComponents.get(componentName)!
            usages.push(this.createUsingItem(componentName, autoImport, 'vue-component'))
        })

        return usages
    }

    /**
     * 提取模板中的变量使用
     */
    private extractVariableUsages(template: string, autoImportVariables: Map<string, AutoImportQuote>): UsingItem[] {
        const usages: UsingItem[] = []
        const cacheKey = template

        if (this.variableCache.has(cacheKey)) {
            const cachedNames = this.variableCache.get(cacheKey)!
            return cachedNames.map(name => this.createUsingItem(name, autoImportVariables.get(name)!, 'auto-import'))
        }

        const usedVariables: string[] = []

        // 1. 匹配插值表达式: {{ variableName }}
        const interpolationPattern = /\{\{\s*([^}]+?)\s*\}\}/g
        let match
        while ((match = interpolationPattern.exec(template)) !== null) {
            const expression = match[1].trim()
            const variableNames = this.extractVariableNamesFromExpression(expression)
            variableNames.forEach(name => {
                if (autoImportVariables.has(name)) {
                    usedVariables.push(name)
                }
            })
        }

        // 2. 匹配指令中的变量: v-if="showDialog", v-show="isVisible"
        const directivePattern = /v-[a-z-]+[^=]*=\s*["']([^"']+)["']/g
        while ((match = directivePattern.exec(template)) !== null) {
            const expression = match[1].trim()
            const variableNames = this.extractVariableNamesFromExpression(expression)
            variableNames.forEach(name => {
                if (autoImportVariables.has(name)) {
                    usedVariables.push(name)
                }
            })
        }

        // 3. 匹配事件处理器: @click="handleClick", @submit="handleSubmit"
        const eventPattern = /@[^=]+=\s*["']([^"']+)["']/g
        while ((match = eventPattern.exec(template)) !== null) {
            const expression = match[1].trim()
            const variableNames = this.extractVariableNamesFromExpression(expression)
            variableNames.forEach(name => {
                if (autoImportVariables.has(name)) {
                    usedVariables.push(name)
                }
            })
        }

        // 4. 匹配属性绑定: :class="{ active: isActive }"
        const bindingPattern = /:[^=]+=\s*["']([^"']+)["']/g
        while ((match = bindingPattern.exec(template)) !== null) {
            const expression = match[1].trim()
            const variableNames = this.extractVariableNamesFromExpression(expression)
            variableNames.forEach(name => {
                if (autoImportVariables.has(name)) {
                    usedVariables.push(name)
                }
            })
        }

        // 去重
        const uniqueVariables = Array.from(new Set(usedVariables))

        // 缓存结果
        this.variableCache.set(cacheKey, uniqueVariables)

        // 创建 UsingItem
        uniqueVariables.forEach(variableName => {
            const autoImport = autoImportVariables.get(variableName)!
            usages.push(this.createUsingItem(variableName, autoImport, 'auto-import'))
        })

        return usages
    }

    /**
     * 从表达式中提取变量名
     */
    private extractVariableNamesFromExpression(expression: string): string[] {
        const variableNames: string[] = []

        // 简单的变量名匹配 (可以根据需要扩展)
        const patterns = [
            // 函数调用: funcName(arg1, arg2)
            /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
            // 属性访问: object.property, object.method()
            /\b([A-Za-z_][A-Za-z0-9_]*)\s*\./g,
            // 简单变量名: variableName
            /\b([A-Za-z_][A-Za-z0-9_]*)\b/g
        ]

        patterns.forEach(pattern => {
            let match
            while ((match = pattern.exec(expression)) !== null) {
                const varName = match[1]
                // 过滤掉 JavaScript 关键字和常见的内置对象
                if (!this.isJavaScriptKeyword(varName) && !this.isBuiltInObject(varName)) {
                    variableNames.push(varName)
                }
            }
        })

        return Array.from(new Set(variableNames))
    }

    /**
     * 创建 UsingItem
     */
    private createUsingItem(name: string, autoImport: AutoImportQuote, type: 'vue-component' | 'auto-import'): UsingItem {
        return {
            source: autoImport.importPath,
            vars: autoImport.exportName,
            fullPath: autoImport.importPath,
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 0 }
            } as any,
            autoImport: true,
            autoImportType: type,
            autoImportName: name
        }
    }

    /**
     * 判断是否为组件名
     */
    private isLikelyComponent(name: string): boolean {
        // Vue 组件名通常以大写字母开头
        // 或者使用 kebab-case (my-button)
        return /^[A-Z]/.test(name) || /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(name)
    }

    /**
     * 转换为 kebab-case
     */
    private toKebabCase(str: string): string {
        return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
    }

    /**
     * 判断是否为 JavaScript 关键字
     */
    private isJavaScriptKeyword(word: string): boolean {
        const keywords = [
            'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
            'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
            'for', 'function', 'if', 'import', 'in', 'instanceof', 'let',
            'new', 'return', 'super', 'switch', 'this', 'throw', 'try',
            'typeof', 'var', 'void', 'while', 'with', 'yield'
        ]
        return keywords.includes(word)
    }

    /**
     * 判断是否为内置对象
     */
    private isBuiltInObject(word: string): boolean {
        const builtIns = [
            'console', 'window', 'document', 'Math', 'Date', 'Array', 'Object',
            'String', 'Number', 'Boolean', 'RegExp', 'Error', 'JSON', 'Promise'
        ]
        return builtIns.includes(word)
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.componentCache.clear()
        this.variableCache.clear()
    }
}