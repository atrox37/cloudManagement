const networkRouter={
    path: "/network",
    name: "网络组件",
    component: ()=>import('@/views/Index.vue'),
    redirect: {path: '/networkPage'},
    children:[
        {
            path: "/networkPage",
            name: "网络组件列表",
            component: () => import("@/views/network/NetworkPage.vue")
        },
        {
            path: "/networkInstance",
            name: "网络组件详情",
            component: () => import("@/views/network/NetworkInstance.vue")
        },
        {
            path: "/gatewayPage",
            name: "网关列表",
            component: () => import("@/views/gateway/GatewayPage.vue")
        },
        {
            path: "/protocol",
            name: "协议列表",
            component: () => import("@/views/protocol/ProtocolPage.vue")
        }
    ]
}

export default networkRouter;
