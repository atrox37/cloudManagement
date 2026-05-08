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
                <el-empty :description="$t('common.noData')" />
              </template>
            </el-tree-select>
            <el-select v-if="item.type == 'select'" v-model="item.value" style="width:200px">
              <el-option v-for="(item,index) in item.select" :key="index" :label="item.name"
                         :value="item.type"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="queryClick">{{ $t('common.search') }}</el-button>
            <el-button type="info" @click="resetClick">{{ $t('common.reset') }}</el-button>
          </el-form-item>
        </el-form>
      </div>

    </el-header>
    <el-main>
      <el-table height="100%" :data="tableData" v-loading="page.loading" @row-click="rowClick" stripe border :row-key="row => row.t1.networkConfigPo.id">
        <el-table-column prop="t1.networkConfigPo.name" :label="$t('network.name')" header-align="center" align="center" />
        <el-table-column prop="t1.networkConfigPo.type" :label="$t('network.type')" header-align="center" align="center" />
        <el-table-column prop="t1.sysDimensionPo.name" :label="$t('network.org')" header-align="center" align="center" />
        <el-table-column prop="t1.networkConfigPo.updateTime" :label="$t('network.updateTime')" header-align="center" align="center" />
        <el-table-column :label="$t('network.switchStatus')" header-align="center" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.t1.networkConfigPo.state==1" effect="success" :key="`sw-${scope.row.t1.networkConfigPo.id}`">{{ $t('network.started') }}</el-tag>
            <el-tag v-if="scope.row.t1.networkConfigPo.state==0" effect="info" :key="`sw-${scope.row.t1.networkConfigPo.id}`">{{ $t('network.stopped') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('network.connectStatus')" header-align="center" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.t2 == 'SUCCESS'" effect="success" :key="`conn-${scope.row.t1.networkConfigPo.id}`">{{ $t('network.connected') }}</el-tag>
            <el-tag v-if="scope.row.t2 == 'FAIL'" effect="info" type="warning" :key="`conn-${scope.row.t1.networkConfigPo.id}`">{{ $t('network.notConnected') }}</el-tag>
            <el-tag v-if="scope.row.t2 == 'LOADING'" effect="error" type="warning" :key="`conn-${scope.row.t1.networkConfigPo.id}`">{{ $t('network.connecting') }}</el-tag>
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
                    <el-dropdown-item command="MQTT_CLIENT">{{ $t('network.mqttClient') }}</el-dropdown-item>
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
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: "NetworkPage",
  components: { MqttBrokerDrawer, KafkaBrokerDrawer, MqttClientDrawer },
  setup() {
    const router = useRouter();
    const { proxy } = getCurrentInstance();
    const { t } = useI18n()
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
      const rootTree = { value: -1, label: t('common.all'), children: [] };
      rootTree.children.push(...dimensionTree.value);
      return [rootTree];
    });

    const resetParam = () => {
      const p = toRef(protocolType);
      searchParams.length = 0;
      searchParams.push({ column: "t.name", value: "", termType: "like", label: t('network.nameLabel'), type: "input" });
      searchParams.push({ column: "t.org_id", value: -1, termType: "eq", label: t('network.orgLabel'), type: "tree" });
      searchParams.push({
        column: "t.type",
        value: "",
        termType: "eq",
        label: t('network.componentTypeLabel'),
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
    const isShow = computed(() => (item) => {
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
      const type = data.data.networkConfigPo.configuration?.type;
      if (type === 'MQTT_SERVER') {
        drawMqttServerInfo.saveloading = true;
      } else if (type === 'MQTT_CLIENT') {
        drawClientServerInfo.saveloading = true;
      } else if (type === 'KAFKA') {
        drawKafkaServerInfo.saveloading = true;
      }
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
        alert(t('common.confirmDelete'));
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
          message: t('common.operationSuccess')
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
          message: t('common.deleteSuccess')
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
          message: t('common.uploadSuccess')
        });
        console.log("uploadSuccess");
        drawClientServerInfo.upload = false;
        drawClientServerInfo.icon = "Upload";
        drawClientServerInfo.data.networkConfigPo.configuration[tag] = v.data.url;
      }, e => {
        ElMessage({
          type: "error",
          message: t('common.uploadFail')
        });
        drawClientServerInfo.upload = false;
        drawClientServerInfo.icon = "Upload";
      });
    };
    const deleteClick = (row, index) => {
      console.log("delectClick");
      ElMessageBox.confirm(
        t('common.confirmDelete'),
        t('common.tip'),
        {
          confirmButtonText: t('common.delete'),
          cancelButtonText: t('common.cancel'),
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
