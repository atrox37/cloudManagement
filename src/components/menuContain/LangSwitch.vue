<template>
  <el-dropdown @command="handleLangChange" trigger="click" placement="bottom-end">
    <div class="lang-trigger">
      <font-awesome-icon icon="fa-solid fa-language" class="lang-icon" />
      <span class="lang-text">{{ currentLangShort }}</span>
      <el-icon class="lang-arrow"><ArrowDown /></el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN" :class="{ 'is-active-lang': isChinese }">
          <span class="menu-label">{{ $t('lang.zhCN') }}</span>
          <el-icon v-if="isChinese" class="check-icon"><Check /></el-icon>
        </el-dropdown-item>
        <el-dropdown-item command="en-US" :class="{ 'is-active-lang': !isChinese }">
          <span class="menu-label">{{ $t('lang.enUS') }}</span>
          <el-icon v-if="!isChinese" class="check-icon"><Check /></el-icon>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleStore } from '@/store/locale'
import { ArrowDown, Check } from '@element-plus/icons-vue'

export default defineComponent({
  name: 'LangSwitch',
  components: { ArrowDown, Check },
  setup() {
    const localeStore = useLocaleStore()
    const { t } = useI18n()

    const isChinese = computed(() => localeStore.lang === 'zh-CN')

    const currentLangShort = computed(() =>
      isChinese.value ? '中文' : 'EN'
    )

    const handleLangChange = (lang) => {
      localeStore.setLang(lang)
    }

    return { localeStore, isChinese, currentLangShort, handleLangChange }
  }
})
</script>

<style scoped>
.lang-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
  color: #2563eb;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
}
.lang-trigger:hover {
  background: #dbeafe;
  border-color: #2563eb;
  color: #1d4ed8;
}
.lang-icon {
  font-size: 16px;
}
.lang-text {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.lang-arrow {
  font-size: 11px;
  opacity: 0.7;
}
.menu-label {
  flex: 1;
  font-size: 14px;
}
.check-icon {
  margin-left: 8px;
  color: #409eff;
  font-size: 13px;
}
.is-active-lang {
  color: #409eff !important;
  font-weight: 600;
  background: #ecf5ff !important;
}
</style>
