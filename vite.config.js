import { fileURLToPath, URL } from 'node:url'

import { defineConfig,loadEnv  } from 'vite'
import vue from '@vitejs/plugin-vue'
import commonjs from '@rollup/plugin-commonjs'
import {useRouter} from "vue-router";


export default (({mode})=>{
  return defineConfig({
    base: "./",
    plugins: [
      useRouter(),vue(),commonjs()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        "~": fileURLToPath(new URL('./node_modules', import.meta.url)),
      }
    },
    css:{
      preprocessorOptions:{
        scss: {
          silenceDeprecations: ['legacy-js-api'],
          additionalData: `@use "@/scss/gload.scss";`
        }
      }
    },
    server:{
      host: ['0.0.0.0'],
      port: Number(loadEnv(mode, process.cwd()).VITE_APP_PORT),
      https: false,
      proxy: {
        '/api':{
          target: 'http://'+loadEnv(mode, process.cwd()).VITE_APP_URL,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, '')
        }
      }
    }

  })
})
