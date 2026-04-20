<template>
  <el-config-provider :locale="elLocale">
    <router-view />
  </el-config-provider>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleStore } from '@/store/locale'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

export default defineComponent({
  name: 'App',
  setup() {
    const localeStore = useLocaleStore()
    const { t } = useI18n()

    const elLocale = computed(() => {
      if (localeStore.lang === 'zh-CN') {
        const locale = { ...zhCn }
        locale.el = { ...zhCn.el }
        locale.el.pagination = { ...zhCn.el.pagination }
        locale.el.pagination.total = t('pagination.total')
        locale.el.pagination.goto = t('pagination.goto')
        return locale
      }

      return en
    })

    return { elLocale }
  }
})
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
