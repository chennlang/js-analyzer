import $ from 'jquery'
import * as EChart from 'echarts'
import { getImport } from '../../api/remote-data'
import { IChartExtendData, IChartNode, IChartLink } from '@/types/chart'
import { ImportDeps, UsingItem} from '@js-analyzer/core/types/index';
import { chartEmitter } from './event'
import { $tf } from '@/language';


const ID_PATH_MAP: Record<string, string> = {} // path ---> id
let instance: EChart.ECharts | null
let origin_nodes: IChartNode []
let origin_links: IChartLink []
let active_file = ''

export enum CHART_VIEW_TYPE {
    file = 1, // 单文件文件被依赖视图
    fileReversal = 2, // 单文件依赖视图
    fileRelation = 3, // 单文件上游关系图
    folder = 4, // 文件夹依赖图
    json = 5, // Json 视图
}

export const VIEW_NAME_MAP  = {
    [CHART_VIEW_TYPE.file]: $tf('被依赖视图'),
    [CHART_VIEW_TYPE.fileReversal]: $tf('依赖视图'),
    [CHART_VIEW_TYPE.fileRelation]: $tf('上游依赖图'),
    [CHART_VIEW_TYPE.folder]: $tf('文件夹关系图'),
    [CHART_VIEW_TYPE.json]: 'JSON',
} 

// generate uid
function guid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }
    return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4()
}

// generate random number
function random (min: number, max: number) {
    return Math.random()*(max-min+1)+min
}

function dealStream (data: any, fns: ((data: any) => any) []) {
    let result = data
    while(fns.length) {
        const fn = fns.shift()
        result = fn && fn(result)
    }
    return result
}

// generate echart id
function createId (fullPath: string) {
  const id = guid()
  ID_PATH_MAP[fullPath] = id
  return id
}


function scaleNodeSize (nodes: IChartNode []) {
    const limit = 150
    const max = Math.max(...nodes.map(node => node.extendData.num))
    const base = max > 5 ? 5 : 1
    
    
    nodes.forEach(node => {
        const num = node.extendData.num

        // 太大看不见
        if (num > limit) {
            node.symbolSize = limit
        }

        // 太小看不见
        if (num < base) {
            node.symbolSize = base
        }

        // node.label.show = true
        // node.name = node.extendData.fullPath.split('/').slice(-2).join('/')
    })

    return nodes
}

function clipNodesLength (nodes: IChartNode [], max: number = 100) {
    return nodes.sort((a,b) => b.extendData.num - a.extendData.num).slice(0, max)
}

// 高亮节点
function setActiveNode (nodes: IChartNode [], id: string, options: any) {
    options.series[0].label.formatter = '{b} ({@value})'
    options.series[0].circular.rotateLabel = false
    nodes.forEach(node => {
        if (node.id === id) {
            node.itemStyle = {
                color: '#FF5F5F'
            }
        } 
        node.label.show = true
        node.name = node.extendData.fullPath.split('/').slice(-1).join('/')
    })
}

/**
 * 获取关联的节点列表
 * @param fullPath 
 * @param imports 
 * @param idMap 
 * @returns 
 */
function getRelationNodeIds (fullPath: string, imports: ImportDeps, idMap: Record<string, string>) {
    const paths = new Set([fullPath])
    const targetUsing  = imports[fullPath].using || []
    const marks: Record<string, boolean> = {}

    const dfs = (using: UsingItem []) => {
        using.forEach(use => {
            if (use.fullPath) {
                paths.add(use.fullPath)
                if (imports[use.fullPath] && imports[use.fullPath].using) {
                    if (!marks[use.fullPath]) {// 标记已经扫描过的节点
                        marks[use.fullPath] = true
                        dfs(imports[use.fullPath].using)
                    }
                }
            }
        })
    }
    dfs(targetUsing)

    return Array.from(paths).map(path => idMap[path])
}


// generate echart node color
function getColorByFileType (fileName: string = '') {
    const ext = fileName.split('.').pop() || 'default'
    const extColorMap: Record<string, string> = {
        'json,js': '#f1c40f',
        'ts': '#4b8aa7',
        'vue': '#8dc149',
        'less,scss': '#5199b9',
        'html,sh,md': '#c76c32',
        'svg,png,jpg,gif,webp,jpeg': '#997eb6',
        'default': '#595959'
    }
    const target = Object.keys(extColorMap).find(keys => keys.split(',').some(key => key === ext)) || 'default'
    return extColorMap[target]
}

// generate EChart nodes
function createNodes (map: ImportDeps) {
    const list: IChartNode[] = []
    Object.keys(map).forEach(file => {
        const fileName = file.split('/').pop() || ''
        const chartValue = map[file].num
        list.push({
            id: createId(file),
            name: fileName || $tf('默认'),
            value: map[file].num,
            symbolSize: chartValue,
            category: 0,
            itemStyle: {
                color: getColorByFileType(fileName)
            },
            label: {
                show: map[file].num > 10
            },
            extendData: {
                ...map[file],
                fullPath: file,
                sortPath: file.replace(window.CONFIG.root, ''),
                name: fileName,
                ext: fileName.split('.').pop(),
                num: map[file].num
            },
        })
    })
    return list
}

// generate EChart links
function createLinks (nodes: IChartNode[], ID_PATH_MAP: Record<string, string>) {
    const list: IChartLink [] = []
    nodes.forEach(node => {
        const quoteList = node.extendData.using
        quoteList.forEach(item => {
            if (item.fullPath && ID_PATH_MAP[item.fullPath]) {
                list.push({
                    source: ID_PATH_MAP[item.fullPath],
                    target: node.id
                })
            }
        })
    })
    return list
}

interface OptionConfig  {
    layout?: 'none' | 'circular' | 'force',
    labelFormatter?: '{@value}' | '{b}' | ''
    draggable?: boolean
}
// get EChart options
function getChartOption (nodes: IChartNode[], links: IChartLink [], o?: OptionConfig): any {
    const config = Object.assign({
        layout: 'circular',
        labelFormatter: '{@value}',
        draggable: false
    }, o || {})

    return {
        animationDuration: 1500,
        animationEasingUpdate: 'quinticInOut',
        tooltip: {
            formatter: function (params: any) {
                const data = params.data.extendData as IChartExtendData
                if (!data) return ''
                return `
                    ${$tf('文件名')}: ${data.name} <br />
                    ${$tf('被引用')}: ${data.num} <br />
                    ${$tf('路径')}: ${data.sortPath}% <br />
                `
            }
        },
        series: [{
            name: $tf('依赖分析视图'),
            type: 'graph',
            layout: config.layout,
            draggable: config.draggable,
            data: nodes,
            links: links,
            roam: true,
            edgeSymbol: ['arrow', 'circle'],
            circular: {
                rotateLabel: true
            },
            force: {
                repulsion: 100,
                gravity: 0.01,
                edgeLength: [30, 100],
                friction: 0.8,
                initLayout: 'circular',
            },
            edgeSymbolSize: 6,
            label: {
                position: 'right',
                show: true,
                formatter: config.labelFormatter,
                color: '#95a5a6'
            },
            lineStyle: {
                width: 0.5,
                curveness: 0.3,
                opacity: 0.7,
                color: '#bdc3c7',
            },
            emphasis: {
                focus: 'adjacency',
                lineStyle: {
                    width: 10
                },
            },
        }]
    }
}


/**
 * 单个文件依赖关系图
 * @param file 文件路径
 * @param reversal 是否依赖反转
 */
export function updateChartByFile (file: string, reversal = true) {
    active_file = file
    const filterIds: string [] = []
    const node = origin_nodes.find(node => node.extendData.fullPath.indexOf(file) > -1)

    if (!node) {
        return
    }
    
    function addId (id: string) {
        if (filterIds.indexOf(id) === -1) {
            filterIds.push(id)
        }
    }

    if (node) {
        filterIds.push(node.id)
        origin_links.forEach(link => {
            if (link.source === node.id || link.target === node.id) {
                if (reversal) {
                    addId(link.source)
                } else {
                    addId(link.target)
                }
            }
        })
    }
    
    const localNodes = origin_nodes.filter(n => filterIds.includes(n.id))
    const newNodes: IChartNode [] = JSON.parse(JSON.stringify(localNodes))
    const options = getChartOption(newNodes, origin_links)

    setActiveNode(newNodes, node.id, options)
    updateChartOption(options)
}

/**
 * 上游依赖关系全路径视图
 * @param path 相对路径
 */
export function updateChartToRelationView (sortPath: string) {
    const node = origin_nodes.find(node => node.extendData.fullPath.indexOf(sortPath) > -1)
    if (!node) return

    // 布局
    getImport().then(res => {
        const relationIds = getRelationNodeIds(node.extendData.fullPath, res, ID_PATH_MAP)
        const relationNodes = origin_nodes.filter(n => relationIds.includes(n.id))
        const relationLines = origin_links.filter(l => relationIds.some(id => id === l.source || id === l.target))
        const newNodes = JSON.parse(JSON.stringify(relationNodes))
        scaleNodeSize(newNodes)

        const options = getChartOption(newNodes, relationLines, {
            layout: 'force',
            labelFormatter: '',
        })

        setActiveNode(newNodes, node.id,  options)
        updateChartOption(options)
    })
}

/**
 * 文件夹视图
 * @param path 相对路径
 */
export function updateChartByFolder (sortPath: string) {
    let nodes: IChartNode []
    if (sortPath === '/') {
        nodes = origin_nodes
    } else {
        nodes = origin_nodes.filter(node => node.extendData.sortPath.indexOf(sortPath) === 0)
    }
    
    const newNodes: IChartNode [] = dealStream(nodes, [
        (data) => JSON.parse(JSON.stringify(data)),
        // 性能问题，限制最多展示 100 个
        (data) => clipNodesLength(data, 200),
        scaleNodeSize,
    ])

    const options = getChartOption(newNodes, origin_links)
    updateChartOption(options)
}




function updateChartOption (option: any) {
    instance?.clear()
    instance?.setOption(option, {
        replaceMerge: ['xAxis', 'yAxis', 'series'],
        notMerge: true
    })
    if (option.series && Array.isArray(option.series) && option.series[0]) {
        chartEmitter.emit('dataChange', {
            nodes: option.series[0].data.map((item: any) => item.extendData),
            links: option.series[0]!.links,
        })
    }
}

/**
 * 切换 label 是否显示
 */
export function switchChartLabel () {
    const option = instance?.getOption() ?? {}
    if (option.series && Array.isArray(option.series) && option.series[0]) {
        const old = option.series[0].label.show
        option.series[0].label.show = !old
        option.series[0].data.forEach((node: any) => {
            node.label.show = !old
        })
    }

    instance?.setOption(option)
}

/**
 * 切换视图
 * @param type 模式
 * @param sortPath 相对路径
 */
export function switchChartView (type: CHART_VIEW_TYPE, sortPath: string = active_file) {
    chartEmitter.emit('viewChange', type)
    active_file = sortPath
    switch (type) {
        case CHART_VIEW_TYPE.file:
            updateChartByFile(sortPath, true)
            break;
        case CHART_VIEW_TYPE.fileReversal:
            updateChartByFile(sortPath, false)
            break;
        case CHART_VIEW_TYPE.fileRelation:
            updateChartToRelationView(sortPath)
            break;
        case CHART_VIEW_TYPE.folder:
            updateChartByFolder(sortPath)
            break;
    }
}

/**
 * 获取当前文件/路径
 * @returns string
 */
export function getActiveFile () {
    return active_file
}

// chart resize
$(window).on('resize', () => {
    instance?.resize()
})

// resize
export function resize () {
    instance?.resize()
}

// 重置视图
export function restoreChart () {
    // const op = instance?.getOption()
    // op && instance?.setOption(op)
    instance?.dispatchAction({
        type: 'restore',
    })
}

// 自适应视图
export function reRoomChart () {
    instance?.dispatchAction({
        type: 'dataZoom',
        start: 0, // 设置为原始状态的起始位置
        end: 100,  // 设置为原始状态的结束位置
        xAxisIndex: 0, // 如果有多个 x 轴，需要指定 x 轴的索引
        yAxisIndex: 0  // 如果有多个 y 轴，需要指定 y 轴的索引
    })
}

export function useChart (ref: HTMLElement | null) {
    if (!ref) throw 'chart ref is not exist!'
    
    instance = EChart.init(ref, undefined, {
        renderer: 'canvas',
    })

    const init = getImport().then(res => {
        const nodes = origin_nodes = createNodes(res)
        origin_links = createLinks(nodes, ID_PATH_MAP)
    })
    return {
        init,
        instance,
        updateChartByFile
    }
}