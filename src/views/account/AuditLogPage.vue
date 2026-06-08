<template>
  <el-container class="audit-log-page">
    <el-header>
      <div class="search-box">
        <el-form :inline="true">
          <el-form-item v-for="(item, index) in searchParams" :label="item.label" :key="index">
            <el-input v-if="item.type === 'input'" v-model="item.value" clearable style="width:150px" />
            <el-select v-if="item.type === 'select'" v-model="item.value" clearable style="width:130px">
              <el-option v-for="opt in item.options" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="queryClick">{{ $t('common.search') }}</el-button>
            <el-button type="info" @click="resetClick">{{ $t('common.reset') }}</el-button>
            <el-button type="danger" :disabled="selectedIds.length === 0" @click="deleteBatchClick">
              {{ $t('common.delete') }}({{ selectedIds.length }})
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-header>
    <el-main>
      <el-table height="100%" v-loading="loading" :data="tableData" border stripe
                @selection-change="selectionChange">
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column type="expand">
          <template #default="scope">
            <div class="audit-body-expand">
              <pre>{{ scope.row.auditPo.body || '-' }}</pre>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="auditPo.createTime" align="center" width="240">
          <template #header>
            <div class="center-flex-contain">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                :range-separator="$t('common.to')"
                :start-placeholder="$t('common.start')"
                :end-placeholder="$t('common.end')"
                size="small"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="userPo.username" :label="$t('user.username')" align="center" width="120" />
        <el-table-column prop="dimensionPo.name" :label="$t('common.org')" align="center" width="120" />
        <el-table-column prop="auditPo.method" :label="$t('auditLog.method')" align="center" width="120">
          <template #default="scope">
            <el-tag :type="methodTagType(scope.row.auditPo.method)" size="small">{{ scope.row.auditPo.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditPo.url" :label="$t('auditLog.url')" align="left" min-width="200" show-overflow-tooltip />
        <el-table-column prop="auditPo.ip" :label="$t('auditLog.ip')" align="center" width="130" />
        <el-table-column prop="auditPo.state" :label="$t('auditLog.state')" align="center" width="130">
          <template #default="scope">
            <el-tag v-if="scope.row.auditPo.state" :type="stateTagType(scope.row.auditPo.state)" size="small">
              {{ scope.row.auditPo.state }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditPo.durationMs" :label="$t('auditLog.durationMs')" align="center" width="130" />
        <template #empty>
          <el-empty :description="$t('common.noData')" />
        </template>
      </el-table>
    </el-main>
    <el-footer>
      <div class="center-flex-contain">
        <el-pagination
          background
          layout="sizes, prev, pager, next"
          :total="pageInfo.total"
          :page-size="pageInfo.size"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="pageChange"
          @size-change="sizeChange"
        />
      </div>
    </el-footer>
  </el-container>
</template>

<script>
import { defineComponent, onMounted, ref, reactive, getCurrentInstance, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { initPickTime } from '@/util/common/pickTime.js'

const formatDateStr = (d) => {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00`
}

export default defineComponent({
  name: 'AuditLogPage',
  setup() {
    const { proxy } = getCurrentInstance()
    const { t } = useI18n()
    const loading = ref(false)
    const selectedIds = ref([])

    const dateRange = ref(initPickTime())
    const tableData = reactive([])
    const pageInfo = reactive({ size: 10, current: 1, total: 0, terms: [], sorts: [{ column: 't.create_time', order: 'desc' }] })

    const searchParams = reactive([
      { column: 't1.username', value: '', termType: 'like', label: t('user.username'), type: 'input' },
      {
        column: 'method', value: '', termType: 'eq', label: t('auditLog.method'), type: 'select',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'WS', value: 'WS' },
        ]
      },
    ])

    const methodTagType = (method) => {
      const map = { GET: '', POST: 'success', PUT: 'warning', DELETE: 'danger', WS: 'info' }
      return map[method] || ''
    }

    const stateTagType = (state) => {
      if (state >= 200 && state < 300) return 'success'
      if (state >= 400 && state < 500) return 'warning'
      if (state >= 500) return 'danger'
      return 'info'
    }

    const selectionChange = (rows) => {
      selectedIds.value = rows.map(row => row.auditPo.id)
    }

    const buildTerms = () => {
      pageInfo.terms.length = 0
      if (dateRange.value && dateRange.value[0]) {
        pageInfo.terms.push({ column: 't.create_time', value: formatDateStr(dateRange.value[0]), termType: 'gte', type: 'and' })
        pageInfo.terms.push({ column: 't.create_time', value: formatDateStr(dateRange.value[1]), termType: 'lte', type: 'and' })
      }
      for (const item of searchParams) {
        if (item.value !== '' && item.value != null) {
          pageInfo.terms.push({ column: item.column, value: item.value, termType: item.termType, type: 'and' })
        }
      }
    }

    watch(dateRange, () => {
      queryClick()
    })

    const pageApi = () => {
      loading.value = true
      proxy.$http.auditLogPage(pageInfo).then(value => {
        pageInfo.total = value.data.total
        tableData.length = 0
        tableData.push(...value.data.records)
        loading.value = false
      }, () => {
        tableData.length = 0
        loading.value = false
      })
    }

    const queryClick = () => {
      pageInfo.current = 1
      buildTerms()
      pageApi()
    }

    const resetClick = () => {
      dateRange.value = initPickTime()
      for (const item of searchParams) {
        item.value = ''
      }
      pageInfo.current = 1
      buildTerms()
      pageApi()
    }

    const pageChange = (current) => {
      pageInfo.current = current
      pageApi()
    }

    const sizeChange = (size) => {
      pageInfo.size = size
      pageInfo.current = 1
      pageApi()
    }

    const deleteBatchClick = () => {
      ElMessageBox.confirm(
        t('common.warning'),
        { type: 'warning' }
      ).then(() => {
        proxy.$http.auditLogDeleteBatch(selectedIds.value).then(() => {
          ElMessage({ type: 'success', message: t('common.deleteSuccess') })
          selectedIds.value = []
          pageApi()
        })
      }).catch(() => {})
    }

    onMounted(() => {
      buildTerms()
      pageApi()
    })

    return {
      loading, dateRange, tableData, pageInfo, searchParams, selectedIds,
      methodTagType, stateTagType, selectionChange,
      queryClick, resetClick, pageChange, sizeChange, deleteBatchClick,
    }
  }
})
</script>

<style scoped lang="sass">
  @use '@/scss/container.scss'
  .audit-body-expand
    padding: 12px 20px
    pre
      margin: 0
      font-size: 13px
      white-space: pre-wrap
      word-break: break-all
      color: #606266
</style>
<style>
.audit-log-page .el-date-editor.el-input__wrapper {
  width: 220px;
}
</style>
