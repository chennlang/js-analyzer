import { ExportDepItem, ImportDeps, ExportDeps } from '../types'

function addNum (obj: ExportDepItem, key: string, origin: string) {
    if (obj[key]) {
        obj[key].num += 1
        obj[key].using.push(origin)
    } else {
        obj[key] = {
            num: 1,
            using: [origin]
        }
    }
}

export default function injectExportQuoteNum (quoteMap: Record<string, ImportDeps>, exportMap: ExportDeps) {
    Object.keys(quoteMap).forEach(key => {
        const depMap = quoteMap[key]
        const files = Object.keys(depMap)
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const dep = depMap[file]

            dep.using.forEach(varItem => {
                const targetFile = exportMap[file]
                if (targetFile) {
                    const vars = varItem.vars.split(',')
                    vars.forEach(m => {
                        addNum(targetFile, m, varItem.fullPath as string)
                    })
                }
            })
        }
    })
}