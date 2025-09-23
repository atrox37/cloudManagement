// 导入router所需的方法
import { createRouter, createWebHistory,createWebHashHistory } from 'vue-router'
import tagViewStore from '../store/tagView.js'
import Home from "../views/Home.vue";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

import deviceRouter from "./modules/deviceRouter";
import systemRouter from "./modules/systemRouter";
import networkRouter from "./modules/networkRouter";
import notifyRouter from "./modules/notifyRouter";

const Layout = ()=> import('@/views/Index.vue')

const routes = [
  {
    path: '/testMap',
    name: 'TestMap',
    component: () => import("@/views/test/TestMap.vue")
  },
  {
    path: "/testFlow",
    name: "TestFlow",
    component: () => import("@/views/test/TestFlow.vue")
  },
  {
    path: "/testOrg",
    name: "TestOrg",
    component: () => import("@/views/test/TestOrg.vue")
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue")
  },
  {
    path: "/",
    name: "Home",
    redirect:{name: "Login"}
  },
  {
    path: "/about",
    name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue"),
  },
  systemRouter,
  deviceRouter,
  networkRouter,
  notifyRouter,
  {
    path: "/index",
    name: "Index",
    component: Layout,
    children: [
      {
        path: "/test",
        name:"Test",
        component: () => import("@/views/Test.vue")
      }
    ]
  },
  {
    path: "/aside",
    name: "Aside",
    component: () => import("@/views/Aside.vue")
  }
];

const router = createRouter({
  history: createWebHistory('/'),
  routes,
});
const handlerAddView=(to)=>{
  console.log('前进'+to.fullPath);
  var parent=[]
  for(var index in to.matched){
    parent.push(to.metched[index])
  }
  return {name:to.name,path:to.fullPath,active:true,parent:parent}
}

router.beforeEach((to, from, next)=>{
  const currentPosition=window.history.state.position;
  const tempPosition=tagViewStore().getPosition()
  console.log('beforeEach:currentPosition='+currentPosition+" tempPosition="+tempPosition)
  if (to.fullPath !== from.fullPath&&from.fullPath!='/') {
    tagViewStore().setPosition(currentPosition)
    if(currentPosition==tempPosition
        &&tagViewStore().getCurrentView()!=undefined
        &&tagViewStore().getCurrentView().path!=to.path){
      var parent=[]
      if(to.matched != undefined){
        for(var index in to.matched){
          parent.push(to.matched[index])
        }
      }
      tagViewStore().removeView({path:to.fullPath})
      //tagViewStore().addView({name:to.name,path:to.fullPath,active:true,parent:parent})
    }else if (currentPosition>tempPosition) {
      console.log('前进'+to.fullPath);
      var parent=[]
      if(to.matched != undefined){
        for(var index in to.matched){
          parent.push({name:to.matched[index].name})
        }
      }
      tagViewStore().addView({name:to.name,path:to.fullPath,active:true,parent:parent})
    } else {
      console.log('后退'+to.fullPath);
      tagViewStore().removeView({path:to.fullPath})
    }
  }
  NProgress.start();
  const token=window.sessionStorage.getItem('token')
  next()

})
router.afterEach(() => {
  // 关闭进度条
  console.log('afterEach')
  NProgress.done()
})

export default router;
