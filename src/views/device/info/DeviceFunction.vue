<template>
  <div class="tab-pan-content">
    <el-row class="tiny-row">
      <el-col :span="6">
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
              <el-form size="small" style="width: 100%">
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
            <el-form style="width: 100%">
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
      </el-col>
      <el-col :span="18">
        <el-container class="tiny-container">
          <el-main>
            <el-table :data="query.records" stripe border>
              <el-table-column prop="ts"
                               label="时间"
                               header-align="center"
                               align="center"
                               width="320">
                <template #header>
                  <div class="center-flex-contain">
                    <el-date-picker
                      v-model="pickTime"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始"
                      end-placeholder="结束"
                      size="small" />
                  </div>
                </template>
              </el-table-column>

              <el-table-column
                label="功能"
                width="200"
                align="center"
                header-align="center" >
                <template #default="scope">
                  <el-text>{{scope.row.func}}</el-text>
                </template>
              </el-table-column>
              <el-table-column
                label="请求状态"
                align="center"
                header-align="center">
                <template #default="scope">
                  {{ scope.row.funcStatus }}
                </template>
              </el-table-column>
              <el-table-column
                label="发送数据"
                align="center"
                header-align="center">
                <template #default="scope">
                  {{ scope.row.sendData }}
                </template>
              </el-table-column>
              <el-table-column
                label="请求结果源文件"
                align="center"
                header-align="center">
                <template #default="scope">
                  {{ scope.row.resultData }}
                </template>
              </el-table-column>

            </el-table>
          </el-main>
          <el-footer>
            <div class="center-flex-contain">
              <el-pagination
                background
                :current-page="query.current"
                :size="query.size"
                :page-sizes="[10, 20, 50]"
                layout="total,sizes,prev, pager, next"
                @current-change="pageChange"
                @size-change="sizeChange"
                :total="query.total">
              </el-pagination>
            </div>
          </el-footer>
        </el-container>

      </el-col>
    </el-row>

  </div>


</template>

<script>
import { defineComponent, toRef, ref, watch, onMounted, reactive, getCurrentInstance } from "vue";
import { initPickTime, formatTs } from "@/util/common/pickTime";

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
    const { proxy } = getCurrentInstance();
    const funcData = toRef(props, 'functionData')
    const meta = toRef(props, 'deviceMeta')
    const resultData = ref('无')
    const funcMeta = reactive([])
    const sendSelect = ref('')
    const sendData = reactive([])
    const sendResult = reactive([])
    const pickTime = ref([]);
    const query = reactive({
      current: 1,
      size: 10,
      terms: [],
      loading: false,
      total: 0,
      records: [],
      sorts: [{ column: "ts", order: "desc" }]
    });

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
    watch(pickTime,v=>{
      queryApi()
    })
    const resetDate = () => {
      console.log("resetData");
      var date = initPickTime();
      pickTime.value = [date[0], date[1]];
    };
    const handlerRecord=()=>{
      console.log('handlerRecord')
    }
    const queryApi = () => {
      console.log('functionlog')
      query.loading = true;
      query.terms.length = 0;
      query.terms.push({ column: "device_id",termType: "eq", value: meta.value.id })
      query.terms.push({ column: "ts", termType: "gt", value: formatTs(pickTime.value[0]) });
      query.terms.push({ column: "ts", termType: "lte", value: formatTs(pickTime.value[1]) });
      proxy.$http.deviceFuntionLog(query).then(value => {
        query.loading = false;
        console.log("deviceAlarmLog");
        query.total = value.data.total;
        query.records.length = 0;
        query.records.push(...value.data.records);
        handlerRecord()
      }, error => {
        query.loading = false;
      });
    };
    const pageChange = (current) => {
      query.current = current
      queryApi()
    }
    const sizeChange = (size)=>{
      query.size=size
      query.current=1
      queryApi()
    }

    onMounted(() => {
      reloadMeta(meta.value)
      resetDate()
    })
    return {
      pickTime,
      query,
      funcData,
      sendSelect,
      sendData,
      sendResult,
      funcMeta,
      resultData,
      sizeChange,
      pageChange,
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
