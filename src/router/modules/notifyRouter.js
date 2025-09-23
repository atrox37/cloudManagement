
const notifyRouter={
    path: "/notify",
    name: "通知组件",
    component: ()=>import('@/views/Index.vue'),
    redirect: {path: '/notifyConfigPage'},
    children:[
        {
            path: "/notifyConfigPage",
            name: "通知列表",
            component: () => import("@/views/notify/NotifyPage.vue")
        },
        {
            path: "/notifyAdd",
            name:"通知配置",
            component: () => import("@/views/notify/add/AddNotifyConfig.vue")
        },
        {
            path: "/notifyTemplatePage",
            name: "通知模板",
            component: () => import("@/views/notify/NotifyTemplatePage.vue")
        },
        {
            path: "/notifyTemplateInfo",
            name: "模板详情",
            component: () => import("@/views/notify/template/NotifyTemplateInfo.vue")
        }
    ]
}

export default notifyRouter;
