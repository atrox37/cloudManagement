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
      <el-form-item label="工作状态">
        <el-radio-group size="small" v-model="sourceAlarm.rulePo.state">
          <el-radio-button label="启动" :value="1" />
          <el-radio-button label="关闭" :value="0" />
        </el-radio-group>
      </el-form-item>
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
          :min="1"
        ></el-input-number>
        <el-select
          size="small"
          v-model="sourceAlarm.rulePo.ruleData.cronJg"
          style="margin-left: 10px; width: 100px"
        >
          <el-option label="秒" value="秒"></el-option>
          <el-option label="分" value="分"></el-option>
          <el-option label="时" value="时"></el-option>
          <el-option label="天" value="天"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="阈值次数">
        <el-input-number
          v-model="sourceAlarm.rulePo.ruleData.count"
          size="small"
          :min="0"
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
  watchEffect,
  computed,
} from "vue";
import { Plus, Delete } from "@element-plus/icons-vue";
import ProductAlarmItem from "@/components/product/item/ProductAlarmItem.vue";
import { quickConvert, cronToDescription } from "@/util/cron/cronConverter";
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
        rulePo: {
          state: 0,
          ruleData: {
            type: "",
            cron: "",
            count: 0,
            cronNum: 0,
            cronJg: "",
          },
        },
      }),
    },
  },
  emits: ["close", "reload", "save"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const sourceproduct = toRef(props, "productData");
    const sourceAlarm = ref({
      columns: [],
      rulePo: { state: 0, ruleData: { type: "", cron: "", count: 0 } },
    });
    const sourcestatus = toRef(props, "status");
    const alarmItems = ref([]);
    const notifyConfig = reactive([]);
    const alarmNotifys = ref(null);
    // 采集时间不能大于轮询周期（采集时间单位为秒）
    const collectTimeMax = computed(() => {
      const { cronNum = 0, cronJg = "秒" } =
        sourceAlarm.value.rulePo?.ruleData || {};
      // 转为秒
      return isNaN(Number(cronNum)) ? 0 : intervalToSeconds(cronNum, cronJg);
    });
    // 单位换算表
    const intervalToSeconds = (val, unit) => {
      let unitFactor = 1;
      switch (unit) {
        case "秒":
          unitFactor = 1;
          break;
        case "分":
          unitFactor = 60;
          break;
        case "时":
          unitFactor = 3600;
          break;
        case "天":
          unitFactor = 86400;
          break;
        default:
          unitFactor = 1;
      }
      return (parseFloat(val) || 0) * unitFactor;
    };
        watch(
      () => [
        sourceAlarm.value.rulePo?.ruleData?.cronNum,
        sourceAlarm.value.rulePo?.ruleData?.cronJg,
      ],
      ([cronNum, cronJg]) => {
        if (
          typeof cronNum === "undefined" || cronNum === null
        ) {
          return;
        }
        const cNum = parseFloat(cronNum);
        if (isNaN(cNum)) return;
        // 采集时间单位为秒，轮询周期要转换为秒
        const cycleSec = intervalToSeconds(cNum, cronJg || "秒");
      },
      { immediate: false }
    );
    watch(
      () => props.alarmData,
      (value) => {
        console.log("alarmData changed:", value);
        if (value) {
          // 深拷贝数据
          const processedData = JSON.parse(JSON.stringify(value));
          processedData.rulePo = processedData.rulePo || {};
          processedData.rulePo.ruleData = processedData.rulePo.ruleData || {};
          if (
            typeof processedData.rulePo.state === "undefined" ||
            processedData.rulePo.state === null
          ) {
            processedData.rulePo.state = 0;
          }

          // 如果有 cron 值，通过 handlerCroe 方法处理
          if (processedData.rulePo?.ruleData?.cron) {
            const cronDescription = cronToDescription(
              processedData.rulePo?.ruleData?.cron
            );
            // 将处理后的描述保存到新的字段中，保留原始cron值
            const arr = cronDescription.split(" ");
            processedData.rulePo.ruleData.cronNum = parseFloat(arr[0]);
            processedData.rulePo.ruleData.cronJg = arr[1];
          } else {
            processedData.rulePo.ruleData.cronNum = 1;
            processedData.rulePo.ruleData.cronJg = "秒";
          }

          sourceAlarm.value = processedData;
        } else {
          sourceAlarm.value = {
            columns: [],
            rulePo: {
              state: 0,
              ruleData: {
                type: "",
                cron: "",
                count: 0,
                cronNum: null,
                cronJg: null,
              },
            },
          };
        }
      },
      { deep: true, immediate: true }
    );

    watchEffect(() => {
      if (
        sourceAlarm.value.rulePo?.ruleData?.cronNum &&
        sourceAlarm.value.rulePo?.ruleData?.cronJg
      ) {
        sourceAlarm.value.rulePo.ruleData.cron = quickConvert(
          sourceAlarm.value.rulePo.ruleData.cronNum +
            " " +
            sourceAlarm.value.rulePo.ruleData.cronJg
        );
      }
    });
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
      sourceAlarm.value.columns = [];
      for (var item of alarmItems.value) {
        if (item.getProperty().length > 0) {
          sourceAlarm.value.columns.push(item.getProperty());
        }
      }
      context.emit("save", sourceAlarm.value);
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
      collectTimeMax
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
