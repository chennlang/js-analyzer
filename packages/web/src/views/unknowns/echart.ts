import * as Echart from 'echarts'
import { getUnknown } from '../../api/remote-data';
import { ImportDeps, ImportDepItem } from '@js-analyzer/core/types/index';

let instance: any

interface INode {
    name: string
    value: number
    extendData: ImportDepItem & { name: string }
}

const getChartOption = (nodes: INode []): any => {
    return {
        title: {
          text: '隐式引用',
          subtext: '引用源未注册到项目中',
          top: 'center',
          left: 'center'
        },
        tooltip: {},
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [
          {
            name: 'Les Miserables',
            type: 'graph',
            layout: 'circular',
            circular: {
              rotateLabel: true
            },
            data: nodes,
            links: [],
            categories: [],
            roam: true,
            label: {
              show: true,
              position: 'right',
              formatter: '{b}{@value}'
            },
            lineStyle: {
              color: 'source',
              curveness: 0.3
            }
          }
        ]
      }
}

const createNodes = (res: ImportDeps): INode [] => {
    return Object.keys(res).map(key => ({
        name: key.replace(window.CONFIG.root, ''),
        value: res[key].num,
        extendData: {
            ...res[key],
            name: key,
        }
    }))
}

export function useChart (ref: HTMLElement | null) {
    if (!ref) throw 'chart ref is not exist!'

    instance = Echart.init(ref)
    getUnknown().then(res => {
        const nodes = createNodes(res)
        const options = getChartOption(nodes)
        instance.setOption(options)
    })
    return {
        instance,
    }
}