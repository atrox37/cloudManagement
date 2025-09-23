const systemRouter ={
    path: "/sys",
    name: "系统",
    component: ()=>import('@/views/Index.vue'),
    redirect: {path: '/userPage'},
    children:[
        {
            path: "/userPage",
            name: "用户列表",
            component: () => import("@/views/account/UserPage.vue")
        },
        {
            path: "/role",
            name: "角色列表",
            component: () => import("@/views/account/RolePage.vue")
        },
        {
            path: "/organization",
            name: "机构",
            component: () => import("@/views/organization/Organization.vue")
        }
    ]
};

export default systemRouter;