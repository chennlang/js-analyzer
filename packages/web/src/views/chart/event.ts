import mitt from 'mitt'
import { CHART_VIEW_TYPE } from './echart'

type Events = {
    viewChange: CHART_VIEW_TYPE
    dataChange: {
        nodes: any,
        links: any,
    }
}

export const chartEmitter = mitt<Events>()


