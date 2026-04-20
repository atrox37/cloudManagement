<template>
  <el-dialog v-model="dialogData.status" :title="$t('productRule.title')" width="50%">
    <el-form label-position="left" label-width="auto">

      <el-form-item :label="$t('productRule.triggerCondition')">
        <AlarmItem ref="alarmItems" :deviceData="sourceDevice" v-for="(columns,key) in alarmColumn"
                   @delGroup="delGroup(key)" :key="key" :alarmData="columns"
                   style="width: 100%;height: auto;padding: 0;margin: 5px 0 0 0;overflow: hidden;"></AlarmItem>
        <el-row style="width:100%">
          <el-col :span="24" class="center-flex-contain" style="padding: 5px">
            <el-button type="primary" icon="Plus" size="small" @click="addGroup"/>
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import {defineComponent, toRef, computed} from "vue"
import AlarmItem from "@/components/device/item/AlarmItem.vue";
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: "DialogProductRule",
  components: {AlarmItem},
  emits: ['close', 'save'],
  props: {
    data: {
      type: Object,
      required: true,
      default: () => ({status: false, loading: false, product: {}, column: []})
    }
  },
  setup(props) {
    const { t } = useI18n()
    const dialogData = toRef(props, 'data')

    const meta = computed(() => {
      return dialogData.value?.rule?.ruleMeta || null
    })

    const paramRows = computed(() => {
      const p = meta.value?.param || {}
      return Object.keys(p).map(k => ({
        key: k,
        values: Array.isArray(p[k]) ? p[k] : [p[k]]
      }))
    })

    const formattedJson = computed(() => {
      try {
        return meta.value ? JSON.stringify(meta.value, null, 2) : ''
      } catch (e) {
        return ''
      }
    })

    return {
      dialogData,
      meta,
      paramRows,
      formattedJson,
    }
  }
})
</script>

<style scoped>
.cell-pre {
  white-space: pre-wrap;
  word-break: break-word;
}

.json-pre {
  margin: 0;
  padding: 8px 10px;
  background: #f6f8fa;
  border-radius: 4px;
  font-size: 12px;
}
</style>

