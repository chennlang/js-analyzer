import dagre from 'dagre'
import { IChartNode, IChartLink } from '@/types/chart'

export class ChartLayout {
    private g: dagre.graphlib.Graph
    constructor (nodes: IChartNode [], lines: IChartLink []) {
        const g = this.g = new dagre.graphlib.Graph()
        g.setGraph({})
        g.setDefaultEdgeLabel(function() { return {}; });

        nodes.forEach(node => {
            g.setNode(node.id, {
                ...node,
                width: node.symbolSize,
                height: node.symbolSize,
            })
        })
        
        lines.forEach(line => {
            g.setEdge(line.source, line.target);
        });
        
        dagre.layout(g, {
            rankdir: 'LR',
            align: 'LR',
            nodesep: 100
        })
    }

    nodes () {
        return this.g.nodes().map(v => this.g.node(v))
    }
    
    static init (nodes: IChartNode [], lines: IChartLink []) {
        return  new ChartLayout(nodes, lines)
    }
}

