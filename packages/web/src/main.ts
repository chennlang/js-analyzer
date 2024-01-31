import App from './App.vue'
import router from './router'
import { createApp } from 'vue'
import './css/index.less'
import './css/iconfont/iconfont.css'
import IconBtn from './components/icon-btn.vue'
import 'highlight.js/styles/stackoverflow-light.css'
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import hljsVuePlugin from "@highlightjs/vue-plugin";

const app = createApp(App)
app.use(router)
app.use(hljsVuePlugin)
app.mount('#app')
app.component('IconBtn', IconBtn)