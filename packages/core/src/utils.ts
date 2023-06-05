const del = require('del')
const fs = require('fs')
const path = require("path")
import logger from '../logger'


export function isObject (v: unknown) {
    return Object.prototype.toString.call(v) === '[object Object]'
}

// function isArray (v: unknown) {
//     return Object.prototype.toString.call(v) === '[object Array]'
// }

/**
 * 写入文件
 * @param {String} name 文件名
 * @param {String} data 文件内容
 */
 export function writeFile(name: string, data: any, outputPath: string | undefined) {
    if (!outputPath) {
        throw new Error('outputPath must be in the config file')
    }
    !fs.existsSync(outputPath) && fs.mkdirSync(outputPath)
    // logger.info('文件写入中：' + name)
    // 修复：data 过长导致 JSON.stringify 报错
    // if (isArray(data)) {
    //     data = '[' + data.map((m: any) => JSON.stringify(m, null, 2)).join(",")  +']'
    // }
    fs.writeFile(path.resolve(outputPath, name), JSON.stringify(data, null, 2), 'utf-8', (error: any) => {
        if (error) logger.error(`write：写入文件失败 ${name}`)
    })
}

/**
 * 清理文件
 */
export async function clearDist(outputPath: string | undefined) {
    // logger.info('清除文件...：' + outputPath)
    if (fs.existsSync(outputPath)) {
        await del.sync([`${outputPath}/**`, '!publicDir'], {
            force: true
        })
    }
}