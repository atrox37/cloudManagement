
const deviceRouter ={
    path: "/device",
    name: "设备",
    component: ()=>import('@/views/Index.vue'),
    redirect: {path: '/devicePage'},
    children:[
        {
            path: "/devicePage",
            name: "设备列表",
            component: () => import("@/views/device/DevicePage.vue")
        },
        {
            path: "/deviceInstance",
            name: "设备详情",
            component: () => import("@/views/device/DeviceInstance.vue")
        },
        {
            path: "/productPage",
            name: "产品列表",
            component: () => import("@/views/product/ProductPage.vue")
        },
        {
            path: "/productInstance",
            name: "产品详情",
            component: () => import("@/views/product/ProductInstance.vue")
        }
    ]
};

export default deviceRouter;