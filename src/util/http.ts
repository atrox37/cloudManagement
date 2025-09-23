import axios from 'axios';
import router from '../router/index'
import { ElMessage } from 'element-plus'

axios.defaults.headers.head['Content-Type'] = 'application/json;charset=utf-8'
axios.defaults.timeout = 10000
//请求拦截器
axios.interceptors.request.use(config => {
    config.headers = config.headers || {}
    const token=window.sessionStorage.getItem('token')
    if(config.url == '/api/sys-app/login'||config.url == '/api/sys-app/common/captcha64'){
        config.headers.LOGINTYPE = 'PASS'
    }else{
        if(token){
            config.headers.Authorization = token
        }
    }
    return config
},error => {
    console.log('http:error')
})

axios.interceptors.response.use(function (response) {
    console.log('reject--->'+response.status)
    if(response.status == 401){
        router.replace({
            path:'/login'
        })
    }else{
        return response;
    }
},function (error) {
    console.log('reject turn')
    return Promise.reject(error)
})

export function post(url: string,params: any){
    return new Promise((resolve, reject) => {
        let paramsStr: any=undefined;
        if(params!=null){
            paramsStr=JSON.stringify(params)
            console.log(`requestData: ${ paramsStr }`)

        }
        axios.post(url,params).then(res => {
            resolve(res.data)
        }).catch(error => {
            if(error.response!=undefined
                &&error.response.data!=undefined
                &&error.response.data.msg!=undefined){
                ElMessage(error.response.data.msg)
            }else if(error.message!=undefined){
                ElMessage(error.message)
            }
            if (error.response!=undefined
                &&error.response.status == 401){
                router.replace({
                    path:'/login'
                })
            }else if(error.response!=undefined
                &&error.response.data != undefined){
                reject(error.response.data)
            }else if(error.response==undefined
                &&error.message != undefined){
                reject(error.message)
            }

        })

    })
}

export function postHeader(url: string,params: any,header: any){
    return new Promise((resolve, reject) => {
        axios.post(url,params,{headers:header}).then(res => {
            resolve(res.data)
        }).catch(error => {
            if(error.response.data.msg!=undefined){
                ElMessage(error.response.data.msg)
            }else if(error.message!=undefined){
                ElMessage(error.message)
            }
            if (error.response.status == 401){
                router.replace({
                    path:'/login'
                })
            }else{
                reject(error.response.data)
            }
        })

    })
}

export function get(url: string,p: any) {
    return new Promise((resolve,reject) => {
        console.log(`发送get请求${url}`)
        axios.get(url,p?{params: p}:{params: {}}).then(res=>{
            resolve(res.data)
        }).catch(error => {
            if(error.response.data.msg!=undefined){
                ElMessage(error.response.data.msg)
            }else if(error.message!=undefined){
                ElMessage(error.message)
            }
            if (error.response.status == 401){
                router.replace({
                    path:'/login'
                })
            }else{
                reject(error.response.data)
            }
        })
    })
}
