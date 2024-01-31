import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import FileChart from '@/views/chart/index.vue'
import PackageChart from '@/views/packages/index.vue'
import UnknownChart from '@/views/unknowns/index.vue'
import HotWord from '@/views/words/index.vue'

const routes: RouteRecordRaw [] = [
    {
        path: '/',
        redirect: '/chart'
    },
    {
        path: '/chart',
        name: 'FileChart',
        component: FileChart
    },
    {
        path: '/packages',
        name: 'PackageChart',
        component: PackageChart
    },
    {
        path: '/unknowns',
        name: 'UnknownChart',
        component: UnknownChart
    },
    {
        path: '/words',
        name: 'HotWord',
        component: HotWord
    },
]

const router = createRouter({
    routes,
    history: createWebHashHistory()
})

let historyQueue: any [] = []

router.beforeEach((to, from, next) => {
    if (to.name === 'FileChart' && to.query.file) {
        historyQueue.push(to.query.file)
    } else {
        historyQueue = []
    }
    to.meta.historyQueue = historyQueue
    next()
})

export default router