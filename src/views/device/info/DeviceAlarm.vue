<template>
  <div class="tab-pan-content">
    <el-main>
      <el-table
        height="100%"
        :data="pageData"
        v-loading="loading"
        stripe
        @row-click="rowClick"
        style="width: 100%"
      >
        <el-table-column
          prop="id"
          label="规则ID"
          width="80"
          header-align="center"
          align="center"
        />
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
        <el-table-column
          label="规则"
          width="200"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            {{ handlerCroe(scope.row) }}
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
        <el-table-column label="操作" header-align="center" align="center">
        </el-table-column>
        <template #empty>
          <el-empty :image-size="60"></el-empty>
        </template>
      </el-table>
    </el-main>
    <el-footer>
      <div class="center-flex-contain">
        <el-pagination
          background
          layout="prev, pager, next"
          @current-change="pageChange"
          :total="pageTotal"
        >
        </el-pagination>
      </div>
    </el-footer>
  </div>
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
import { useRouter } from "vue-router";

export default defineComponent({
  name: "DeviceAlarm",
  props: {
    deviceData: {
      type: Object,
      required: false,
    },
  },
  emits: ["open"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const pageData = reactive([]);
    const pageSize = ref(10);
    const pageIndex = ref(1);
    const pageTotal = ref(0);
    const loading = ref(true);
    const data = toRef(props, "deviceData");
    const deviceInfo = ref(data.value.deviceInstancePo);

    const rowClick = (row, column, event) => {
      console.log("click->" + row.id);
      apiInfo(row.id);
    };

    const reloadApi = () => {
      pageSize.value = 10;
      pageIndex.value = 1;
      pageTotal.value = 0;
      loadApi();
    };

    const loadApi = () => {
      loading.value = true;
      proxy.$http
        .deviceAlarmPage({
          current: pageIndex.value,
          size: pageSize.value,
          terms: [{ column: "t.device_id", value: deviceInfo.value.id }],
        })
        .then((response) => {
          console.log(JSON.stringify(response.data.records));
          pageData.length = 0;
          pageData.push(...response.data.records);
          loading.value = false;
        });
    };
    const apiInfo = (id) => {
      proxy.$http.deviceAlarmParse({ id: id }).then((response) => {
        console.log(JSON.stringify(response.data));
        context.emit("open", response.data);
      });
    };
    const handlerCroe = (item) => {
      if (item.ruleData.type == "time") {
        return item.ruleData.time + "秒内触发" + item.ruleData.count + "次";
      } else {
        return "未知";
      }
    };
    const pageChange = (current) => {
      console.log("pageChange" + current);
      pageIndex.value = current;
      loadApi();
    };
    onMounted(() => {
      console.log("device alarm");
      loadApi();
    });
    return {
      reloadApi,
      loading,
      deviceInfo,
      pageTotal,
      pageData,
      pageChange,
      rowClick,
      handlerCroe,
      loadApi,
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
