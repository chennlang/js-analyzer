import * as Echart from 'echarts'
import { getPackage } from '../../api/remote-data'
import { ImportDeps, ImportDepItem } from '@js-analyzer/core/types/index';

let instance: any

interface INode {
    name: string,
    value: number,
    symbolSize: number,
    itemStyle: any
    extendData: ImportDepItem
}


const getChartOption = (nodes: any): any => {
    return {
        animationDuration: 1500,
        animationEasingUpdate: 'quinticInOut',
        tooltip: {
            formatter: function (params: any) {
                // const data = params.data.extendData as IExtendData
                // if (!data) return ''
                // return `
                //     文件名：${data.name} <br />
                //     被引用：${data.num} 次 <br />
                //     路径：${data.sortPath} <br />
                // `
            }
        },
        series: [{
            name: 'Les Miserables',
            type: 'graph',
            layout: 'circular',
            data: nodes,
            links: [],
            roam: true,
            edgeSymbol: ['arrow', 'circle'],
            edgeSymbolSize: 6,
            label: {
                position: 'right',
                show: true,
                formatter: '{b}({c})'
            },
            itemStyle: {
                color: '#747d8c'
            },
            lineStyle: {
                width: 0.5,
                curveness: 0.3,
                opacity: 0.7,
                color: 'source',
            },
            emphasis: {
                focus: 'adjacency',
                lineStyle: {
                    width: 10
                }
            },
        }]
    }
}

const createNodes = (res: ImportDeps): INode [] => {
    const nodes: INode [] = []
    for (const name in res) {
        const symbolSize = res[name].num > 100 ? 100 : res[name].num + 10
        nodes.push({
            name,
            value: res[name].num,
            symbolSize,
            extendData: res[name],
            itemStyle: {
                color: symbolSize > 50 ? '#ff6b81' : '#747d8c'
            }
        })
    }
    return nodes
}

export function useChart (ref: HTMLElement | null) {
    if (!ref) throw 'chart ref is not exist!'

    instance = Echart.init(ref)
    getPackage().then(res => {
        const nodes = createNodes(res)
        const options = getChartOption(nodes)
        instance.setOption(options)
    })
    return {
        instance,
    }
}