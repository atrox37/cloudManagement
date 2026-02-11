<template>
  <el-dialog
    v-model="sourcestatus"
    title="编辑"
    :show-close="false"
    @close="closeHandler"
    class="gload-dialog"
  >
    <el-form
      label-position="left"
      label-width="auto"
      v-model="sourceAlarm"
      label-
    >
      <el-form-item label="名称">
        <el-input v-model="sourceAlarm.rulePo.name"></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="sourceAlarm.rulePo.state">
          <el-radio :value="0">关闭</el-radio>
          <el-radio :value="1">打开</el-radio>
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
      <el-form-item label="采集时间(秒)">
        <div v-if="sourceAlarm.rulePo.ruleData.type == 'time'">
          <el-input-number
            v-model="sourceAlarm.rulePo.ruleData.collTime"
            size="small"
            :min="0"
            :max="collectTimeMax"
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
          :min="0"
        ></el-input-number>
      </el-form-item>
      <el-form-item label="触发条件">
        <AlarmItem
          ref="alarmItems"
          :deviceData="sourceDevice"
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
        ></AlarmItem>
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
      <el-form-item label="处理方式">
        <!-- <el-select
          v-model="notifyTemplateUserPo"
          placeholder="请选择下发用户（通知）"
          multiple
        >
          <el-option
            v-for="item in notifyTemplateUser"
            :key="item.templateUserPo.id"
            :label="item.templateUserPo.name"
            :value="item.templateUserPo.id"
          />
        </el-select> -->
        <!-- <div class="dispose">
            <div class="dispose-notify">133</div>
            <div class="dispose-function">133</div>
        </div> -->
        <!--<AlarmHandlerItem ref="alarmNotifys" v-for="(item,index) in ruleNotifyData" :key="index" :notifyPo="item" :deviceData="sourceDevice"></AlarmHandlerItem>-->
        <AlarmHandler
          ref="alarmNotifys"
          :rulePo="sourceAlarm.rulePo"
          :deviceData="sourceDevice"
          :notifyData="ruleNotifyData"
        ></AlarmHandler>
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
  toRaw,
  watchEffect,
  computed
} from "vue";
import { Plus, Delete } from "@element-plus/icons-vue";
import AlarmItem from "@/components/device/item/AlarmItem.vue";
import AlarmHandlerItem from "@/components/device/item/AlarmHandlerItem.vue";
import AlarmNotify from "@/components/device/item/AlarmNotify.vue";
import AlarmHandler from "@/components/device/item/AlarmHandler Copy.vue";
import { ElMessage } from "element-plus";
import { quickConvert, cronToDescription } from "@/util/cron/cronConverter";

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

export default defineComponent({
  name: "DialogAlarm",
  components: { AlarmItem, AlarmHandlerItem, AlarmNotify, AlarmHandler },
  props: {
    status: {
      type: Boolean,
      required: true,
      default: false,
    },
    deviceData: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    alarmData: {
      type: Object,
      required: false,
      default: () => ({ columns: [],notifyDtos:[], rulePo: { ruleData: {},ruleMeta:{sql:"",param:{}} } }),
    },
  },
  emits: ["close", "reload"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const sourceDevice = toRef(props, "deviceData");
    const sourcestatus = toRef(props, "status");
    const alarmItems = ref([]);
    const notifyConfig = reactive([]);
    const alarmNotifys = ref(null);
    const notifyTemplateUser = reactive([]);
    const ruleNotifyData = reactive([]);
    // const notifyTemplateUserPo = reactive([]);
    const alarmColumn = ref([]);

    // 创建一个响应式的本地数据副本，而不是直接使用props的引用 cronNum cronJg
    const sourceAlarm = ref({
      columns: [],
      notifyDtos:[],
      rulePo: {
        ruleData: {
          type: "",
          cron: "",
          collTime: 0,
          count: 0
        },
      },
    });

    // 采集时间不能大于轮询周期（采集时间单位为秒）
    const collectTimeMax = computed(() => {
      const { cronNum = 0, cronJg = "秒" } = sourceAlarm.value.rulePo?.ruleData || {};
      // 转为秒
      return isNaN(Number(cronNum)) ? 0 : intervalToSeconds(cronNum, cronJg);
    });


    watch(
      () => props.alarmData,
      (value) => {
        console.log("alarmData changed:", value);
        if (value) {
          // 深拷贝数据
          const processedData = JSON.parse(JSON.stringify(value));

          // 如果有 cron 值，通过 handlerCroe 方法处理
          if (processedData.rulePo?.ruleData?.cron) {
            const cronDescription = cronToDescription(
              processedData.rulePo?.ruleData?.cron
            );
            // 将处理后的描述保存到新的字段中，保留原始cron值
            const arr = cronDescription.split(" ");
            processedData.rulePo.ruleData.cronNum = parseFloat(arr[0]);
            processedData.rulePo.ruleData.cronJg = arr[1];
          }else{
            processedData.rulePo.ruleData.cronNum = 1;
            processedData.rulePo.ruleData.cronJg = "秒";
          }

          sourceAlarm.value = processedData;


          alarmColumn.value.length = 0;
          alarmColumn.value.push(...processedData.columns);
          ruleNotifyData.length = 0;
          ruleNotifyData.push(...processedData.notifyDtos);
        } else {
          sourceAlarm.value = {
            columns: [],
            rulePo: {
              ruleData: {
                type: "",
                cron: "",
                collTime: 0,
                count: 0,
                cronNum: 1,
                cronJg: "秒",
              },
            },
          };
        }
      },
      { deep: true, immediate: true }
    );

    watch(sourcestatus,value=>{
      if(!value){
        alarmNotifys.value.clearNotifyD();
      }
    })
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
      // 在保存之前再次校验采集时间
      const ruleData = sourceAlarm.value.rulePo?.ruleData || {};
      const cronNum = parseFloat(ruleData.cronNum);
      const collTime = parseFloat(ruleData.collTime);
      const cronJg = ruleData.cronJg || "秒";
      const cycleSec = intervalToSeconds(cronNum, cronJg);
      // collTime 是秒，不需要转换
      if (collTime > cycleSec) {
        ElMessage.error("采集时间不能大于轮询周期！");
        return;
      }

      var data = {
        deviceId: sourceDevice.value.deviceInstancePo.id,
        ruleModel: sourceAlarm.value.rulePo,
        columns: [],
        ruleMeta: [],
        delMeta: [],
      };
      for (var item of alarmItems.value) {
        if (item.getProperty().length > 0) {
          data.columns.push(item.getProperty());
        }
      }
      const notifyD = toRaw(alarmNotifys.value.notifyD);
      const delMap = toRaw(alarmNotifys.value.delMap);
      for (var item of notifyD) {
        // 排除不需要的字段（configId是UI用的）
        const { configId, ...rest } = item;
        
        // 处理handlerType，确保是字符串
        if (rest.handlerType && typeof rest.handlerType !== 'string') {
          rest.handlerType = rest.handlerType.value || rest.handlerType || 'notify';
        }
        rest.deviceId=sourceDevice.value.deviceInstancePo.id
        rest.ruleId=sourceAlarm.value.rulePo.id

        const str = item.userId + "," + item.templateId;
        if (delMap.has(str)) {
          rest.id = delMap.get(str);
          delMap.delete(str);
        }
        data.ruleMeta.push(rest);
      }
      data.delMeta.push(...delMap.values());
      console.log("saveAlarm");

      proxy.$http.deviceAlarmUpdate(data).then((value) => {
        console.log("保存成功");
        ElMessage({
          showClose: true,
          message: "修改成功",
          type: "success",
        });
        context.emit("reload");
      });
    };

    onMounted(() => {
      alarmColumn.value.length = 0;
      if (sourceAlarm != null && sourceAlarm.value != null) {
        alarmColumn.value.push(...sourceAlarm.value.columns);
      }
      apiNotifyConfig();
    });

    return {
      notifyConfig,
      alarmNotifys,
      alarmItems,
      ruleNotifyData,
      alarmColumn,
      sourceDevice,
      sourcestatus,
      sourceAlarm,
      addGroup,
      delGroup,
      saveAlarm,
      closeHandler,
      notifyTemplateUser,
      collectTimeMax,
    };
  },
});
</script>
<style scoped lang="scss">
.dialog-alarm .el-dialog {
  border-radius: 20px;
  --el-dialog-width: 80%;
  height: 40%;
  background-color: #42b983;
}
.text-style {
  color: #2c3e50;
  font-size: 20ex;
}
::v-deep .el-dialog {
  height: 40%;
  background-color: #42b983;
}
</style>
