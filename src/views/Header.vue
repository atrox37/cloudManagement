<template>
  <el-row>
    <el-col :span="1" style="text-align: center;">
      <CenterContain>
        <template v-slot:content>
          <font-awesome-icon @click="meanclick" size="1x" :fixedWidth=true icon="fa-solid fa-bars" class="animate__animated animate__bounce animate__faster"/>
        </template>
      </CenterContain>
    </el-col>
    <el-col :span="23">
      <div class="content_view">
        <div class="route_container">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(item,index) in data" :key="index" :index="index">{{item.name}}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="account_container">
          <el-space wrap>
            <LangSwitch />
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="user_info">
                <el-avatar :size="32" style="background-color: #409eff; cursor: pointer;">
                  {{ username ? username.charAt(0).toUpperCase() : '?' }}
                </el-avatar>
                <el-text type="info" tag="b" style="margin-left: 8px; cursor: pointer;">{{ username }}</el-text>
                <el-icon style="margin-left: 4px; cursor: pointer;"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    <font-awesome-icon icon="fa-solid fa-right-from-bracket" style="margin-right: 8px;" />
                    {{ $t('header.logout') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-space>
        </div>
      </div>
    </el-col>
  </el-row>
</template>
<script>
import { defineComponent, toRef, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import CenterContain from '@/components/CenterContain.vue'
import LangSwitch from '@/components/menuContain/LangSwitch.vue'
import { logoutApi } from '@/util/request'

export default defineComponent({
  name: "Header",
  components: { CenterContain, LangSwitch },
  props: {
    routerData: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  setup(props, context) {
    const router = useRouter()
    const data = toRef(props, 'routerData')

    const userinfo = window.sessionStorage.getItem('userinfo')
    const username = ref(userinfo ? JSON.parse(userinfo).username : '')

    const meanclick = () => {
      context.emit('func')
    }

    const handleCommand = (command) => {
      if (command === 'logout') {
        ElMessageBox.confirm('确认退出登录？', '提示', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          logoutApi({}).then(() => {
            window.sessionStorage.removeItem('token')
            window.sessionStorage.removeItem('userinfo')
            router.replace('/login')
          }).catch(() => {
            window.sessionStorage.removeItem('token')
            window.sessionStorage.removeItem('userinfo')
            router.replace('/login')
          })
        }).catch(() => {})
      }
    }

    return {
      data,
      username,
      meanclick,
      handleCommand
    }
  }
})
</script>

<style scoped lang="scss">
.el-row{
  width: 100%;
  height: 100%;
}
.content_view{
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
}
.route_container{
}
.account_container{
  align-items: center;
}
.user_info {
  display: flex;
  align-items: center;
  outline: none;
}
</style>
