import mitt from 'mitt'
import { CHART_VIEW_TYPE } from './echart'

type Events = {
    viewChange: CHART_VIEW_TYPE
}

export const chartEmitter = mitt<Events>()


