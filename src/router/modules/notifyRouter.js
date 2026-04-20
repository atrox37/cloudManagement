
const notifyRouter={
    path: "/notify",
    name: "notifyGroup",
    component: ()=>import('@/views/Index.vue'),
    redirect: {path: '/notifyConfigPage'},
    children:[
        {
            path: "/notifyConfigPage",
            name: "notifyList",
            component: () => import("@/views/notify/NotifyPage.vue")
        },
        {
            path: "/notifyAdd",
            name:"notifyAdd",
            component: () => import("@/views/notify/add/AddNotifyConfig.vue")
        },
        {
            path: "/notifyTemplatePage",
            name: "notifyTemplateList",
            component: () => import("@/views/notify/NotifyTemplatePage.vue")
        },
        {
            path: "/notifyTemplateInfo",
            name: "notifyTemplateDetail",
            component: () => import("@/views/notify/template/NotifyTemplateInfo.vue")
        }
    ]
}

export default notifyRouter;
