const networkRouter={
    path: "/network",
    name: "network",
    component: ()=>import('@/views/Index.vue'),
    redirect: {path: '/networkPage'},
    children:[
        {
            path: "/networkPage",
            name: "networkList",
            component: () => import("@/views/network/NetworkPage.vue")
        },
        {
            path: "/networkInstance",
            name: "networkDetail",
            component: () => import("@/views/network/NetworkInstance.vue")
        },
        {
            path: "/gatewayPage",
            name: "gatewayList",
            component: () => import("@/views/gateway/GatewayPage.vue")
        },
        {
            path: "/protocol",
            name: "protocolList",
            component: () => import("@/views/protocol/ProtocolPage.vue")
        }
    ]
}

export default networkRouter;
