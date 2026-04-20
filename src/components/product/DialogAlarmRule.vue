<template>
  <el-dialog
    v-model="sourcestatus"
    :title="$t('alarmRule.editTitle')"
    :show-close="false"
    @close="closeHandler"
    class="gload-dialog"
  >
    <el-form label-position="left" label-width="auto" v-model="sourceAlarm">
      <el-form-item :label="$t('common.name')">
        <el-input v-model="sourceAlarm.rulePo.name"></el-input>
      </el-form-item>
      <el-form-item :label="$t('alarmRule.workState')">
        <el-radio-group size="small" v-model="sourceAlarm.rulePo.state">
          <el-radio-button :label="$t('alarmRule.stateStart')" :value="1" />
          <el-radio-button :label="$t('alarmRule.stateClose')" :value="0" />
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('alarmRule.triggerMethod')">
        <el-radio-group size="small" v-model="sourceAlarm.rulePo.ruleData.type">
          <el-radio-button label="time" value="time" />
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('alarmRule.pollInterval')">
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
      <el-form-item :label="$t('alarmRule.thresholdCount')">
        <el-input-number
          v-model="sourceAlarm.rulePo.ruleData.count"
          size="small"
          :min="0"
        ></el-input-number>
      </el-form-item>
      <el-form-item :label="$t('alarmRule.triggerCondition')">
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
  computed,
} from "vue";
import { Plus, Delete } from "@element-plus/icons-vue";
import ProductAlarmItem from "@/components/product/item/ProductAlarmItem.vue";
import { pollIntervalOptions, cronToSeconds } from "@/util/common/pollInterval";
import { useI18n } from 'vue-i18n';

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
            cronNum: '',
          },
        },
      }),
    },
  },
  emits: ["close", "reload", "save"],
  setup(props, context) {
    const { t } = useI18n();
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

    // 轮询周期选项（i18n 包装）
    const pollIntervalOptionsI18n = computed(() =>
      pollIntervalOptions.map(opt => ({
        ...opt,
        label: t('alarmDialog.pollIntervalSec', { n: opt.seconds }),
      }))
    );

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
          const processedData = JSON.parse(JSON.stringify(value));
          processedData.rulePo = processedData.rulePo || {};
          processedData.rulePo.ruleData = processedData.rulePo.ruleData || {};
          if (
            typeof processedData.rulePo.state === "undefined" ||
            processedData.rulePo.state === null
          ) {
            processedData.rulePo.state = 0;
          }

          // 如果有 cron 值，直接作为轮询周期下拉值
          if (processedData.rulePo?.ruleData?.cron) {
            processedData.rulePo.ruleData.cronNum = processedData.rulePo.ruleData.cron;
          } else {
            processedData.rulePo.ruleData.cronNum = pollIntervalOptions[0].value;
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
                cronNum: pollIntervalOptions[0].value,
              },
            },
          };
        }
      },
      { deep: true, immediate: true }
    );

    // 监听轮询周期变化，同步 cron 表达式
    watch(
      () => sourceAlarm.value.rulePo?.ruleData?.cronNum,
      (newVal) => {
        if (newVal != null && newVal !== '') {
          sourceAlarm.value.rulePo.ruleData.cron = newVal;
        }
      },
      { immediate: true }
    );

    const alarmColumn = ref([]);
    watch(sourceAlarm, (value) => {
      alarmColumn.value.length = 0;
      alarmColumn.value.push(...value.columns);
      console.log("change alarmColumn");
      if (alarmNotifys.value != null) {
        console.log("sourcestatus change:");
        alarmNotifys.value.initFun();
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
      alarmColumn,
      sourceproduct,
      sourcestatus,
      sourceAlarm,
      addGroup,
      delGroup,
      saveAlarm,
      closeHandler,
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
  background-color: #42b983;
}
.text-style {
  color: #2c3e50;
  font-size: 20ex;
}
::v-deep .el-dialog {
  background-color: #42b983;
}
:deep(.el-dialog.gload-dialog .el-dialog__body) {
  height: calc(100% - 72px) !important;
}
</style>
