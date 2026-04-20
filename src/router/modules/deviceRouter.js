
const deviceRouter ={
    path: "/device",
    name: "device",
    component: ()=>import('@/views/Index.vue'),
    redirect: {path: '/devicePage'},
    children:[
        {
            path: "/devicePage",
            name: "deviceList",
            component: () => import("@/views/device/DevicePage.vue")
        },
        {
            path: "/deviceInstance",
            name: "deviceDetail",
            component: () => import("@/views/device/DeviceInstance.vue")
        },
        {
            path: "/productPage",
            name: "productList",
            component: () => import("@/views/product/ProductPage.vue")
        },
        {
            path: "/productInstance",
            name: "productDetail",
            component: () => import("@/views/product/ProductInstance.vue")
        }
    ]
};

export default deviceRouter;
