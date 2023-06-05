import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import FileChart from '@/views/file-chart/index.vue'
import PackageChart from '@/views/package-chart/index.vue'
import UnknownChart from '@/views/unknown-chart/index.vue'
import Code from '@/views/code.vue'
import HotWord from '@/views/hot-word/index.vue'

const routes: RouteRecordRaw [] = [
    {
        path: '/',
        redirect: '/file-chart'
    },
    {
        path: '/file-chart',
        name: 'FileChart',
        component: FileChart
    },
    {
        path: '/package-chart',
        name: 'PackageChart',
        component: PackageChart
    },
    {
        path: '/unknown-chart',
        name: 'UnknownChart',
        component: UnknownChart
    },
    {
        path: '/hot-word',
        name: 'HotWord',
        component: HotWord
    },
    {
        path: '/code',
        name: 'Code',
        component: Code
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