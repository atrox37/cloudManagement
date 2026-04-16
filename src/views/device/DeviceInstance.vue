<template>
  <div v-if="lazyLoad" style="width: 100%;height:100%;padding: 0;margin: 0px">
    <ContentHeader>
      <template #more>
        <el-descriptions
          :title="deviceData.deviceInstancePo.name"
          :column="6"
          style="background-color: transparent"
        >
          <template #extra>
            <el-button @click="syncApi" type="info" plain :loading="deviceSync.loading">模型同步</el-button>
          </template>
          <el-descriptions-item span="2">
            <template #label>
              <el-text tag="b">ID</el-text>
            </template>
            <template #default>
              <el-text>{{ deviceData.deviceInstancePo.id }}</el-text>
            </template>
          </el-descriptions-item>
          <el-descriptions-item span="4">
            <template #label>
              <el-text tag="b">状态</el-text>
            </template>
            <template #default>
              <el-tag :type="deviceStatusTag">
                {{
                  deviceData.deviceInstancePo.status == "offline"
                    ? "离线"
                    : "在线"
                }}
              </el-tag>
            </template>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </ContentHeader>
    <!--<MenuContainerInfo :data="deviceTab"></MenuContainerInfo>-->
    <el-tabs
      v-model="activeName"
      class="tab-container"
      @tab-click="handleClick"
    >
      <el-tab-pane label="基本信息" name="first">
        <DeviceDetail
          :gateways="gatewayData"
          :deviceData="deviceData" 
          :parentData="parentData"
          @detailSave="detailSaveClick"></DeviceDetail>
      </el-tab-pane>
      <el-tab-pane label="模型属性" name="five">
        <DeviceMeta
          ref="deviceMetaRef"
          :deviceUnit="deviceUnit"
          :deviceMeta="deviceMeta"
          @updateClick="updateDeviceInstanceApi"
        ></DeviceMeta>
      </el-tab-pane>
      <el-tab-pane label="运行状态" name="second">
        <DeviceRun
          ref="deviceRunView"
          :historyData="propertyHistoryData"
          :deviceMeta="deviceData.deviceInstancePo"
          @readProperty="readProperty"
          @writeProperty="writeProperty"
          @propertyClick="propertyDialogShow"
        ></DeviceRun>
      </el-tab-pane>
      <el-tab-pane label="设备功能" name="third">
        <DeviceFunction
          ref="deviceFuncRef"
          :deviceMeta="deviceData.deviceInstancePo"
          :functionData="tabFunctionData"
          @funcExecution="funcExecution"
        ></DeviceFunction>
      </el-tab-pane>
      <el-tab-pane label="日志信息" name="fourth">
        <DeviceLog
          ref="deviceLogRef"
          :data="logData"
          @pageRequest="deviceLogApi"
        ></DeviceLog>
      </el-tab-pane>
      <el-tab-pane label="设备告警" name="six">
        <DeviceAlarm
          ref="deviceAlarmRef"
          :deviceData="deviceData"
          @updateMeta="updateDeviceInstanceApi"
          @open="alarmOpen"
        ></DeviceAlarm>
      </el-tab-pane>
      <el-tab-pane label="告警记录" name="eight">
        <DeviceAlarmLog
          ref="deviceAlarmLogRef"
          :deviceMeta="deviceData.deviceInstancePo">
        </DeviceAlarmLog>
      </el-tab-pane>
      <el-tab-pane
        v-if="deviceData.productPo.type == 'gateway'"
        label="子设备"
        name="seven"
      >
        <DeviceChildren
          ref="deviceChildrenRef"
          :deviceData="deviceData"
          @addChildrenClick="addChildrenClick"
          @delChildrenClick="delChildrenClick"
          @updateMeta="updateDeviceInstanceApi"
        ></DeviceChildren>
      </el-tab-pane>
    </el-tabs>
  </div>

  <div
    v-if="loading"
    v-loading="loading"
    style="
      background: #c0c4cc;
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
    "
  ></div>

  <DialogDeviceEdit
    :data="deviceData"
    :gateways="gatewayData"
    :status="dialogEdit"
    @save="updateDeviceInstanceBase"
    @cancel="dialogEdit = false"
  ></DialogDeviceEdit>
  <DialogAlarm
    :deviceData="deviceData"
    :alarmData="dialogAlarmData"
    :status="dialogAlarmState"
    @close="alarmClose"
    @reload="alarmReload"
  ></DialogAlarm>
  <DialogProperty
    :status="dialogPropertyStatus"
    :propertyData="dialogDataProperty"
    :property="dialogProperty"
    @close="propertyDialogCancel"
    @propertyApi="queryDevicePropertyData"
  >
  </DialogProperty>
  <DialogChildrenAdd
    ref="dialogChildrenRef"
    :data="dialogChildrenData"
    @submit="addChildrenSubmit"
    @close="closeChildrenClick"
  ></DialogChildrenAdd>
  <DialogPropertyControl
    :data="dialogPropertyControl"
    @close="propertyControlCancel"
    @submit="propertyControlSubmit"
  >
  </DialogPropertyControl>
</template>

<script>
//import SockJS from "sockjs-client";
import SockJS from "sockjs-client/dist/sockjs.min.js";
import Stomp from "stompjs";
import { useRouter, useRoute } from "vue-router";
import {
  computed,
  defineComponent,
  ref,
  reactive,
  watch,
  onMounted,
  getCurrentInstance,
  onBeforeUnmount
} from "vue";
import DeviceDetail from "@/views/device/info/DeviceDetail.vue";
import DeviceRun from "@/views/device/info/DeviceRun.vue";
import DeviceFunction from "@/views/device/info/DeviceFunction.vue";
import DeviceLog from "@/views/device/info/DeviceLog.vue";
import DeviceAlarmLog from "@/views/device/info/DeviceAlarmLog.vue";
import DeviceChildren from "@/views/device/info/DeviceChildren.vue";
import ContentHeader from "@/components/menuContain/ContentHeader.vue";
import MenuContainerHeader from "@/components/menuContain/MenuContainerHeader.vue";
import DeviceMeta from "@/views/device/info/DeviceMeta.vue";
import DeviceAlarm from "@/views/device/info/DeviceAlarm.vue";
import DialogDeviceEdit from "@/components/device/DialogDeviceEdit.vue";
// import DialogAlarm from '@/components/device/DialogAlarm.vue'
import DialogAlarm from "@/components/device/DialogAlarm Copy.vue";
import DialogProperty from "@/components/device/DeviceProperty.vue";
import DialogChildrenAdd from "@/components/device/DialogChildrenAdd.vue";
import DialogPropertyControl from "@/components/device/DialogPropertyControl.vue";
import { column } from "element-plus/es/components/table-v2/src/common";
import { ElMessage } from "element-plus";
import { deviceSync } from "@/util/request";

export default defineComponent({
  name: "DeviceInstance",
  components: {
    ContentHeader,
    MenuContainerHeader,
    DeviceDetail,
    DeviceRun,
    DeviceFunction,
    DeviceLog,
    DeviceAlarmLog,
    DeviceChildren,
    DeviceMeta,
    DialogDeviceEdit,
    DeviceAlarm,
    DialogAlarm,
    DialogProperty,
    DialogChildrenAdd,
    DialogPropertyControl
  },
  setup() {
    const { proxy } = getCurrentInstance();
    let deviceId = null;
    const gatewayData = ref([]);
    const dialogEdit = ref(false);
    const lazyLoad = ref(false);
    const parentData = ref(null);
    const deviceData = ref({});
    const deviceMeta = ref({});
    const deviceFuncRef = ref();
    const deviceMetaRef = ref(null);
    const deviceAlarmRef = ref(null);
    const deviceLogRef = ref(null);
    const deviceAlarmLogRef = ref(null);
    const deviceChildrenRef = ref(null);
    const dialogChildrenRef = ref(null);
    const router = useRouter();
    const route = useRoute();
    const titleLabel = ref("设备详情");
    const deviceTab = ref([
      { name: "设备名称", value: "测试设备" },
      { name: "产品", value: "测试产品" }
    ]);
    const deviceRunView = ref();
    const deviceUnit = reactive([]);
    const activeName = ref("first");

    const dialogProperty = ref(null);
    const dialogPropertyStatus = ref(false);
    const dialogDataProperty = ref({});
    const dialogChildrenData = reactive({
      status: false,
      treeNode: null,
      deviceData: deviceData.value
    });
    const propertyHistoryData = ref({});
    const logData = ref({});
    const dialogPropertyControl = reactive({
      state: { loading: false, dialog: false },
      meta: {}
    });
    const tabFunctionData = reactive({
      loading: false,
      result: {},
      resultStr: ""
    });
    const deviceSync=reactive({loading:false})

    const loading = computed(() => {
      return !lazyLoad.value;
    });
    const deviceStatusTag = computed(() => {
      if (deviceData.value.deviceInstancePo.status == "offline") {
        return "warning";
      } else {
        return "success";
      }
    });

    watch(deviceData, (value) => {
      dialogChildrenData.deviceData = deviceData.value;
    });
    watch(()=>route.query.deviceId, (value) => {
      console.log("route.query.deviceId-->" + value);
      reload();
    });
    const dialogAlarmState = ref(false);
    const dialogAlarmData = ref(null);

    const handleClick = (tab, event) => {
      console.log(tab.paneName);
      switch (tab.paneName) {
        case "second":
          console.log("change chart");
          queryDeviceHistory();
          break;
        case "six":
          console.log("five");
          break;
        case "fourth":
          deviceLogRef.value.initData();
          break;
        case "seven":
          console.log("seven");
          deviceChildrenRef.value.initPage();
          break;
        case "eight":
          console.log("eight");
          deviceAlarmLogRef.value.initData();
          break;
      }
    };
    const backClick = function() {
      router.go(-1);
    };

    const editDialogClick = () => {
      dialogEdit.value = true;
    };
    const detailSaveClick = (po) => {
      var devicePo = JSON.parse(JSON.stringify(po));
      delete devicePo.createTime;
      delete devicePo.updateTime;
      delete devicePo.status;
      delete devicePo.statusTime;
      delete devicePo.treeNode;
      delete devicePo.productId;
      console.log("detailSaveClick");
      updateDeviceInstance(devicePo);
    };
    let stomp = null;
    let socket = null;

    const connectFunc = function() {
      disConnectFunc();
      //const socketUrl = "http://" + import.meta.env.VITE_APP_URL + "/register-app/socket";
      //TODO 打包
      const socketUrl ="/api/register-app/socket";
      console.log("socketUrl:" + socketUrl);
      socket = new SockJS(socketUrl);
      stomp = Stomp.over(socket);

      const originalSend = socket._send;
      socket._send = function(xhr) {
        xhr.timeout = 60000; // 10秒超时
        originalSend.call(this, xhr);
      };
      connectToStomp();
    };

    const connectToStomp = function() {
      let reportTopic = "/topic/report_property_" + deviceId;
      let lineTopic = "/topic/line_" + deviceId;
      let deniedTopic="/queue/denied"
      console.log("reportTopic->" + reportTopic);
      stomp.connect(
        { Authorization: window.sessionStorage.getItem("token") },
        function(frame) {
          console.log("Connected: ");
          stomp.subscribe(reportTopic, function(greeting) {
            console.log(
              "report_property-->" + reportTopic + "--->" + greeting.body
            );
            deviceRunView.value.changeData(greeting.body);
          });
          stomp.subscribe(lineTopic, function(greeting) {
            console.log("line_" + lineTopic + "--->" + greeting.body);
            var lineData = JSON.parse(greeting.body);
            deviceData.value.deviceInstancePo.status = lineData.type;
          });
          stomp.subscribe(deniedTopic,function(error) {
            var denied=""
            if(JSON.parse(error.body).type=='read-property'){
              for (var p of JSON.parse(error.body).targetMsg.property) {
                propertyLoading(p, "read", false);
              }
              denied='当前用户缺少"设备读取点位"权限';
            }else if(JSON.parse(error.body).type=='write-property'){
              for (var p of JSON.parse(error.body).targetMsg.property) {
                propertyLoading(p, "write", false);
              }
              denied='当前用户缺少"设备写入点位"权限';
            }else if(JSON.parse(error.body).type=='function'){
              tabFunctionData.loading = false;
              tabFunctionData.result = {};
              denied='当前用户缺少"设备功能控制"权限';
            }
            ElMessage({
              message: denied,
              type: "error",
              plain: true
            });
          })
          receive();
        },
        function(frame) {
          console.info("connect fail");
        }
      );
    };

    const disConnectFunc = () => {
      if (socket != null) {
        socket.close();
        socket = null;
      }
      if (stomp != null) {
        stomp.disconnect();
        stomp = null;
      }
    };

    const propertyLoading = function(property, type, loadState) {
      for (var index in deviceData.value.deviceInstancePo.metadata.properties) {
        if (deviceData.value.deviceInstancePo.metadata.properties[index].id == property && type == "read") {
          deviceData.value.deviceInstancePo.metadata.properties[index].loadRead = loadState;
          break;
        } else if (deviceData.value.deviceInstancePo.metadata.properties[index].id == property && type == "write") {
          deviceData.value.deviceInstancePo.metadata.properties[index].loadWrite = loadState;
          break;
        }
      }
    };

    const receive = function() {
      stomp.onreceive = function(m) {
        console.log("收到消息" + m.body);
        console.log("---->" +JSON.stringify(deviceData.value.deviceInstancePo.metadata.properties));

        if (JSON.parse(m.body).replyType == "LOADING" && JSON.parse(m.body).targetMsg.type == "read-property") {
          for (var p of JSON.parse(m.body).targetMsg.property) {
            propertyLoading(p, "read", true);
          }
        }
        if (JSON.parse(m.body).replyType == "TIMEOUT" && JSON.parse(m.body).type == "read-reply") {
          for (var p of JSON.parse(m.body).requestWsData.property) {
            propertyLoading(p, "read", false);
          }
          ElMessage({
            message: "读取超时",
            type: "error",
            plain: true
          });
        }
        if (JSON.parse(m.body).replyType == "SUCCESS" && JSON.parse(m.body).type == "read-reply") {
          for (var p of Object.keys(JSON.parse(m.body).properties)) {
            propertyLoading(p, "read", false);
          }
          ElMessage({
            message: "读取成功",
            type: "success",
            plain: true
          });
        }

        if (JSON.parse(m.body).replyType == "LOADING" && JSON.parse(m.body).targetMsg.type == "write-property") {
          propertyLoading(JSON.parse(m.body).targetMsg.property, "write", true);
        }
        if (JSON.parse(m.body).replyType == "TIMEOUT" && JSON.parse(m.body).type == "write-reply") {
          propertyLoading(
            JSON.parse(m.body).requestWsData.property,
            "write",
            false
          );
          ElMessage({
            message: "写入超时",
            type: "error",
            plain: true
          });
        }
        if (JSON.parse(m.body).replyType == "SUCCESS" && JSON.parse(m.body).type == "write-reply") {
          propertyLoading(
            JSON.parse(m.body).requestWsData.property,
            "write",
            false
          );
          ElMessage({
            message: "写入成功",
            type: "success",
            plain: true
          });
        }
        if (JSON.parse(m.body).replyType == "FAIL" && JSON.parse(m.body).type == "write-reply") {
          propertyLoading(
            JSON.parse(m.body).requestWsData.property,
            "write",
            false
          );
          ElMessage({
            message: "写入失败",
            type: "error",
            plain: true
          });
        }

        if (JSON.parse(m.body).replyType == "LOADING" && JSON.parse(m.body).targetMsg.type == "function") {
          tabFunctionData.loading = true;
          tabFunctionData.result = {};
        }
        if (JSON.parse(m.body).replyType == "SUCCESS" && JSON.parse(m.body).type == "function-reply") {
          tabFunctionData.loading = false;
          tabFunctionData.result = JSON.parse(m.body).resultData;
          tabFunctionData.resultStr = JSON.stringify(JSON.parse(m.body).resultData);//JSON.parse(m.body).resultStrData;
          console.log("function success");
          ElMessage({
            message: "操作成功",
            type: "success",
            plain: true
          });
        }
        if (JSON.parse(m.body).replyType == "FAIL" && JSON.parse(m.body).type == "function-reply") {
          tabFunctionData.loading = false;
          tabFunctionData.result =
            JSON.parse(m.body).resultData == undefined
              ? {}
              : JSON.parse(m.body).resultData;
          tabFunctionData.resultStr = JSON.stringify(JSON.parse(m.body).resultData);//JSON.parse(m.body).resultStrData;
          ElMessage({
            message: "返回结果失败",
            type: "error",
            plain: true
          });
        }
        if (JSON.parse(m.body).replyType == "TIMEOUT" &&JSON.parse(m.body).type == "function-reply") {
          tabFunctionData.loading = false;
          ElMessage({
            message: "请求超时",
            type: "error",
            plain: true
          });
        }
      };
    };

    const requestApi = function() {
      return new Promise((resolve) => {
        let params = { terms: [{ column: "t.id", value: deviceId }] }; //id:deviceId
        proxy.$http.deviceSearch(params).then((value) => {
          console.log("requestApi");
          deviceData.value = value.data;
          deviceMeta.value = value.data.deviceInstancePo;
          if (value.data.deviceInstancePo.parentId != null) {
            parentApi(value.data.deviceInstancePo.parentId);
          }
          resolve();
        }).catch(() => {
          resolve(); // 即使失败也 resolve，避免阻塞
        });
      });
    };
    const parentApi = (parentId) => {
      let params = { terms: [{ column: "t.id", value: parentId }] }; //id:deviceId
      proxy.$http.deviceSearch(params).then((value) => {
        console.log("parentApi");
        parentData.value=value.data
      });
    };
    const requestGatewayApi = () => {
      return new Promise((resolve) => {
        let params = { size: -1 };
        proxy.$http.gatewayPage(params).then((value) => {
          gatewayData.value = value.data.records;
          console.log("requestGatewayApi");
          resolve();
        }).catch(() => {
          resolve(); // 即使失败也 resolve，避免阻塞
        });
      });
    };
    const deviceLogApi = (page, terms) => {
      const t = [
        { column: "device_id", value: deviceData.value.deviceInstancePo.id }
      ];
      t.push(...terms);
      page.terms = t;
      proxy.$http.deviceLogData(page).then((value) => {
        console.log("deviceLogApi");
        logData.value = value.data;
      });
    };
    const unitApi = () => {
      return new Promise((resolve) => {
        proxy.$http.unitApi().then((value) => {
          deviceUnit.length = 0;
          deviceUnit.push(...value.data);
          console.log("unitApi");
          resolve();
        }).catch(() => {
          resolve(); // 即使失败也 resolve，避免阻塞
        });
      });
    };
    const syncApi=()=>{
      deviceSync.loading=true
      proxy.$http.deviceSync({id:deviceData.value.deviceInstancePo.id}).then((value) => {
        console.log("deviceSync");
        deviceSync.loading=false
        if(value.data.change==0){
          ElMessage.info("暂无更新内容")
        }else{
          ElMessage.success("已完成更新")
          // 模型同步成功并且确实发生了变化，重新进行初始化操作
          reload();
        }
      },error => {
        deviceSync.loading=false
      });
    }
    const funcExecution = function(funId, data) {
      console.log("funcExecution-->" + funId + "   ->" + data);
      const functionData = {
        type: "function",
        deviceId: deviceId,
        function: funId,
        args: data
      };
      let functionDataStr = JSON.stringify(functionData);
      stomp.send(
        "/queue/queue_stomp_function",
        { "reply-to": "/temp-queue/foo" },
        functionDataStr
      );
    };
    const readExecution = function(property) {
      const readData = {
        type: "read-property",
        deviceId: deviceId,
        property: [property]
      };
      let readDataStr = JSON.stringify(readData);
      console.log(readData);
      stomp.send(
        "/queue/queue_stomp_read",
        { "reply-to": "/temp-queue/foo" },
        readDataStr
      );
    };

    const writeExecution = function(p, v) {
      const writeData = {
        type: "write-property",
        deviceId: deviceId,
        property: p,
        value: v
      };
      let writeDataStr = JSON.stringify(writeData);
      console.log(writeDataStr);
      stomp.send(
        "/queue/queue_stomp_write",
        { "reply-to": "/temp-queue/foo" },
        writeDataStr
      );
    };

    const updateDeviceInstanceApi = (metaData) => {
      console.log("updateDeviceInstanceApi");
      /*console.log(JSON.stringify(deviceMetaRef.value.getCopyData()))
      const copyDeviceData=JSON.parse(JSON.stringify(deviceData.value.deviceInstancePo))
      copyDeviceData.deviceMetadata=metaData*/
      const data = {
        id: deviceData.value.deviceInstancePo.id,
        metadata: metaData,
        parentId: deviceData.value.deviceInstancePo.parentId
      };
      updateDeviceInstance(data);
    };

    const updateDeviceInstanceBase = (baseData) => {
      /*const data={id:copyDeviceData.deviceId}
      updateDeviceInstance(data)*/
      console.log("updateDeviceInstanceBase");
      dialogEdit.value = false;
      const data = {
        id: baseData.id,
        name: baseData.name,
        gatewayId: baseData.gatewayId,
        orgId: baseData.orgId,
        parentId: baseData.parentId
      };
      console.log(JSON.stringify(data));
      updateDeviceInstance(data);
    };

    const updateDeviceInstance = (deviceData) => {
      proxy.$http.updateDeviceInstanceApi(deviceData).then((value) => {
        console.log("修改成功");
        ElMessage({
          message: "操作成功",
          type: "success"
        });
        reload();
      });
    };

    const queryDevicePropertyData = (page, terms) => {
      var termsData = [
        { column: "device_id", value: deviceData.value.deviceInstancePo.id },
        { column: "property", value: dialogProperty.value.id }
      ];
      if (terms != null && terms.length > 0) termsData.push(...terms);
      var param = {
        current: page.current,
        size: page.size,
        terms: termsData,
        sorts: [{ column: "ts", order: "desc" }]
      };
      console.log("property data");
      proxy.$http.devicePropertyData(param).then((value) => {
        console.log("devicePropertyData-->" + JSON.stringify(value.data));
        dialogDataProperty.value = value.data;
      });
    };
    const queryDeviceHistory = () => {
      var param = { id: deviceData.value.deviceInstancePo.id };
      proxy.$http.devicePropertyHistory(param).then((value) => {
        console.log("devicePropertyData-->" + JSON.stringify(value.data));
        propertyHistoryData.value = value.data;
      });
    };

    const reload = () => {
      console.log("reload");
      deviceId = parseInt(route.query.deviceId);
      console.log("request device instance deviceId" + deviceId);
      
      // 设置加载状态
      lazyLoad.value = false;
      
      // 等待所有请求完成
      Promise.all([
        requestGatewayApi(),
        requestApi(),
        unitApi()
      ]).then(() => {
        // 所有请求完成后，设置加载完成状态
        lazyLoad.value = true;
        // WebSocket 连接可以在后台进行
        connectFunc();
      }).catch(() => {
        // 即使有错误，也显示页面
        lazyLoad.value = true;
        connectFunc();
      });
    };

    const alarmClose = () => {
      console.log("alarmClose");
      dialogAlarmState.value = false;
    };
    const alarmReload = () => {
      console.log("alarmReload");
      dialogAlarmState.value = false;
      reload()
    };
    const alarmOpen = (data) => {
      console.log("alarmOpen");
      dialogAlarmState.value = true;
      dialogAlarmData.value = data;

    };

    const propertyDialogShow = (meas) => {
      dialogProperty.value = meas;
      dialogPropertyStatus.value = true;
    };

    const propertyDialogCancel = () => {
      dialogPropertyStatus.value = false;
    };

    const delChildrenClick = (row) => {
      console.log("delChildrenClick:" + row.deviceInstancePo.id);
      proxy.$http
        .updateDeviceInstanceApi({ id: row.deviceInstancePo.id })
        .then((value) => {
          console.log("修改成功");
          ElMessage({
            message: "操作成功",
            type: "success"
          });
          deviceChildrenRef.value.initPage();
          reload();
        });
    };
    const addChildrenClick = (treeNode) => {
      console.log("addChildrenClick");
      dialogChildrenData.status = true;
      dialogChildrenData.treeNode = treeNode;
      dialogChildrenRef.value.pageApi();
    };
    const addChildrenSubmit = (vs) => {
      ElMessage({
        message: "操作成功",
        type: "success"
      });
      dialogChildrenData.status = false;
      deviceChildrenRef.value.initPage();
    };

    const closeChildrenClick = () => {
      dialogChildrenData.status = false;
    };

    const readProperty = (data) => {
      console.log("readProperty");
      readExecution(data.id);
    };
    const writeProperty = (data) => {
      console.log("writeProperty:" + JSON.stringify(data));
      dialogPropertyControl.meta = data;
      dialogPropertyControl.state.dialog = true;
      //writeExecution(data.id, '111')
    };

    const propertyControlCancel = () => {
      dialogPropertyControl.state.dialog = false;
    };
    const propertyControlSubmit = (data) => {
      dialogPropertyControl.state.dialog = false;
      console.log("propertyControlSubmit:" + JSON.stringify(data));
      writeExecution(data.id, data.value);
    };

    onMounted(() => {
      console.log(import.meta.env.VITE_APP_URL);

      reload();
    });

    onBeforeUnmount(() => {
      console.log("deviceInstance close");
      disConnectFunc();
    });
    return {
      dialogPropertyControl,
      deviceStatusTag,
      gatewayData,
      dialogEdit,
      loading,
      lazyLoad,
      titleLabel,
      deviceUnit,
      deviceTab,
      parentData,
      deviceData,
      deviceMeta,
      deviceRunView,
      activeName,
      deviceMetaRef,
      deviceFuncRef,
      deviceAlarmRef,
      deviceLogRef,
      deviceAlarmLogRef,
      deviceSync,
      deviceChildrenRef,
      dialogChildrenRef,
      dialogAlarmState,
      dialogAlarmData,
      dialogPropertyStatus,
      dialogDataProperty,
      propertyHistoryData,
      dialogProperty,
      dialogChildrenData,
      logData,
      tabFunctionData,
      detailSaveClick,
      updateDeviceInstanceBase,
      editDialogClick,
      funcExecution,
      readExecution,
      handleClick,
      backClick,
      updateDeviceInstanceApi,
      deviceLogApi,
      alarmOpen,
      alarmClose,
      alarmReload,
      propertyDialogShow,
      propertyDialogCancel,
      queryDevicePropertyData,
      delChildrenClick,
      addChildrenClick,
      closeChildrenClick,
      addChildrenSubmit,
      readProperty,
      writeProperty,
      propertyControlCancel,
      propertyControlSubmit,
      syncApi
    };
  }
});
</script>

<style scoped lang="scss">
@import "@/views/device/style/DeviceInstance.scss";
</style>
