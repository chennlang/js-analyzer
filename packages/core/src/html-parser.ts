
import compiler from '@vue/compiler-dom'
import { NodeTypes } from '@vue/compiler-core'
import {  RootNode, TemplateChildNode } from '@vue/compiler-dom'
import { ExportDepItem, UsingItem, Config } from '../types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function htmlParser (html: string, _file: string, _config: Config) {
    // 收集依赖
    const importDeps: UsingItem [] = []
    const exportInfo: ExportDepItem = {}

    const { parse, transform } = compiler
    
    const visitor = (node: RootNode | TemplateChildNode) => {
        if (node.type !== NodeTypes.ELEMENT) {
            return
        }
        node.props.forEach(attr => {
            if (['img'].includes(node.tag) && 'value' in attr && attr.name === 'src') { // eg: src="../xxx.png"
                    importDeps.push({
                    source: attr.value?.content || '',
                    vars: 'html@src',
                    loc: node.loc
                })
            }

            if ('exp' in attr && attr.exp && 'content' in  attr.exp) { // eg: :src="require('./xxx.png')"
                const match = attr.exp.content.match(/require\(['"].+['"]\)/g) // ['require('a')', 'require('b')']
                match?.forEach(item => {
                    importDeps.push({
                        source: item.match(/require\(['"](.+)['"]\)/)?.[1] ?? '',
                        vars: 'html@src',
                        loc: node.loc
                    })
                })
            }
        })
    }

    const ast = parse(html, { comments: true })
    transform(ast, {
        nodeTransforms: [visitor]
    })

    return {
        importDeps,
        exportInfo
    }
}