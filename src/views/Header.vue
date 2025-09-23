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
            <el-text type="info"tag="b">tiny01</el-text>
            <el-icon size="20"><Baseball /></el-icon>
          </el-space>
        </div>
      </div>
    </el-col>
  </el-row>
</template>
<script>
import { defineComponent,toRef,onMounted } from 'vue'
import CenterContain from '@/components/CenterContain.vue'
export default defineComponent({
  name: "Header",
  components: {CenterContain},
  props:{
    routerData:{
      type: Array,
      required: false,
      default: () => []
    }
  },
  setup(props,context){
    console.log(context.emit)
    const data=toRef(props,'routerData')
    const meanclick = ()=>{
      context.emit('func')
      console.log('header click')
    }
    return {
      data,
      meanclick
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
</style>
