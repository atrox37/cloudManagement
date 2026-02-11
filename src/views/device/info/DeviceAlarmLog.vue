<template>
  <div class="tab-pan-content">
    <el-container>
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
                           label="告警名称"
                           width="200"
                           align="center"
                           header-align="center" >
            <template #default="scope">
              <el-text>{{ruleName(scope.row)}}</el-text>
            </template>


          </el-table-column>
          <el-table-column
            label="触发次数"
            align="center"
            header-align="center">
            <template #default="scope">
              {{ scope.row.ruleData.length }}次
            </template>
          </el-table-column>
          <el-table-column
            label="数据"
            align="center"
            header-align="center">
            <template #default="scope">
              {{ JSON.stringify(scope.row.ruleData) }}
            </template>
          </el-table-column>
          <el-table-column
            label="通知"
            align="center"
            header-align="center">
            <template #default="scope">
              <el-space wrap>
                <el-tag
                  v-for="item in replyView(scope.row, 'SUCCESS')"
                  :key="`success-${item.username}`"
                  type="success"
                >
                  发送{{ item.username }}-{{ item.count }}次
                </el-tag>
                <el-tag
                  v-for="item in replyView(scope.row, 'FAIL')"
                  :key="`fail-${item.username}`"
                  type="danger"
                >
                  发送{{ item.username }}-{{ item.count }}次
                </el-tag>
              </el-space>
            </template>
          </el-table-column>

          <el-table-column
            label="详情"
            align="center"
            header-align="center">
            <template #default="scope">
              <el-button @click="infoClick(scope.row)">详情</el-button>
            </template>
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
  </div>

  <el-dialog v-model="infoList.state" title="查看" :show-close="false" width="30%">
    <template #default>
      <el-table :data="infoList.data" stripe border>
        <el-table-column
          label="记录序号"
          align="center"
          header-align="center">
          <template #default="scope">
            <el-text>第{{scope.$index+1}}条数据</el-text>
          </template>
        </el-table-column>
        <el-table-column
          label="数据"
          align="center"
          header-align="center">
          <template #default="scope">
            <el-space wrap>
              <el-tag v-for="(item,index) in scope.row" :key="index">{{item.property}}:{{item.value}}</el-tag>
            </el-space>

          </template>
        </el-table-column>
      </el-table>
    </template>
    <template #footer>

    </template>

  </el-dialog>


</template>
<script>
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";
import { initPickTime, formatTs } from "@/util/common/pickTime";
import { deviceAlarmLog } from "@/util/request";

export default defineComponent({
  name: "DeviceAlarmLog",
  props:{
    deviceMeta: {
      type: Object,
      required: true
    }
  },
  setup(props, context) {
    const { proxy } = getCurrentInstance();
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
    const infoList=reactive({state:false,data:[]})

    watch(pickTime,v=>{
      queryApi()
    })
    const resetDate = () => {
      console.log("resetData");
      var date = initPickTime();
      pickTime.value = [date[0], date[1]];
    };
    const queryApi = () => {
      query.loading = true;
      query.terms.length = 0;
      query.terms.push({ column: "ts", termType: "gt", value: formatTs(pickTime.value[0]) });
      query.terms.push({ column: "ts", termType: "lte", value: formatTs(pickTime.value[1]) });
      proxy.$http.deviceAlarmLog(query).then(value => {
        query.loading = false;
        console.log("deviceAlarmLog");
        query.total = value.data.total;
        query.records.length = 0;
        query.records.push(...value.data.records);
      }, error => {
        query.loading = false;
      });
    };
    const ruleName=(row)=>{
      var name=''
      for(var item of props.deviceMeta.metadata.rules){
        if(item.id == row.ruleId){
          name=item.name
          break;
        }
      }
      return name
    }
    const initData = () => {
      console.log("initData");
      queryApi();
    };
    const infoClick=(row)=>{
      infoList.data.length=0
      const groupedList = [];
      if (Array.isArray(row.ruleData)) {
        for (const dataItem of row.ruleData) {
          const mappedItems = [];
          if (dataItem && typeof dataItem === "object") {
            for (const key of Object.keys(dataItem)) {
              const propMeta = props.deviceMeta?.metadata?.properties?.find(p => p.id === key);
              if (propMeta) {
                mappedItems.push({ property: propMeta.name, value: dataItem[key] });
              }
            }
          }
          groupedList.push(mappedItems);
        }
      }
      infoList.data.splice(0, infoList.length, ...groupedList);
      console.log('infoClick')
      infoList.state=true
    }
    const pageChange = (current) => {
      query.current = current
      queryApi()
    }
    const replyView = (row, state) => {
      let replyList = row?.ruleReply;
      if (typeof replyList === "string") {
        try {
          replyList = JSON.parse(replyList);
        } catch (e) {
          return [];
        }
      }
      if (!Array.isArray(replyList)) {
        return [];
      }
      const targetState = String(state || "").toUpperCase();
      const countMap = new Map();
      for (const item of replyList) {
        if (!item || item.type !== "notify") {
          continue;
        }
        if (String(item.state || "").toUpperCase() !== targetState) {
          continue;
        }
        const username = item.username || String(item.userId || "");
        if (!username) {
          continue;
        }
        countMap.set(username, (countMap.get(username) || 0) + 1);
      }
      return Array.from(countMap.entries()).map(([username, count]) => ({ username, count }));
    }
    const sizeChange = (size)=>{
      query.size=size
      query.current=1
      queryApi()
    }
    onMounted(() => {
      resetDate();
    });
    return {
      query,
      pickTime,
      infoList,
      initData,
      sizeChange,
      pageChange,
      ruleName,
      replyView,
      infoClick
    };
  }
});
</script>
<style scoped lang="scss">
@import "@/views/device/style/DeviceAlarmLog.scss";

:deep(.el-header) {
  padding: 10px 0 0 0;
}

:deep(.el-date-editor.el-input__wrapper) {
  width: 220px
}

</style>
