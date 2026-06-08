const systemRouter ={
    path: "/sys",
    name: "sys",
    component: ()=>import('@/views/Index.vue'),
    redirect: {path: '/userPage'},
    children:[
        {
            path: "/userPage",
            name: "userList",
            component: () => import("@/views/account/UserPage.vue")
        },
        {
            path: "/role",
            name: "roleList",
            component: () => import("@/views/account/RolePage.vue")
        },
        {
            path: "/organization",
            name: "organization",
            component: () => import("@/views/organization/Organization.vue")
        },
        {
            path: "/audit",
            name: "auditLog",
            component: () => import("@/views/account/AuditLogPage.vue")
        }
    ]
};

export default systemRouter;
