import $ from 'jquery'
import * as EChart from 'echarts'
import { getImport } from '../../api/remote-data'
import { IChartExtendData, IChartNode, IChartLink } from '@/types/chart'
import { ImportDeps, UsingItem} from '@js-analyzer/core/dist/js-analyzer-core.d';
import { ChartLayout } from './layout'
import { chartEmitter } from './event'


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
}

export const VIEW_NAME_MAP  = {
    [CHART_VIEW_TYPE.file]: '被依赖视图',
    [CHART_VIEW_TYPE.fileReversal]: '依赖视图',
    [CHART_VIEW_TYPE.fileRelation]: '上游依赖图',
    [CHART_VIEW_TYPE.folder]: '文件夹关系图',
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

// generate echart id
function createId (fullPath: string) {
  const id = guid()
  ID_PATH_MAP[fullPath] = id
  return id
}


function scaleNodeSize (nodes: IChartNode []) {
    const limit = 600
    const base = 10
    const top10 = nodes.map(n => n.extendData.num).sort((a,b) => b-a).slice(0,10)
    
    
    nodes.forEach(node => {
        const num = node.extendData.num
        if (num > limit) {
            node.symbolSize = limit
        }
        if (num < 50) {
            node.symbolSize = base + num
        }

        // if (top10.includes(num)) {
        //     node.label.show = true
        //     node.name = node.extendData.fullPath.split('/').slice(-2).join('/')
        // } else {
        //     node.label.show = false
        // }
        node.label.show = true
        node.name = node.extendData.fullPath.split('/').slice(-2).join('/')
    })
}

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
            name: fileName || '默认',
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
    layout?: 'none' | 'circular',
    labelFormatter?: '{@value}' | '{b}'
}
// get EChart options
function getChartOption (nodes: IChartNode[], links: IChartLink [], o?: OptionConfig): any {
    const config = Object.assign({
        layout: 'circular',
        labelFormatter: '{@value}',
    }, o || {})

    return {
        animationDuration: 1500,
        animationEasingUpdate: 'quinticInOut',
        tooltip: {
            formatter: function (params: any) {
                const data = params.data.extendData as IChartExtendData
                if (!data) return ''
                return `
                    文件名：${data.name} <br />
                    被引用：${data.num} 次 <br />
                    路径：${data.sortPath} <br />
                `
            }
        },
        series: [{
            name: '依赖分析视图',
            type: 'graph',
            layout: config.layout,
            data: nodes,
            links: links,
            roam: true,
            edgeSymbol: ['arrow', 'circle'],
            circular: {
                rotateLabel: true
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
    instance?.setOption(options)
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
        const layoutNodes = ChartLayout.init(JSON.parse(JSON.stringify(newNodes)), relationLines).nodes().filter(Boolean)
        const options = getChartOption(layoutNodes as any, relationLines, {
            layout: 'none',
            labelFormatter: '{b}'
        })

        setActiveNode(layoutNodes as any, node.id,  options)
        instance?.clear()
        instance?.setOption(options)
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
    
    const newNodes: IChartNode [] = JSON.parse(JSON.stringify(nodes))

    scaleNodeSize(newNodes)
    const links = origin_links
    const options = getChartOption(newNodes, links)
    instance?.clear()
    instance?.setOption(options)
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
    instance?.dispatchAction({
        type: 'restore',
    })
}

// 自适应视图
export function reRoomChart () {
    instance?.dispatchAction({
        type: 'dataZoom',
        start: 20,
        end: 30,
    })
}

export function useChart (ref: HTMLElement | null) {
    if (!ref) throw 'chart ref is not exist!'
    
    instance = EChart.init(ref)

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