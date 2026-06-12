<template>
  <el-drawer v-model="visible" :title="$t('credential.title')" direction="rtl" size="45%">
    <template #default>
      <el-container style="height: 100%;">
        <el-header>
          <div style="display: flex; justify-content: space-between; align-items: center; height: 100%;">
            <el-button type="primary" @click="credentialAdd">{{ $t('credential.add') }}</el-button>
            <el-button type="danger" :disabled="selection.length === 0" @click="credentialDeleteClick">{{ $t('common.delete') }}</el-button>
          </div>
        </el-header>
        <el-main>
          <el-table height="100%" :data="tableData" border v-loading="loading" @selection-change="selectionChange">
            <el-table-column type="selection" width="40" />
            <el-table-column prop="accessKeyId" :label="$t('credential.accessKeyId')" min-width="180" />
            <el-table-column prop="secretKey" :label="$t('credential.secretKey')" min-width="180" />
            <el-table-column prop="createTime" :label="$t('credential.createTime')" min-width="150" />
            <template #empty>
              <el-empty :description="$t('common.noData')" />
            </template>
          </el-table>
        </el-main>
        <el-footer>
          <div class="center-flex-contain">
            <el-pagination background layout="prev, pager, next" :total="pageInfo.total" :page-size="pageInfo.size" @current-change="pageChange"/>
          </div>
        </el-footer>
      </el-container>
    </template>
  </el-drawer>
</template>

<script>
import {defineComponent, ref, reactive, getCurrentInstance, watch} from "vue"
import {ElMessage, ElMessageBox} from "element-plus";
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: "CredentialDrawer",
  props: {
    modelValue: { type: Boolean, default: false },
    userId: { type: Number, default: null }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const {proxy} = getCurrentInstance()
    const { t } = useI18n()
    const visible = ref(false)
    const loading = ref(false)
    const tableData = reactive([])
    const selection = ref([])
    const pageInfo = reactive({size: 10, current: 1, total: 0, terms: []})

    watch(() => props.modelValue, (val) => {
      visible.value = val
      if (val && props.userId) {
        pageInfo.current = 1
        pageInfo.total = 0
        pageInfo.terms = [{column: 'creator_id', value: props.userId, termType: 'eq', type: 'and'}]
        loadPage()
      }
    })
    watch(visible, (val) => {
      emit('update:modelValue', val)
    })

    const loadPage = () => {
      loading.value = true
      proxy.$http.credentialPage(pageInfo).then(value => {
        tableData.length = 0
        tableData.push(...value.data.records)
        pageInfo.total = value.data.total
        loading.value = false
      }, () => {
        tableData.length = 0
        loading.value = false
      })
    }
    const pageChange = (current) => {
      pageInfo.current = current
      loadPage()
    }
    const selectionChange = (rows) => {
      selection.value = rows
    }
    const credentialAdd = () => {
      proxy.$http.credentialCreate({creatorId: props.userId}).then(() => {
        ElMessage({message: t('common.createSuccess'), type: 'success', plain: true})
        loadPage()
      })
    }
    const credentialDeleteClick = () => {
      ElMessageBox.confirm(t('credential.deleteConfirm'), t('common.warning'), {type: 'warning'}).then(() => {
        const ids = selection.value.map(item => item.id)
        proxy.$http.credentialDeleteBatch(ids).then(() => {
          ElMessage({message: t('common.deleteSuccess'), type: 'success', plain: true})
          loadPage()
        })
      }).catch(() => {})
    }

    return {
      visible,
      loading,
      tableData,
      selection,
      pageInfo,
      pageChange,
      selectionChange,
      credentialAdd,
      credentialDeleteClick
    }
  }
})
</script>

<style scoped lang="sass">
@use '@/scss/container.scss'
</style>
