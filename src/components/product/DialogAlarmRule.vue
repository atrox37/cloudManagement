<template>
  <el-dialog
    v-model="sourcestatus"
    title="编辑"
    :show-close="false"
    @close="closeHandler"
    class="gload-dialog"
  >
    <el-form label-position="left" label-width="auto" v-model="sourceAlarm">
      <el-form-item label="名称">
        <el-input v-model="sourceAlarm.rulePo.name"></el-input>
      </el-form-item>
      <!-- <el-form-item label="工作状态">
        <el-radio-group size="small" v-model="sourceAlarm.rulePo.state">
          <el-radio-button label="启动" value="1" />
          <el-radio-button label="关闭" value="0" />
        </el-radio-group>
      </el-form-item> -->
      <el-form-item label="触发方式">
        <el-radio-group size="small" v-model="sourceAlarm.rulePo.ruleData.type">
          <el-radio-button label="time" value="time" />
          <!-- <el-radio-button label="cron" value="cron" /> -->
        </el-radio-group>
      </el-form-item>
      <el-form-item label="轮询周期">
        <el-input-number
          v-model="sourceAlarm.rulePo.ruleData.cronNum"
          size="small"
        ></el-input-number>
        <el-select
          size="small"
          v-model="sourceAlarm.rulePo.ruleData.cronJg"
          style="margin-left: 10px; width: 100px"
        >
          <el-option label="每秒" value="秒"></el-option>
          <el-option label="每分钟" value="分钟"></el-option>
          <el-option label="每小时" value="小时"></el-option>
          <el-option label="每天" value="天"></el-option>
          <el-option label="每周" value="周"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="采集时间">
        <div v-if="sourceAlarm.rulePo.ruleData.type == 'time'">
          <el-input-number
            v-model="sourceAlarm.rulePo.ruleData.collTime"
            size="small"
          ></el-input-number>
        </div>

        <!-- <div v-if="sourceAlarm.rulePo.ruleData.type == 'cron'">
          <el-input v-model="sourceAlarm.rulePo.ruleData.cron"></el-input>
        </div> -->
      </el-form-item>
      <el-form-item label="阈值次数">
        <el-input-number
          v-model="sourceAlarm.rulePo.ruleData.count"
          size="small"
        ></el-input-number>
      </el-form-item>
      <el-form-item label="触发条件">
        <ProductAlarmItem
          ref="alarmItems"
          :productData="sourceproduct"
          v-for="(columns, key) in alarmColumn"
          @delGroup="delGroup(key)"
          :key="key"
          :alarmData="columns"
          style="
            width: 100%;
            height: auto;
            padding: 0;
            margin: 5px 0 0 0;
            overflow: hidden;
          "
        ></ProductAlarmItem>
        <el-row style="width: 100%">
          <el-col :span="24" class="center-flex-contain" style="padding: 5px">
            <el-button
              type="primary"
              icon="Plus"
              size="small"
              @click="addGroup"
            />
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="right-flex-contain">
        <el-button @click="closeHandler">取消</el-button>
        <el-button type="primary" @click="saveAlarm">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import {
  ref,
  reactive,
  defineComponent,
  watch,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  toRef,
  getCurrentInstance,
} from "vue";
import { Plus, Delete } from "@element-plus/icons-vue";
import ProductAlarmItem from "@/components/product/item/ProductAlarmItem.vue";
import cronstrue from "cronstrue/i18n";
import { ElMessage } from "element-plus";
export default defineComponent({
  name: "DialogAlarmRule",
  components: { ProductAlarmItem },
  props: {
    status: {
      type: Boolean,
      required: true,
      default: false,
    },
    productData: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    alarmData: {
      type: Object,
      required: false,
      default: () => ({
        columns: [],
        rulePo: { ruleData: { type: "", cron: "", collTime: 0, count: 0 } },
      }),
    },
  },
  emits: ["close", "reload","save"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const sourceproduct = toRef(props, "productData");
    const sourceAlarm = ref({
      columns: [],
      rulePo: { ruleData: { type: "", cron: "", collTime: 0, count: 0 } },
    });
    const sourcestatus = toRef(props, "status");
    const alarmItems = ref([]);
    const notifyConfig = reactive([]);
    const alarmNotifys = ref(null);
    // const ruleNotifyData = reactive([]);
    const handlerCroe = (cron) => {
      try {
        if (!cron || typeof cron !== "string") {
          return cron || "";
        }
        // 检查是否是有效的cron表达式（至少5个部分）
        const cronParts = cron.trim().split(/\s+/);
        if (cronParts.length < 5) {
          console.warn("无效的cron表达式:", cron);
          return cron;
        }
        return cronstrue.toString(cron, { locale: "zh_CN" });
      } catch (error) {
        console.warn("处理cron表达式失败:", error, "原始值:", cron);
        return cron || "";
      }
    };

    watch(
      () => props.alarmData,
      (value) => {
        console.log("alarmData changed:", value);
        if (value) {
          // 深拷贝数据
          const processedData = JSON.parse(JSON.stringify(value));

          // 如果有 cron 值，通过 handlerCroe 方法处理
          if (processedData.rulePo?.ruleData?.cron) {
            const cronDescription = handlerCroe(
              processedData.rulePo.ruleData.cron
            );
            // 将处理后的描述保存到新的字段中，保留原始cron值
            const arr = cronDescription.split(" ");
            processedData.rulePo.ruleData.cronNum = parseFloat(arr[1]);
            processedData.rulePo.ruleData.cronJg = arr[2];
          }

          sourceAlarm.value = processedData;
        } else {
          sourceAlarm.value = {
            columns: [],
            rulePo: { ruleData: { type: "", cron: "", collTime: 0, count: 0 } },
          };
        }
      },
      { deep: true, immediate: true }
    );
    const alarmColumn = ref([]);
    watch(sourceAlarm, (value) => {
      alarmColumn.value.length = 0;
      alarmColumn.value.push(...value.columns);
      // ruleNotifyData.length = 0;
      // ruleNotifyData.push(...value.ruleDtos);
      console.log("change alarmColumn");
      if (alarmNotifys.value != null) {
        console.log("sourcestatus change:");
        alarmNotifys.value.initFun();
      }
    });

    /*watch(sourcestatus,value=>{
                if(value&&alarmNotifys.value!=null){
                    console.log("sourcestatus change:")
                    //alarmNotifys.value.initFun()
                }
            })*/

    const apiNotifyConfig = () => {
      proxy.$http.notifyPage({ size: -1 }).then((value) => {
        notifyConfig.length = 0;
        notifyConfig.push(...value.data.records);
        console.log("apiNotifyConfig");
      });
    };

    const addGroup = () => {
      alarmColumn.value.push([]);
    };
    const delGroup = (index) => {
      alarmColumn.value.splice(index, 1);
      console.log("delGroup");
    };

    const closeHandler = () => {
      console.log("closeHandler");
      context.emit("close");
    };
    const saveAlarm = () => {
      console.log("saveAlarm");
      context.emit("save",sourceAlarm.value)
    };

    onMounted(() => {
      alarmColumn.value.length = 0;
      if (sourceAlarm != null && sourceAlarm.value != null) {
        alarmColumn.value.push(...sourceAlarm.value.columns);
      }
      apiNotifyConfig();
    });
    onUpdated(() => {
      if (alarmNotifys.value != null) alarmNotifys.value.cleanCache();
    });

    return {
      notifyConfig,
      alarmNotifys,
      alarmItems,
      // ruleNotifyData,
      alarmColumn,
      sourceproduct,
      sourcestatus,
      sourceAlarm,
      addGroup,
      delGroup,
      saveAlarm,
      closeHandler,
    };
  },
});
</script>
<style scoped lang="scss">
.dialog-alarm .el-dialog {
  border-radius: 20px;
  --el-dialog-width: 80%;
  // height: 30%;
  background-color: #42b983;
}
.text-style {
  color: #2c3e50;
  font-size: 20ex;
}
::v-deep .el-dialog {
  // height: 30%;
  background-color: #42b983;
}
:deep(.el-dialog.gload-dialog .el-dialog__body) {
  height: calc(100% - 72px) !important;
}
</style>
