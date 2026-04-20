<template>
  <el-menu
      :collapse="viewModel.menuState"
      active-text-color="#FFFFFF"
      background-color="#001529"
      text-color="#fff"
      class="el-menu-vertical-demo"
      :default-active="activeMenu"
      @open="handleMenu"
      @close="handleMenu">
    <el-sub-menu v-for="item in menudata.data" :key="String(item.id)" :index="String(item.id)">
      <template #title>
        <font-awesome-icon size="1x" :title="item.title" :fixedWidth=true :icon="item.icon" />
        <span style="margin-left: 8px;color:#C0C4CC">{{ getMenuName(item.name, item.path) }}</span>
      </template>

      <template v-for="subItem in item.children" :key="String(subItem.id)" :index="String(subItem.id)">
        <el-menu-item
          v-if="subItem.children==undefined||subItem.children.length==0"
          :index="subItem.path"
          @click="itemclick(subItem.path,[getMenuName(item.name, item.path),getMenuName(subItem.name, subItem.path)])"
        >
          <font-awesome-icon size="1x" :title="subItem.title" :fixedWidth=true :icon="subItem.icon" />
          <span style="margin-left: 8px;color:#C0C4CC">{{ getMenuName(subItem.name, subItem.path) }}</span>
        </el-menu-item>
        <el-sub-menu
          v-if="subItem.children!=undefined&&subItem.children.length>0"
          :index="String(subItem.id)"
        >
          <template #title>
            <font-awesome-icon size="1x" :title="subItem.title" :fixedWidth=true :icon="subItem.icon" />
            <span style="margin-left: 8px;color:#C0C4CC">{{ getMenuName(subItem.name, subItem.path) }}</span>
          </template>
          <el-menu-item
            v-for="scItem in subItem.children"
            :key="String(scItem.id)"
            :index="scItem.path"
            @click="itemclick(scItem.path,[getMenuName(subItem.name, subItem.path),getMenuName(scItem.name, scItem.path)])"
          >
            <font-awesome-icon size="1x" :title="scItem.title" :fixedWidth=true :icon="scItem.icon" />
            <span style="margin-left: 8px;color:#C0C4CC">{{ getMenuName(scItem.name, scItem.path) }}</span>
          </el-menu-item>
        </el-sub-menu>

      </template>

    </el-sub-menu>
  </el-menu>
</template>

<script>
import { defineComponent, reactive, computed, watch, toRef, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { menuApi } from "@/util/request";

// 路径 → i18n key 映射（子菜单项）
const pathKeyMap = {
  '/userPage': 'routeNames.userList',
  '/role': 'routeNames.roleList',
  '/organization': 'routeNames.organization',
  '/devicePage': 'routeNames.deviceList',
  '/deviceInstance': 'routeNames.deviceDetail',
  '/productPage': 'routeNames.productList',
  '/productInstance': 'routeNames.productDetail',
  '/networkPage': 'routeNames.networkList',
  '/networkInstance': 'routeNames.networkDetail',
  '/gatewayPage': 'routeNames.gatewayList',
  '/protocol': 'routeNames.protocolList',
  '/notifyConfigPage': 'routeNames.notifyList',
  '/notifyAdd': 'routeNames.notifyAdd',
  '/notifyTemplatePage': 'routeNames.notifyTemplateList',
  '/notifyTemplateInfo': 'routeNames.notifyTemplateDetail',
}

// 后端菜单名 → i18n key 映射（父级分类，无 path）
const nameKeyMap = {
  '系统': 'routeNames.sys',
  '系统设置': 'routeNames.sys',
  '系统管理': 'routeNames.sys',
  '设备': 'routeNames.device',
  '设备管理': 'routeNames.device',
  '设备接入': 'routeNames.deviceAccess',
  '网络组件': 'routeNames.network',
  '网络管理': 'routeNames.network',
  '网络': 'routeNames.network',
  '通知组件': 'routeNames.notifyGroup',
  '通知管理': 'routeNames.notifyGroup',
  '通知': 'routeNames.notifyGroup',
  '网关': 'routeNames.gatewayList',
  '协议': 'routeNames.protocolList',
}

export default defineComponent({
  name: "Aside",
  props: {
    m: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  setup(props, context) {
    const { t } = useI18n()
    const route = useRoute()
    const menudata = reactive({ data: [] });
    const mm = toRef(props, 'm')
    let viewModel = reactive({ menuState: false, menuColor: '#000000' })

    // 详情页 → 对应父级列表页映射（访问详情时高亮列表菜单项）
    const routeParentMap = {
      '/deviceInstance': '/devicePage',
      '/productInstance': '/productPage',
      '/networkInstance': '/networkPage',
      '/notifyTemplateInfo': '/notifyTemplatePage',
      '/notifyAdd': '/notifyConfigPage',
    }

    // 当前激活的菜单项
    const activeMenu = computed(() => {
      const path = route.path
      return routeParentMap[path] || path
    })

    const getMenuName = (name, path) => {
      if (path && pathKeyMap[path]) {
        return t(pathKeyMap[path])
      }
      if (name && nameKeyMap[name]) {
        return t(nameKeyMap[name])
      }
      return name
    }

    const requetMenu = function () {
      menuApi().then((a1, a2) => {
        if (a1.code == 200) {
          for (let d of a1.data) {
            menudata.data.push(d)
          }
        }
      })
    }
    const handleMenu = function () {
      console.log('handleMenu')
    }
    const itemclick = (path, routerNames) => {
      context.emit('push', path, routerNames)
    }
    watch(mm, (o1, o2) => {
      viewModel.menuState = o2
    })

    onMounted(() => {
      requetMenu()
    })

    return {
      mm,
      itemclick,
      viewModel,
      handleMenu,
      menudata,
      getMenuName,
      activeMenu,
    }
  }
})
</script>

<style scoped lang="scss">
.el-menu {
  height: 100%;
  border-right: none;
}
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  height: 100%;
}
.el-menu-item {
  min-width: 20px !important;
}
/* 激活状态：蓝色高亮背景 */
.el-menu-item.is-active {
  background-color: #1890ff !important;
  position: relative;
  min-width: 20px !important;
}
/* 激活状态左侧竖条装饰 */
.el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #40a9ff;
  border-radius: 0 2px 2px 0;
}
/* 激活项的文字颜色 */
.el-menu-item.is-active span {
  color: #ffffff !important;
}
/* hover 状态 */
.el-menu-item:hover {
  background-color: #0d2137 !important;
}
/* 子菜单标题 hover */
:deep(.el-sub-menu__title:hover) {
  background-color: #0d2137 !important;
}
</style>
