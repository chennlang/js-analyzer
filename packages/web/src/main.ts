import App from './App.vue'
import router from './router'
import { createApp } from 'vue'
import './css/index.less'
import './css/iconfont/iconfont.css'
import IconBtn from './components/icon-btn.vue'

const app = createApp(App)
app.use(router)
app.mount('#app')
app.component('IconBtn', IconBtn)

//c b a a c d c c d c