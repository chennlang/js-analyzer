

const traverse = require("@babel/traverse").default;
const parser = require("@babel/parser");
import logger from '../logger'
const t = require('@babel/types');
import { ExportDepItem, UsingItem, FileDeps, Config } from '../types'

/**
 * js 文件解析器
 * @param {String} content js 文件 source
 * @returns importDeps 引用信息
 * @returns exportInfo 导出信息
 */
export default function scriptParser (content: string, file: string, config: Config):FileDeps  {
    // 收集依赖
    const importDeps: UsingItem [] = []
    const exportInfo: ExportDepItem = {}

    // 转为 AST 语法树
    const ast = parser.parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        presets: ['@babel/preset-env'],
        plugins: [
            
            ["decorators", { decoratorsBeforeExport: true }],
            'asyncGenerators',
            'bigInt',
            'classProperties',
            'classPrivateProperties',
            'classPrivateMethods',
            'legacy-decorators',
            'doExpressions',
            'dynamicImport',
            'exportDefaultFrom',
            'exportNamespaceFrom',
            'functionBind',
            'functionSent',
            'importMeta',
            'logicalAssignment',
            'nullishCoalescingOperator',
            'numericSeparator',
            'objectRestSpread',
            'optionalCatchBinding',
            'optionalChaining',
            ['pipelineOperator', { proposal: 'minimal' }],
            'throwExpressions',
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            'typescript',
            'jsx',
        ]
    })

    // custom plugins
    const plugins = config.plugins || []
    const scriptsPlugins = plugins.filter(p => p.ScriptParser)
    scriptsPlugins.forEach(plugin => {
        const opt = plugin.ScriptParser ? plugin.ScriptParser({
            file,
            content,
        }) : {}
        traverse(ast, opt)
        plugin.AfterScriptParser &&  plugin.AfterScriptParser()
    })

    traverse(ast, {
        // 静态 Import
        ImportDeclaration(tPath: any) {
            const { node } = tPath
            const vars = node.specifiers.map((specifier: any) => {
                switch (specifier.type) {
                    case 'ImportNamespaceSpecifier': {
                        // 引入的别名
                        // 例如：import * as api from '@/api', 获取到的就是 api
                        const specifierName = specifier.local.name
                        const binding = tPath.scope.getBinding(specifierName)

                        // 遍历使用别名的地方
                        const localVars = binding.referencePaths.map((referencePath: any)=> {
                            // 没有引用别名的地方
                            if (referencePath.parentPath.node && referencePath.parentPath.node.property) {
                                return referencePath.parentPath.node.property.name
                            }
                            return undefined
                        });
                        return localVars.filter(Boolean).join(',')
                    }
                    case 'ImportDefaultSpecifier': {
                        return 'Default'
                    }
                    case 'ImportSpecifier': {
                        return specifier.imported.name
                    }
                }
            })
            importDeps.push({
                source: node.source.value,
                vars: vars.join(','),
                loc: node.loc,
            })
        },
        // export
        ExportNamedDeclaration(tPath: any) {
            // export { a,b,c }
            if (tPath.node.specifiers.length) {
                tPath.node.specifiers.forEach((item: any) => {
                    exportInfo[item.local.name] = {
                        num: 0,
                        using: []
                    }
                })
            } else { // export const a = 'aaa' / export function a
                if (!tPath.node.declaration) {
                    logger.info('unknown export: ' + file)
                    return
                }
                if (tPath.node.declaration.id) {
                    exportInfo[tPath.node.declaration.id.name] = {
                        num: 0,
                        using: []
                    }
                } else if (tPath.node.declaration.declarations){
                    tPath.node.declaration.declarations.forEach((item: any) => {
                        exportInfo[item.id.name] = {
                            num: 0,
                            using: []
                        }
                    })
                } else {
                    logger.info('unknown export: ' + file)
                }
            }
        },
        // export default
        ExportDefaultDeclaration() {
            exportInfo['Default'] = {
                num: 0,
                using: []
            }
        },
        // require | 动态 Import
        CallExpression(tPath: any) {
            const node = tPath.node
            if (node.callee.type === 'Import' && node.arguments[0].value) {
                importDeps.push({
                    source: node.arguments[0].value,
                    vars: 'Default',
                    loc: node.loc
                })
            }
            if (
                node.callee &&
                node.callee.name === 'require'
                && node.arguments[0]
                && node.arguments[0].value
            ) {
                importDeps.push({
                    source: node.arguments[0].value,
                    vars: 'requireDefault',
                    loc: node.loc
                })
            }
        },
        // module.exports
        AssignmentExpression(tPath: any) {
            const node = tPath.node
            const { left } = node
            // module.exports = {} || module.exports.x = xxx
            if (
                (
                    t.isMemberExpression(left) &&
                    left.object.name === 'module' &&
                    left.property.name === 'exports'
                ) ||
                (
                    t.isMemberExpression(left) &&
                    left.object.object &&
                    left.object.object.name === 'module' &&
                    left.object.property.name === 'exports'
                )
            ) {
                exportInfo['Default'] = {
                    num: 0,
                    using: []
                }
            }
        }
    })

    return {
        importDeps: importDeps,
        exportInfo: exportInfo
    }
}