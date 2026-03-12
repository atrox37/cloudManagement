<template>
  <el-container>
    <el-header>
      <div class="search-box">
        <el-form v-model="searchParams" :inline="true">
          <el-form-item v-for="(item,index) in searchParams" :label="item.label" :key="index">
            <el-input v-if="item.type == 'input'" v-model="item.value" placeholder="" clearable />
            <el-tree-select
              style="width: 220px;"
              v-if="item.type == 'tree'"
              v-model="item.value"
              :data="dimensionAllTree"
              check-strictly
              :render-after-expand="false">
              <template #empty>
                <el-empty description="暂无数据" />
              </template>
            </el-tree-select>
            <el-select v-if="item.type == 'select'" v-model="item.value" style="width:200px">
              <el-option v-for="(item,index) in item.select" :key="index" :label="item.name"
                         :value="item.type"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="queryClick">查询</el-button>
            <el-button type="info" @click="resetClick">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

    </el-header>
    <el-main>
      <el-table height="100%" :data="tableData" v-loading="page.loading" @row-click="rowClick" stripe border>
        <el-table-column prop="t1.networkConfigPo.name" label="名称" header-align="center" align="center" />
        <el-table-column prop="t1.networkConfigPo.type" label="类型" header-align="center" align="center" />
        <el-table-column prop="t1.sysDimensionPo.name" label="所属机构" header-align="center" align="center" />
        <el-table-column prop="t1.networkConfigPo.updateTime" label="更新日期" header-align="center" align="center" />
        <el-table-column label="开关状态" header-align="center" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.t1.networkConfigPo.state==1" effect="success">启动</el-tag>
            <el-tag v-if="scope.row.t1.networkConfigPo.state==0" effect="info">关闭</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="连接状态" header-align="center" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.t2 == 'SUCCESS'" effect="success">已连接</el-tag>
            <el-tag v-if="scope.row.t2 == 'FAIL'" effect="info" type="warning">未连接</el-tag>
            <el-tag v-if="scope.row.t2 == 'LOADING'" effect="error" type="warning">正在连接</el-tag>
          </template>
        </el-table-column>
        <el-table-column width="200">
          <template #header>
            <div class="center-flex-contain">
              <el-dropdown placement="top-start" @command="(command) => addClick(command)">
                <el-button>
                  <font-awesome-icon size="1x" :icon="['fasr', 'square-plus']" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
<!--                    <el-dropdown-item command="MQTT_SERVER">MQTT服务组件</el-dropdown-item>
                    <el-dropdown-item command="KAFKA">Kafka客户端</el-dropdown-item>-->
                    <el-dropdown-item command="MQTT_CLIENT">MQTT客户端</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
          <template #default="scope">
            <div class="center-flex-contain">
              <el-button @click.native.stop="deleteClick(scope.row,scope.$index)">
                <font-awesome-icon :icon="['fasr', 'trash']" />
              </el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :image-size=60></el-empty>
        </template>
      </el-table>
    </el-main>

    <el-footer>
      <div class="center-flex-contain">
        <el-pagination
          background
          layout="prev, pager, next"
          @current-change="pageChange"
          :total="page.total">
        </el-pagination>
      </div>
    </el-footer>
  </el-container>
  <MqttBrokerDrawer :data="drawMqttServerInfo" @submit="saveClick"></MqttBrokerDrawer>
  <KafkaBrokerDrawer :data="drawKafkaServerInfo" @submit="saveClick"></KafkaBrokerDrawer>
  <MqttClientDrawer :data="drawClientServerInfo" @submit="saveClick" @upload="upload"></MqttClientDrawer>

</template>

<script>
import { useRouter } from "vue-router";
import { onMounted, defineComponent, computed, getCurrentInstance, reactive, ref, watch, toRef } from "vue";
import MqttBrokerDrawer from "@/views/network/info/MqttBrokerDrawer.vue";
import KafkaBrokerDrawer from "@/views/network/info/KafkaBrokerDrawer.vue";
import MqttClientDrawer from "@/views/network/info/MqttClientDrawer.vue";
import { protocolType } from "@/model/protocol/ProtocolType";
import handlerDimensionTree from "@/util/dimension/DimensionTree";
import { ElMessage, ElMessageBox } from "element-plus";
import { uploadSSL } from "@/util/request";

export default defineComponent({
  name: "NetworkPage",
  components: { MqttBrokerDrawer, KafkaBrokerDrawer, MqttClientDrawer },
  setup() {
    const router = useRouter();
    const { proxy } = getCurrentInstance();
    const tableData = reactive([]);
    const searchParams = reactive([]);
    const page = reactive({ current: 1, size: 10, total: 0, loading: false, terms: [], sorts: [{ column: "t.update_time", order: "desc" }] });
    const drawMqttServerInfo = reactive({ saveloading: false, add: false, status: false, data: {} });
    const drawKafkaServerInfo = reactive({ saveloading: false, add: false, status: false, data: {} });
    const drawClientServerInfo = reactive({
      saveloading: false,
      add: false,
      icon: "Upload",
      upload: false,
      status: false,
      data: {}
    });
    const dimensionTree = ref([]);
    const dimensionAllTree = computed(() => {
      const rootTree = { value: -1, label: "全部", children: [] };
      rootTree.children.push(...dimensionTree.value);
      return [rootTree];
    });

    const resetParam = () => {
      const p = toRef(protocolType);
      searchParams.length = 0;
      searchParams.push({ column: "t.name", value: "", termType: "like", label: "名称", type: "input" });
      searchParams.push({ column: "t.org_id", value: -1, termType: "eq", label: "机构", type: "tree" });
      searchParams.push({
        column: "t.type",
        value: "",
        termType: "eq",
        label: "组件类型",
        type: "select",
        select: p.value
      });
    };

    const initData = () => {
      drawMqttServerInfo.saveloading = false;
      drawMqttServerInfo.add = false;
      drawMqttServerInfo.status = false;

      drawKafkaServerInfo.saveloading = false;
      drawKafkaServerInfo.add = false;
      drawKafkaServerInfo.status = false;

      drawClientServerInfo.saveloading = false;
      drawClientServerInfo.add = false;
      drawClientServerInfo.status = false;

      page.current = 1;
    };
    const dimensionApi = () => {
      dimensionTree.value.length = 0;
      proxy.$http.dimensionTree().then(value => {
        var tree = {};
        handlerDimensionTree(value.data, tree);
        dimensionTree.value.push(tree);
        console.log("dimensionTree");
      });
    };
    const requestApi = () => {
      page.loading = true;
      page.terms.length = 0;
      page.terms.push(...searchParams);
      for (var i = page.terms.length - 1; i >= 0; i--) {
        if (page.terms[i].column == "t.org_id" && page.terms[i].value < 0) {
          page.terms.splice(i, 1);
        } else if ((page.terms[i].column == "t.name" || page.terms[i].column == "t.type") && page.terms[i].value == "") {
          page.terms.splice(i, 1);
        }
      }
      proxy.$http.networkPage(page).then(value => {
        page.total = value.data.total;
        page.loading = false;
        tableData.length = 0;
        tableData.push(...value.data.records);
        for (let index in tableData) {
          tableData[index].t1.networkConfigPo.formatState = (tableData[index].t1.networkConfigPo.state == 1);
        }
        console.log("networkPage");
      });
    };
    const isShow = computed(() => (item) => { //计算属性传递参数
      console.log("isShow:" + item + "-->" + (item == 1));
      return item == 1;
    });
    const addClick = function(command) {
      console.log("addclick:" + command);
      if (command == "MQTT_SERVER") {
        drawMqttServerInfo.saveloading = false;
        drawMqttServerInfo.add = true;
        drawMqttServerInfo.status = true;
        drawMqttServerInfo.data = {
          networkConfigPo: {
            name: "",
            state: 0,
            type: command,
            configuration: {
              type: command,
              host: "",
              port: 1883,
              username: "",
              password: "",
              topics: [],
              boards:[]
            }
          }
        };
      } else if (command == "MQTT_CLIENT") {
        drawClientServerInfo.saveloading = false;
        drawClientServerInfo.upload = false;
        drawClientServerInfo.icon = "Upload";
        drawClientServerInfo.add = true;
        drawClientServerInfo.status = true;
        drawClientServerInfo.data = {
          networkConfigPo: {
            name: "",
            state: 0,
            type: command,
            configuration: {
              type: command,
              host: "",
              port: 1883,
              username: "",
              password: "",
              clientId: "",
              topics: [],
              boards:[],
              sslEnabled: false,
              sslCa: "",
              sslCert: "",
              sslKey: ""
            }
          }
        };
      } else if (command == "KAFKA") {
        drawKafkaServerInfo.saveloading = false;
        drawKafkaServerInfo.add = true;
        drawKafkaServerInfo.status = true;
        drawKafkaServerInfo.data = {
          networkConfigPo: {
            name: "",
            state: 0,
            type: command,
            configuration: {
              type: command,
              host: "",
              port: 1889,
              username: "",
              password: "",
              topics: [],
              boards:[]
            }
          }
        };

      }
    };
    const saveClick = (data) => {
      drawMqttServerInfo.saveloading = true;
      console.log("saveApi:" + JSON.stringify(data.data.networkConfigPo));
      saveApi(data.data.networkConfigPo);
    };
    const queryClick = () => {
      console.log("queryClick");
      requestApi();
    };
    const resetClick = () => {
      console.log("resetClick");
      resetParam();
      initData();
      requestApi();
    };
    const rowClick = (row) => {
      drawMqttServerInfo.add = false;
      drawKafkaServerInfo.add = false;
      drawClientServerInfo.add = false;
      console.log("rowClick");
      if (row.t1.networkConfigPo.configuration.type == "MQTT_SERVER") {
        drawMqttServerInfo.data = JSON.parse(JSON.stringify(row.t1));
        drawMqttServerInfo.status = true;
      } else if (row.t1.networkConfigPo.configuration.type == "KAFKA") {
        drawKafkaServerInfo.data = JSON.parse(JSON.stringify(row.t1));
        drawKafkaServerInfo.status = true;
      } else if (row.t1.networkConfigPo.configuration.type == "MQTT_CLIENT") {
        drawClientServerInfo.data = JSON.parse(JSON.stringify(row.t1));
        drawClientServerInfo.status = true;
      }

    };
    const beforeChange = () => {
      return new Promise((resolve, reject) => {
        alert("确认是否操作");
        // 异步操作
        setTimeout(() => {
          if (Math.random() < 0.5) {
            console.log(true);
            resolve(true);
          } else {
            console.log(false);
            reject(true);
          }
        }, 100);
      });
    };
    const changeNetwork = (flag) => {
      flag.state = flag.formatState ? 1 : 0;
      console.log(JSON.stringify(flag));
      saveApi(flag);
    };
    const saveApi = (params) => {
      proxy.$http.saveUpdateNetwork(params).then(value => {
        console.log(JSON.stringify(value));
        ElMessage({
          type: "success",
          message: "删除成功"
        });
        initData();
        requestApi();
      }, error => {
        initData();
        requestApi();
      });
    };
    const deleteApi = (id) => {
      proxy.$http.deleteNetwork({ id: id }).then(value => {
        ElMessage({
          type: "success",
          message: "删除成功"
        });
        initData();
        requestApi();
      }, error => {
        initData();
        requestApi();
      });
    };
    const upload = (tag, param) => {
      console.log("upload");
      drawClientServerInfo.upload = true;
      drawClientServerInfo.icon = "Loading";
      proxy.$http.uploadSSL(param).then(v => {
        ElMessage({
          type: "success",
          message: "上传成功"
        });
        console.log("上传成功1");
        drawClientServerInfo.upload = false;
        drawClientServerInfo.icon = "Upload";
        drawClientServerInfo.data.networkConfigPo.configuration[tag] = v.data.url;
        console.log("上传成功2");
      }, e => {
        ElMessage({
          type: "error",
          message: "上传失败"
        });
        drawClientServerInfo.upload = false;
        drawClientServerInfo.icon = "Upload";
      });
    };
    const deleteClick = (row, index) => {
      console.log("delectClick");
      ElMessageBox.confirm(
        "确定是否需要删除?",
        "提示",
        {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
        .then(() => {
          console.log("delectClick:" + row.t1.networkConfigPo.id);
          deleteApi(row.t1.networkConfigPo.id);
        })
        .catch(() => {
        });
    };
    onMounted(() => {
      dimensionApi();
      requestApi();
      resetParam();
    });

    return {
      dimensionAllTree,
      searchParams,
      page,
      tableData,
      isShow,
      drawMqttServerInfo,
      drawKafkaServerInfo,
      drawClientServerInfo,
      resetClick,
      queryClick,
      addClick,
      rowClick,
      changeNetwork,
      beforeChange,
      saveClick,
      deleteClick,
      upload
    };
  }
});
</script>

<style scoped lang="sass">
@use "@/scss/container.scss"
</style>