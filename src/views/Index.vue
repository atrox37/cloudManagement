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
          <el-tag
            v-for="(item,index) in tags"
            :key="index"
            style="margin-right: 2px;"
            closable
            :type="item.active ? 'primary' : 'info'"
            size="large"
            effect="plain"
            @close="(event)=>{closeTag(event,item)}"
            @click="(event)=>{clickTag(item,index)}"
          >
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
import { useRouter } from 'vue-router'
import tagViewStore from '@/store/tagView.js'
import { defineComponent, reactive, watch, onMounted, onUpdated } from 'vue'

export default defineComponent({
  name: 'Index',
  components: { Aside, Header },
  setup() {
    const router = useRouter()
    const tagStore = tagViewStore()
    const data = reactive({ name: 'asd', meunStat: true })
    const tags = reactive([])
    const routerData = reactive([])

    const buildRouteData = (path) => {
      return router.resolve(path).matched
        .filter((record) => record.name && record.name !== 'Index')
        .map((record) => ({
          name: String(record.name),
          path: record.path
        }))
    }

    const syncRouterData = (path) => {
      routerData.length = 0
      routerData.push(...buildRouteData(path))
    }

    const normalizeStoredViews = () => {
      const views = tagStore.getView()
      for (const view of views) {
        const matched = buildRouteData(view.path)
        if (matched.length > 0) {
          view.parent = matched
          view.name = matched[matched.length - 1].name
        }
      }
    }

    const changeMenu = () => {
      data.meunStat = !data.meunStat
    }

    const pushView = (path) => {
      router.push(path)
      syncRouterData(path)
    }

    const resetTag = () => {
      const views = tagStore.getView()
      tags.length = 0
      tags.push(...views)
    }

    const clickTag = (item, index) => {
      if (!item.active) {
        tagStore.resetActive(index)
        resetTag()
        refreshPush()
      }
    }

    const closeTag = (event, item) => {
      tagStore.removeView(item)
      if (tagStore.autoActive()) {
        refreshPush()
      }
      resetTag()
    }

    const refreshPush = () => {
      const view = tagStore.getCurrentView()
      if (view === undefined) {
        router.push('/userPage')
        syncRouterData('/userPage')
      } else {
        router.push(view.path)
        syncRouterData(view.path)
      }
    }

    onMounted(() => {
      normalizeStoredViews()
      refreshPush()
      resetTag()
    })

    watch(data, (o1, o2) => {
      console.log(`watch ${o2.meunStat}`)
    })

    onUpdated(() => {
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
