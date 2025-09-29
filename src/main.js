import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from 'element-plus';
import zhCn from "element-plus/es/locale/lang/zh-cn";
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/index.css'
import router from "@/router/index.js";
import * as ElementPlusIconsVue from "@element-plus/icons-vue"
import * as request from "./util/request"
import * as echarts from "echarts"
import Echarts from 'vue-echarts'
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import AMapLoader from "@amap/amap-jsapi-loader";
import { library } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { fas,faUserSecret   } from "@fortawesome/free-solid-svg-icons"

import { createPinia } from "pinia" //引入pinia
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' //引入持久化插件



import "animate.css"

import { VAceEditor } from "vue3-ace-editor"
import ace from 'ace-builds'

// 使用 Vite 的资源 URL 映射，确保生产环境可用
import themeChromeUrl from 'ace-builds/src-noconflict/theme-chrome?url'
import modeJsonUrl from 'ace-builds/src-noconflict/mode-json?url'
import workerJsonUrl from 'ace-builds/src-noconflict/worker-json?url'
import extLanguageToolsUrl from 'ace-builds/src-noconflict/ext-language_tools?url'
import snippetsJsUrl from 'ace-builds/src-noconflict/snippets/javascript?url'
import snippetsSqlUrl from 'ace-builds/src-noconflict/snippets/sql?url'
import snippetsJsonUrl from 'ace-builds/src-noconflict/snippets/json?url'
import snippetsJavaUrl from 'ace-builds/src-noconflict/snippets/java?url'
import snippetsTextUrl from 'ace-builds/src-noconflict/snippets/text?url'

// 将模块名映射到打包后的实际 URL，避免运行时裸模块解析错误
ace.config.setModuleUrl('ace/theme/chrome', themeChromeUrl)
ace.config.setModuleUrl('ace/mode/json', modeJsonUrl)
ace.config.setModuleUrl('ace/mode/json_worker', workerJsonUrl)
ace.config.setModuleUrl('ace/ext/language_tools', extLanguageToolsUrl)
ace.config.setModuleUrl('ace/snippets/javascript', snippetsJsUrl)
ace.config.setModuleUrl('ace/snippets/sql', snippetsSqlUrl)
ace.config.setModuleUrl('ace/snippets/json', snippetsJsonUrl)
ace.config.setModuleUrl('ace/snippets/java', snippetsJavaUrl)
ace.config.setModuleUrl('ace/snippets/text', snippetsTextUrl)


library.add(fas,faUserSecret)

const pinia = createPinia() //创建pinia实例
pinia.use(piniaPluginPersistedstate) //将插件添加到 pinia 实例上

zhCn.el.pagination.total = "总共：" + `{total}` + "条"
zhCn.el.pagination.goto = "跳转至"

const app=createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.component('font-awesome-icon', FontAwesomeIcon)
app.component('v-ace-editor',VAceEditor)
app.config.globalProperties.$echarts = echarts
app.config.globalProperties.$http = request
app.use(pinia).use(AMapLoader).use(router).use(ElementPlus, { locale: zhCn }).mount("#app")
