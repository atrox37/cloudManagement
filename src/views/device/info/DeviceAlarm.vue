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
          label="规则名称"
          width="200"
          header-align="center"
          align="center"
        />
        <el-table-column
          label="触发方式"
          width="200"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            {{ scope.row.ruleData.type == "time" ? "周期" : "定时" }}
          </template>
        </el-table-column>
        <el-table-column label="轮询周期" header-align="center" align="center">
          <template #default="scope">
            {{ handlerCroe(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="阈值次数" header-align="center" align="center">
          <template #default="scope">
            {{ handerCount(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="80"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            <el-tag style="margin-left: 5px" type="warning">{{
              scope.row.state == 1 ? "启动" : "关闭"
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column header-align="center" align="center">
          <template #header>
            <el-button @click="add()" class="login_btn" type="primary"
              ><el-icon><Plus /></el-icon>添加
            </el-button>
          </template>
          <template #default="scope">
            <el-button-group>
              <el-button @click="rowClick(scope.row)" type="primary">
                修改
              </el-button>
              <el-button @click="deleteClick(scope.row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </div>
  <el-dialog v-model="deleteDialogVisible" title="提示" width="400px">
    <span>确认删除该告警规则吗？</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDelete">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script>
import {
  defineComponent,
  watch,
  reactive,
  ref,
  getCurrentInstance,
  onMounted,
  toRef,
  defineExpose,
} from "vue";
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
    const pageData = reactive([]);
    const loading = ref(true);
    const data = toRef(props, "deviceData");
    const deviceInfo = ref(data.value.deviceInstancePo);
    const deleteDialogVisible = ref(false);
    const selectedRow = ref(null);

    const rowClick = (row, column, event) => {
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
      metadata.rules = metadata.rules.filter(
        (item) => item.id !== selectedRow.value.id
      );
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
      cronstrue.toString(row.ruleData.cron, { locale: "zh_CN" });
    const handerCount = (row) => "阈值" + row.ruleData.count + "次";
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
          }
        },
        notifyDtos:[]
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
