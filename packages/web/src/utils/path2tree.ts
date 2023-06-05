// import ignore from 'ignore'

export interface ITreeListItem {
    label: string,
    value?: string,
    path: string,
    children?: ITreeListItem []
}

function isDir (item: object) {
    return JSON.stringify(item) !== '{}'
}


function joinTree (originPath: string, obj: any) {
    const pathList = originPath.split('/').filter(path => !!path)
    while(pathList.length){
        const currPath = pathList.shift() || ''
        if (obj[currPath]) {
            obj = obj[currPath]
        } else {
            obj = obj[currPath] = {}
        }
    }
}

/**
 * path2tree
 * from: ['src/', 'src/aaa']
 * to: { 'src/': { 'aaa': {} } }
 * @param {Array} pathList 
 * @param {String} rootPath 
 * @param {Array} ignores 
 * @returns 
 */
export function path2tree (pathList: string [], rootPath: string, ignores = []) {
    // const ig = ignore().add(ignores)
    const rootReg = new RegExp(rootPath)
    const tree = {}
    // const list = ig.filter(pathList)
    pathList.forEach(path => {
        const shortPath = path.replace(rootReg, '')
        joinTree(shortPath, tree)
    })
    return tree
}

/**
 * transform2List
 * from: { 'src': { 'aaa': {} } }
 * to: [{ label: 'src', children: [ { label: 'aaa' } ] }]
 * @param {Object} treeObj 
 * @param {Array} list 
 * @param {string} pPath 父级路径
 */
export function transform2List (treeObj: any, list: ITreeListItem [] = [], pPath: string) {
    const keys = Object.keys(treeObj)
    const fileKeys: string [] = []
    const dirKeys: string [] = []

    keys.forEach(key => {
        if (isDir(treeObj[key])) {
            dirKeys.push(key)
        } else {
            fileKeys.push(key)
        }
    })
    fileKeys.sort()
    dirKeys.sort()

    ;[...dirKeys, ...fileKeys].forEach(key => {
        const dir = isDir(treeObj[key])
        const path = pPath + '/' + key

        const item: ITreeListItem = {
            label: key,
            path: path,
        }

        if (dir) {
            item.children = []
        } else {
            item.value = ''
        }

        list.push(item)
        if (dir) {
            transform2List(treeObj[key], item.children || [], path)
        }
    })
}

/**
 * path list 2 JsonTree
 * @example
 * form:
 * [
 *  'a/a.js',
 *  'a/b.js'
 * ]
 * 
 * to:
 * [
 *  { label: 'a', path: '/a' children: [ { label: 'a.js', path: '/a/a.js' }, { label: 'b.js', path: '/a/b.js' } ] }
 * ]
 */
export default (pathList: string [], rootPath: string): ITreeListItem [] => {
    const treeObj = path2tree(pathList, rootPath)
    const list: ITreeListItem [] = []
    transform2List(treeObj, list, '')
    return list
}