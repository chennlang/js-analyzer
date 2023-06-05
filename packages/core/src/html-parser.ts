
import compiler from '@vue/compiler-dom'
import { NodeTypes } from '@vue/compiler-core'
import {  RootNode, TemplateChildNode, AttributeNode } from '@vue/compiler-dom'
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
        if (node.tag === 'img') {
            const imgSrc = node.props.find(attr => attr.name === 'src')
            if (imgSrc && (<AttributeNode>imgSrc).value && (<AttributeNode>imgSrc).value?.content) {
                importDeps.push({
                    source: (<AttributeNode>imgSrc).value?.content || '',
                    vars: 'html@src',
                    loc: node.loc
                })
                
            }
        }
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