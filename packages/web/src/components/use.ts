import mitt from 'mitt'

type Events = {
    expand: any,
    select: any,
}
type NodeId = string | number | symbol
const emitter = mitt<Events>()
const ALL_NODE_ID = Symbol('all')


// 展开或关闭 node
function expand (id: NodeId, val: boolean): void {
    emitter.emit('expand', { id, val })
}

function select (id: NodeId) {
    emitter.emit('select', { id })
}

const nodeMethods = {
    expand,
    select,
}

export {
    emitter,
    nodeMethods,
    ALL_NODE_ID
}