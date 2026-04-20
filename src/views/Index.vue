<template>
  <el-container style="height: 100%">
    <el-aside style="height: 100%;width: auto">
      <Aside :m="data.meunStat" @push="pushView"></Aside>
    </el-aside>
    <el-container style="height: 100%;width: auto">
      <el-header>
        <Header @func="changeMenu" :routerData="routerData"></Header>
      </el-header>
      <el-main class="index-main-container">
        <div class="tag-container">
          <el-tag v-for="(item,index) in tags" style="margin-right: 2px;" :key="index" closable :type="item.active?'primary':'info'" size="large" @close="(event)=>{closeTag(event,item)}" @click="(event)=>{clickTag(item,index)}" effect="plain">

            <template #default="scope">
              <font-awesome-icon :icon="['fas', 'circle']" v-if="item.active"/>
              <font-awesome-icon :icon="['fas', 'circle-dot']" v-else/>
              {{ $t('routeNames.' + item.name, item.name) }}
            </template>

          </el-tag>
        </div>
        <div class="content-container">
          <router-view></router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import Aside from '@/views/Aside.vue'
import Header from '@/views/Header.vue'
import {useRouter} from 'vue-router';
import tagViewStore from '@/store/tagView.js';
import { ElTag } from 'element-plus'
import { defineComponent,ref,reactive,watch,onMounted,onUpdated } from 'vue'
import { useI18n } from 'vue-i18n'
export default defineComponent({
  name: "Index",
  components: {Aside,Header},
  setup(){
    const { t } = useI18n()
    const router = useRouter()
    const data=reactive({name:'asd',meunStat: true})
    const tags=reactive([])
    const changeMenu = function () {
      console.log('修改状态')
      data.meunStat = !data.meunStat
    }
    const routerData=reactive([])
    const pushView=function(path,routeNames){
      router.push(path)
      routerData.length=0
      for(var i of routeNames){
        routerData.push({name:i})
      }
      console.log(`跳转 ${path}`)
    }
    const resetTag=()=>{
      var views=tagViewStore().getView()
      tags.length=0
      tags.push(...views)
    }
    const clickTag=(item,index)=>{
      console.log('clickTag')
      if(!item.active){
        tagViewStore().resetActive(index)
        resetTag()
        refreshPush()
      }
    }
    const closeTag=(event,item)=>{
      console.log('closeTag')
      tagViewStore().removeView(item)
      if(tagViewStore().autoActive()){
        refreshPush()
      }
      resetTag()
    }
    const refreshPush=()=>{
      var view=tagViewStore().getCurrentView()
      if(view==undefined){
        router.push('/userPage')
        routerData.length=0
        routerData.push({name:t('routeNames.userList'),path:'/userPage',parent:[{name:t('routeNames.sys')}]})
      }else{
        routerData.length=0
        router.push(view.path)
        routerData.push(...view.parent)
      }
      /*routerData.length=0
      routerData.push(view)*/
    }
    onMounted(()=>{
      console.log('onMounted')
      refreshPush()
      resetTag()
    })
    watch(data,(o1,o2) => {
      console.log(`watch ${o2.meunStat}`)
    })
    onUpdated(()=>{
      resetTag()
    })
    return {
      tags,
      data,
      routerData,
      changeMenu,
      pushView,
      closeTag,
      clickTag
    }
  }
})
</script>

<style lang="scss" scoped>
.el-header,.el-footer{
  padding: 0;
  height: 60px;
  width: 100%;
}
.index-main-container{
  height: calc(100% - 60px);
  background: var(--tiny-navigation-color);
  margin: 0;
  padding: 0;
  flex:none;
}
.tag-container{
  height: 50px;
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
  padding: 5px 10px;
  overflow-y: hidden;
  overflow-x: auto;
  background-color: var(--tiny-navigation-color);
  box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.1);
}
.tag-container::-webkit-scrollbar {
  width: 10px;
  height: 5px;
  background-color: transparent;
}
.tag-container::-webkit-scrollbar-thumb {
  border-radius: 2px;
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
  background-color: #555;
}
.content-container{
  height: calc(100% - 50px);
  width: 100%;
  box-sizing: border-box;
}
</style>
