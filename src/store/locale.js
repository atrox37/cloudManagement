import { defineStore } from 'pinia'
import { ref } from 'vue'
import i18n from '@/locales/index'

export const useLocaleStore = defineStore('locale', () => {
  const lang = ref(localStorage.getItem('app-locale') || 'en-US')

  // 初始化时同步 i18n locale
  i18n.global.locale.value = lang.value

  function setLang(newLang) {
    lang.value = newLang
    i18n.global.locale.value = newLang
    localStorage.setItem('app-locale', newLang)
  }

  return { lang, setLang }
}, {
  persist: true,
})
