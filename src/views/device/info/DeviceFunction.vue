<template>
  <div class="tab-pan-content">
    <el-form label-width="120px">
      <el-form-item label="设备功能">
        <el-select v-model="sendSelect" placeholder="Select" size="large" @change="selectChange"
                   class="tiny-ex-content">
          <el-option
              v-for="(item,index) in funcMeta"
              :key="index"
              :label="item.name"
              :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="参数名称">
        <template #default>
          <el-form size="small">
            <el-form-item v-for="(item,index) in sendData" size="large" style="margin-top: 5px;" label-width="120px">
              <template #label>
                <el-tag type="primary" class="tiny-label-tag">{{ item.name }}</el-tag>
              </template>
              <template #default>
                <el-select v-if="item.valueType.type == 'enum'" v-model="item.value" size="large" class="input_content">
                  <el-option v-for="(item,index) in item.valueType.extra.enumData" :key="index" :label="item.value"
                             :value="item.key"></el-option>
                </el-select>
                <el-input-number v-else-if="item.valueType.type == 'number'" v-model="item.value" class="input_content">

                </el-input-number>
                <el-input v-if="item.valueType.type == 'string'" v-model="item.value" class="input_content">

                </el-input>
              </template>
            </el-form-item>
          </el-form>
        </template>
      </el-form-item>
      <el-form-item label="操作">
        <el-button type="primary" @click="runClick" :loading="funcData.loading">发送</el-button>
      </el-form-item>
      <el-form-item label="格式化结果">
        <el-form>
          <el-form-item v-for="(item,index) in sendResult" size="large" label-width="120px">
            <template #label>
              <el-tag type="primary" class="tiny-label-tag">{{ item.name }}</el-tag>
            </template>
            <template #default>
              <el-select v-if="item.valueType.type == 'enum'" v-model="funcData.result[item.id]" disabled class="input_content">
                <el-option v-for="(item,index) in item.valueType.extra.enumData" :key="index" :label="item.value"
                           :value="item.key"></el-option>
              </el-select>
              <el-input-number v-else-if="item.valueType.type == 'number'" v-model="funcData.result[item.id]" disabled class="input_content"></el-input-number>
              <el-input v-if="item.valueType.type == 'string'" v-model="funcData.result[item.id]" disabled class="input_content"></el-input>
            </template>
          </el-form-item>
        </el-form>

      </el-form-item>
      <el-form-item label="原始数据">
        <el-input
            class="tiny-ex-content"
            v-model="funcData.resultStr"
            :rows="2"
            disabled
            type="textarea"
            placeholder=""
        />
      </el-form-item>
    </el-form>
  </div>


</template>

<script>
import {defineComponent, toRef, ref, watch, onMounted, reactive} from "vue"

export default defineComponent({
  name: "DeviceFunction",
  props: {
    deviceMeta: {
      type: Object,
      required: true
    },
    functionData: {
      type: Object,
      required: false,
      default: () => ({loading: false, result: {},resultStr:''})
    }
  },
  emits: ["funcExecution"],
  setup(props, context) {
    const funcData = toRef(props, 'functionData')
    const meta = toRef(props, 'deviceMeta')
    const resultData = ref('无')
    const funcMeta = reactive([])
    const sendSelect = ref('')
    const sendData = reactive([])
    const sendResult = reactive([])

    watch(meta, value => {
      reloadMeta(value)
    })

    const reloadMeta = (value) => {
      if (value != null) {
        console.log('reloadMeta')
        funcMeta.length = 0
        funcMeta.push(...value.metadata.functions)
        if (funcMeta.length > 0) {
          sendSelect.value = funcMeta[0].id
          selectChange(sendSelect.value)
        }
      }
    }

    const selectChange = (value) => {
      console.log('selectChange:' + value)
      for (var i in funcMeta) {
        if (funcMeta[i].id == value) {
          sendData.length = 0
          sendData.push(...funcMeta[i].inputs)
          sendResult.length = 0
          sendResult.push(...funcMeta[i].outputs)
          break
        }
      }
      for (var index in sendData) {
        if (sendData[index].valueType.type == 'enum') {
          sendData[index].value = sendData[index].valueType.extra.enumData[0].key
        } else if (sendData[index].valueType.type == 'number') {
          sendData[index].value = 0
        } else {
          sendData[index].value = ''
        }
      }
      for (var index in sendResult) {
        if (sendResult[index].valueType.type == 'enum') {
          sendResult[index].value = sendResult[index].valueType.extra.enumData[0].key
        } else if (sendResult[index].valueType.type == 'number') {
          sendResult[index].value = 0
        } else {
          sendResult[index].value = ''
        }
      }
      console.log('selectChange:' + value)
    }
    const runClick = () => {
      console.log('runclick')
      const datas = []
      for (var item of sendData) {
        datas.push({id: item.id, value: item.value})
      }
      console.log(JSON.stringify(datas))
      context.emit('funcExecution', sendSelect.value, datas)
    }
    const receive = (result) => {
      resultData.value = result
    }

    onMounted(() => {
      reloadMeta(meta.value)
    })
    return {
      funcData,
      sendSelect,
      sendData,
      sendResult,
      funcMeta,
      resultData,
      runClick,
      selectChange,
      receive
    }
  }
})
</script>

<style scoped lang="scss">

@import url('../style/DeviceFunction.scss');

.el-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

</style>
<style scoped lang="scss">
@import "@/views/device/style/DeviceFunction.scss";
</style>
