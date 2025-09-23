<template>
  <el-menu
      :collapse="viewModel.menuState"
      active-text-color="#FFFFFF"
      background-color="#001529"
      text-color="#fff"
      class="el-menu-vertical-demo"
      @open="handleMenu"
      @close="handleMenu">
    <el-sub-menu v-for="item in menudata.data" :key="String(item.id)" :index="String(item.id)">
      <template #title>
        <font-awesome-icon size="1x" :title="item.title" :fixedWidth=true :icon="item.icon" />
        <span style="margin-left: 8px;color:#C0C4CC">{{item.name}}</span>
      </template>

      <template v-for="subItem in item.children" :key="String(subItem.id)" :index="String(subItem.id)">
        <el-menu-item v-if="subItem.children==undefined||subItem.children.length==0" @click="itemclick(subItem.path,[item.name,subItem.name])">
          <font-awesome-icon size="1x" :title="subItem.title" :fixedWidth=true :icon="subItem.icon" />
          <span style="margin-left: 8px;color:#C0C4CC">{{subItem.name}}</span>
        </el-menu-item>
        <el-sub-menu v-if="subItem.children!=undefined&&subItem.children.length>0">
          <template #title>
            <font-awesome-icon size="1x" :title="subItem.title" :fixedWidth=true :icon="subItem.icon" />
            <span style="margin-left: 8px;color:#C0C4CC">{{subItem.name}}</span>
          </template>
          <el-menu-item v-for="scItem in subItem.children" :key="String(scItem.id)" :index="String(scItem.id)" @click="itemclick(scItem.path,[subItem.name,scItem.name])">
            <font-awesome-icon size="1x" :title="scItem.title" :fixedWidth=true :icon="scItem.icon" />
            <span style="margin-left: 8px;color:#C0C4CC">{{scItem.name}}</span>
          </el-menu-item>
        </el-sub-menu>

      </template>



<!--      <el-menu-item v-for="subItem in item.children" :key="String(subItem.id)" :index="String(subItem.id)" @click="itemclick(subItem.path,[item.name,subItem.name])">
        <font-awesome-icon size="1x" :title="subItem.title" :fixedWidth=true :icon="subItem.icon" />
        <span style="margin-left: 8px;color:#C0C4CC">{{subItem.name}}</span>
      </el-menu-item>-->
    </el-sub-menu>
  </el-menu>
</template>

<script>
import { defineComponent,reactive,watch,toRef,onMounted} from 'vue'
import {menuApi} from "@/util/request";
export default defineComponent({
  name: "Aside",
  props: {
    m: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  setup(props,context){
    const menudata = reactive({data:[]});
    const mm = toRef(props,'m')
    console.log(mm.value)
    let viewModel = reactive({menuState:false,menuColor: '#000000'})
    const requetMenu = function () {
      menuApi().then((a1,a2) => {
        if(a1.code == 200){
          for(let d of a1.data){
            menudata.data.push(d)
          }
        }
      })
    }
    const handleMenu = function () {
      console.log('handleMenu')
    }
    const itemclick = (path,routerNames) => {
      context.emit('push',path,routerNames)
    }
    watch(mm,(o1,o2) => {
      viewModel.menuState=o2
    })

    onMounted(()=>{
      requetMenu()
    })

    return {
      mm,
      itemclick,
      viewModel,
      handleMenu,
      menudata
    }
  }
})
</script>

<style scoped lang="scss">
.el-menu{
  height: 100%;
}
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  height: 100%;
}
.el-menu-item{
  min-width: 20px !important;
}
.el-menu-item.is-active {
  background-color: rgb(24,144,255) !important;//你要修改的颜色
  min-width: 20px !important;
}
</style>
