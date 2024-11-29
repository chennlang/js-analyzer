import * as Echart from 'echarts'
import { getPackage } from '../../api/remote-data'
import { ImportDeps, ImportDepItem } from '@js-analyzer/core/types/index';
import { $tf } from '@/language';

let instance: any

interface INode {
    name: string
    value: number
    // symbolSize: number,
    // itemStyle: any
    extendData: ImportDepItem & { name: string }
}

interface NodeResult {
    values: INode []
    names: string [] 
}

const getChartOption = ({ names, values }: NodeResult): any => {
    return {
        legend: {
            show: true,
            type: 'scroll',
            orient: 'vertical',
            textStyle: {
                color: '#999',
                // textBorderColor: '#fff',
                // textBorderWidth: 2,
            },
            left: 30,
            top: 20,
            bottom: 20,
            data: names
        },
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                const data = params.data.extendData
                if (!data) return ''
                return `
                    ${$tf('文件名')}:${data.name} <br />
                    ${$tf('被引用')}:${data.num} 次 <br />
                    ${$tf('占比')}:${params.percent}% <br />
                `
            }
        },
        series: [{
            name: $tf('包名'),
            type: 'pie',
            data: values,
            label: {
                show: true,
                position: 'right'
            },
            emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
        }]
    }
}

const createNodes = (res: ImportDeps): NodeResult => {
    const names: string [] = []
    const values: INode [] = []
    Object.keys(res).map(key => ({
        name: key,
        ...res[key],
    })).sort((a,b) => a.num - b.num).forEach(item => {
        const label = item.name + `（${item.num}）`
        names.push(label)
        values.push({
            name: label,
            value: item.num,
            extendData: {
                name: item.name,
                ...res[item.name]
            },
        })
    })
    return {
        names,
        values,
    }
    // const nodes: INode [] = []
    // for (const name in res) {
    //     const symbolSize = res[name].num > 100 ? 100 : res[name].num + 10
    //     nodes.push({
    //         name,
    //         value: res[name].num,
    //         symbolSize,
    //         extendData: res[name],
    //         itemStyle: {
    //             color: symbolSize > 50 ? '#ff6b81' : '#747d8c'
    //         }
    //     })
    // }
    // return nodes
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