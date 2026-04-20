<template>
  <div class="tab-pan-content">
    <el-main>
      <el-table
        height="100%"
        :data="data.deviceInstancePo.metadata.rules"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="name"
          :label="$t('deviceAlarm.ruleName')"
          width="200"
          header-align="center"
          align="center"
        />
        <el-table-column
          :label="$t('deviceAlarm.triggerType')"
          width="200"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            {{ scope.row.ruleData.type === "time" ? $t('deviceAlarm.periodic') : $t('deviceAlarm.scheduled') }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('deviceAlarm.pollingPeriod')" header-align="center" align="center">
          <template #default="scope">
            {{ handlerCroe(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('deviceAlarm.thresholdCount')" header-align="center" align="center">
          <template #default="scope">
            {{ handerCount(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('common.status')"
          width="80"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            <el-tag style="margin-left: 5px" type="warning">
              {{ scope.row.state === 1 ? $t('deviceAlarm.started') : $t('deviceAlarm.stopped') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column header-align="center" align="center">
          <template #header>
            <el-button class="login_btn" type="primary" @click="add()">
              <el-icon><Plus /></el-icon>{{ $t('deviceAlarm.addRule') }}
            </el-button>
          </template>
          <template #default="scope">
            <el-button-group>
              <el-button type="primary" @click="rowClick(scope.row)">
                {{ $t('common.edit') }}
              </el-button>
              <el-button @click="deleteClick(scope.row)">{{ $t('common.delete') }}</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </div>

  <el-dialog v-model="deleteDialogVisible" :title="$t('common.tip')" width="400px">
    <span>{{ $t('deviceAlarm.deleteConfirm') }}</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmDelete">{{ $t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { defineComponent, getCurrentInstance, onMounted, reactive, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import cronstrue from "cronstrue/i18n";
import { randomIds } from "@/util/common/randomUtil.js";

export default defineComponent({
  name: "DeviceAlarm",
  props: {
    deviceData: {
      type: Object,
      required: false,
    },
  },
  emits: ["open", "updateMeta"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const { t, locale } = useI18n();
    const pageData = reactive([]);
    const loading = ref(true);
    const data = toRef(props, "deviceData");
    const deviceInfo = ref(data.value.deviceInstancePo);
    const deleteDialogVisible = ref(false);
    const selectedRow = ref(null);

    const rowClick = (row) => {
      console.log("click->" + row.id);
      apiInfo(row.id);
    };

    const deleteClick = (row) => {
      console.log("deleteClick->" + row.id);
      selectedRow.value = row;
      deleteDialogVisible.value = true;
    };

    const confirmDelete = () => {
      const metadata = JSON.parse(JSON.stringify(deviceInfo.value.metadata));
      metadata.rules = metadata.rules.filter((item) => item.id !== selectedRow.value.id);
      context.emit("updateMeta", metadata);
      deleteDialogVisible.value = false;
    };

    const apiInfo = (id) => {
      proxy.$http
        .deviceAlarmParse({ ruleId: id, deviceId: deviceInfo.value.id })
        .then((response) => {
          console.log(JSON.stringify(response.data));
          context.emit("open", response.data);
        });
    };

    const handlerCroe = (row) =>
      cronstrue.toString(row.ruleData.cron, { locale: locale.value === "zh-CN" ? "zh_CN" : "en" });

    const handerCount = (row) => t("deviceAlarm.thresholdCountValue", { count: row.ruleData.count });

    const add = () => {
      console.log("add");
      const idList = (deviceInfo.value?.metadata?.rules || [])
        .map((item) => item.id)
        .filter((id) => typeof id === "string" && id.length > 0);
      context.emit("open", {
        columns: [],
        ruleDtos: [],
        rulePo: {
          id: randomIds(idList),
          state: 0,
          name: "",
          deviceId: data.value.deviceInstancePo.id,
          ruleData: { type: "time", count: 0, cron: "" },
          ruleMeta: {
            sql: "select *",
            param: {},
          },
        },
        notifyDtos: [],
      });
    };

    onMounted(() => {
      console.log("device alarm");
    });

    return {
      loading,
      data,
      deviceInfo,
      pageData,
      rowClick,
      handlerCroe,
      handerCount,
      deleteClick,
      add,
      deleteDialogVisible,
      confirmDelete,
    };
  },
});
</script>

<style scoped>
@import url("../style/tab-content.css");

.form-title {
  margin: 10px;
}

.el-descriptions {
  background: #ffffff;
}

.el-main {
  height: 88%;
}

.el-footer {
  height: 10%;
}
</style>
