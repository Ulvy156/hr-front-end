import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { setupVeeValidate } from './plugins/vee-validate'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

setupVeeValidate()

app.use(pinia)
app.use(router)

app.mount('#app')
