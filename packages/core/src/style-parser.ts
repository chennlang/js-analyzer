
/**
 * doc
 * https://astexplorer.net/#/2uBU1BLuJ1
 * https://www.postcss.com.cn/api/#atrule-type
 */
const postcss = require('postcss')
const postcssLess = require('postcss-less')
const postcssSass = require('postcss-sass')
const postcssScss = require('postcss-scss')

import { ExportDepItem, UsingItem, Config } from '../types'

type Lang = 'css' | 'scss' | 'less' | 'sass'
/**
 * 
 * @param {String} content js 文件 source
 * @returns importDeps 引用信息
 * @returns exportInfo 导出信息
 */
// @ts-ignore
const parserRules = {
    'background': (val: string) => {
        const res = val.match(/url\((.+)\)/i)
        return res ? res[1] : null
    },
    'background-image': (val: string) => {
        const res = val.match(/url\((.+)\)/i)
        return res ? res[1] : null
    },
}

const getParser = (lang: Lang): any => {
    switch(lang){
        case 'css':
            return postcss.parse
        case 'less':
            return postcssLess.parse
        case 'sass':
            return postcssSass.parse
        case 'scss':
                return postcssScss.parse
        default:
            return postcss.parse
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
 export default function styleParser (content: string, lang: Lang = 'css', _config: Config) {
    // 收集依赖
    const importDeps: UsingItem [] = []
    const exportInfo: ExportDepItem = {}
    const parser = getParser(lang)
    const root = parser(content);

    // rule
    root.walkRules((rule: any) => {
        rule.nodes.forEach((node: any) => {
            const prop = node.prop as keyof typeof parserRules
            if (parserRules[prop]) {
                const path = parserRules[prop](node.value)
                path && importDeps.push({
                    source: path,
                    vars: 'css@background',
                    loc: node.loc
                })
            }
        })
    })

    // at root
    root.walkAtRules((rule: any) => {
        if (rule.name === 'import') {
            importDeps.push({
                source: rule.params.replace(/['"]/g, ''),
                vars: 'css@import',
                loc: {}
            })
        }
    })

    return {
        importDeps,
        exportInfo
    }
 }