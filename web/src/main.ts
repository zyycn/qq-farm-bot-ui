import AntdvNext from 'antdv-next'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'
import './style.css'
import 'antdv-next/dist/reset.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(AntdvNext)

app.mount('#app')
