<template>
  <el-dialog
    v-model="sourcestatus"
    :title="$t('alarmDialog.edit')"
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
      <el-form-item :label="$t('common.name')">
        <el-input v-model="sourceAlarm.rulePo.name"></el-input>
      </el-form-item>
      <el-form-item :label="$t('common.status')">
        <el-radio-group v-model="sourceAlarm.rulePo.state">
          <el-radio :value="0">{{ $t('alarmDialog.closeState') }}</el-radio>
          <el-radio :value="1">{{ $t('alarmDialog.open') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('alarmDialog.triggerMethod')">
        <el-radio-group size="small" v-model="sourceAlarm.rulePo.ruleData.type">
          <el-radio-button label="time" value="time" />
          <!-- <el-radio-button label="cron" value="cron" /> -->
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('tabProductRule.pollInterval')">
        <el-select
          v-model="sourceAlarm.rulePo.ruleData.cronNum"
          size="small"
          style="width: 120px"
        >
          <el-option
            v-for="item in pollIntervalOptionsI18n"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('alarmDialog.thresholdCount')">
        <el-input-number
          v-model="sourceAlarm.rulePo.ruleData.count"
          size="small"
          :min="1"
        ></el-input-number>
      </el-form-item>
      <el-form-item :label="$t('alarmDialog.triggerCondition')">
        <AlarmItem
          ref="alarmItems"
          :deviceData="sourceDevice"
          v-for="(columns, key) in alarmColumn"
          @delGroup="delGroup(columns)"
          :key="getAlarmGroupKey(columns)"
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
      <el-form-item :label="$t('alarmDialog.handleMethod')">
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
        <el-button @click="closeHandler">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveAlarm">{{ $t('common.save') }}</el-button>
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
import { pollIntervalOptions, cronToSeconds } from "@/util/common/pollInterval";
import { useI18n } from "vue-i18n";

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
  emits: ["close", "reload", "save"],
  setup(props, context) {
    const { t } = useI18n();
    const { proxy } = getCurrentInstance();
    const sourceDevice = toRef(props, "deviceData");
    const sourcestatus = toRef(props, "status");
    const alarmItems = ref([]);
    const notifyConfig = reactive([]);
    const alarmNotifys = ref(null);
    const notifyTemplateUser = reactive([]);
    const ruleNotifyData = reactive([]);
    const alarmColumn = ref([]);
    const alarmGroupKeys = new WeakMap();
    let alarmGroupKeySeed = 0;

    const getAlarmGroupKey = (columns) => {
      if (!alarmGroupKeys.has(columns)) {
        alarmGroupKeys.set(columns, ++alarmGroupKeySeed);
      }
      return alarmGroupKeys.get(columns);
    };

    // 轮询周期选项（i18n 包装）
    const pollIntervalOptionsI18n = computed(() =>
      pollIntervalOptions.map(opt => ({
        ...opt,
        label: t('alarmDialog.pollIntervalSec', { n: opt.seconds }),
      }))
    );

    // 创建一个响应式的本地数据副本，而不是直接使用props的引用
    const sourceAlarm = ref({
      columns: [],
      notifyDtos:[],
      rulePo: {
        ruleData: {
          type: "",
          cron: "",
          count: 0
        },
      },
    });

    // 采集时间不能大于轮询周期（采集时间单位为秒）
    const collectTimeMax = computed(() => {
      const { cronNum } = sourceAlarm.value.rulePo?.ruleData || {};
      return cronToSeconds(cronNum);
    });

    watch(
      () => props.alarmData,
      (value) => {
        console.log("alarmData changed:", value);
        if (value) {
          // 深拷贝数据
          const processedData = JSON.parse(JSON.stringify(value));

          // 如果有 cron 值，直接作为轮询周期下拉值
          if (processedData.rulePo?.ruleData?.cron) {
            processedData.rulePo.ruleData.cronNum = processedData.rulePo.ruleData.cron;
          } else {
            processedData.rulePo.ruleData.cronNum = pollIntervalOptions[0].value;
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
                count: 0,
                cronNum: pollIntervalOptions[0].value,
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

    // 监听轮询周期变化，同步 cron 表达式
    watch(
      () => sourceAlarm.value.rulePo?.ruleData?.cronNum,
      (newVal) => {
        if (newVal != null && newVal !== '') {
          sourceAlarm.value.rulePo.ruleData.cron = newVal;
          console.log("cronNum 变化，同步 cron:", newVal);
        }
      },
      { immediate: true }
    );

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
    const delGroup = (columns) => {
      const index = alarmColumn.value.indexOf(columns);
      if (index < 0) return;
      alarmColumn.value.splice(index, 1);
      console.log("delGroup");
    };

    const closeHandler = () => {
      console.log("closeHandler");
      context.emit("close");
    };
    const saveAlarm = () => {
      const ruleData = sourceAlarm.value.rulePo?.ruleData || {};
      const cycleSec = cronToSeconds(ruleData.cronNum);

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
      if (!sourceAlarm.value.rulePo.name?.trim()) {
        ElMessage.error(t("alarmDialog.nameRequired"));
        return;
      }
      if (data.columns.length === 0) {
        ElMessage.error(t("alarmDialog.conditionRequired"));
        return;
      }
      const notifyD = toRaw(alarmNotifys.value.notifyD);
      const delMap = toRaw(alarmNotifys.value.delMap);
      for (var item of notifyD) {
        const { configId, ...rest } = item;
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
      context.emit("save", data);
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
      getAlarmGroupKey,
      addGroup,
      delGroup,
      saveAlarm,
      closeHandler,
      notifyTemplateUser,
      collectTimeMax,
      pollIntervalOptionsI18n,
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
