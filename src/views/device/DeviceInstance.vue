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
            <el-space wrap>
              <el-button @click="syncApi" type="info" plain :loading="deviceSync.loading">{{ $t('deviceInstance.modelSync') }}</el-button>
              <el-button @click="saveClick" type="primary" :loading="saving">{{ $t('common.save') }}</el-button>
            </el-space>
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
              <el-text tag="b">{{ $t('deviceInstance.statusLabel') }}</el-text>
            </template>
            <template #default>
              <el-tag :type="deviceStatusTag">
                {{
                  deviceData.deviceInstancePo.status == "offline"
                    ? $t('common.offline')
                    : $t('common.online')
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
      <el-tab-pane :label="$t('deviceInstance.tabBasicInfo')" name="first">
        <DeviceDetail
          :gateways="gatewayData"
          :deviceData="deviceData"
          :editData="editData"
          :parentData="parentData"></DeviceDetail>
      </el-tab-pane>
      <el-tab-pane :label="$t('deviceInstance.tabModelProps')" name="five">
        <DeviceMeta
          ref="deviceMetaRef"
          :deviceUnit="deviceUnit"
          :deviceMeta="editData"
        ></DeviceMeta>
      </el-tab-pane>
      <el-tab-pane :label="$t('deviceInstance.tabRunStatus')" name="second">
        <DeviceRun
          ref="deviceRunView"
          :historyData="propertyHistoryData"
          :deviceMeta="deviceData.deviceInstancePo"
          @readProperty="readProperty"
          @writeProperty="writeProperty"
          @propertyClick="propertyDialogShow"
        ></DeviceRun>
      </el-tab-pane>
      <el-tab-pane :label="$t('deviceInstance.tabFunctions')" name="third">
        <DeviceFunction
          ref="deviceFuncRef"
          :deviceMeta="deviceData.deviceInstancePo"
          :functionData="tabFunctionData"
          @funcExecution="funcExecution"
        ></DeviceFunction>
      </el-tab-pane>
      <el-tab-pane :label="$t('deviceInstance.tabLog')" name="fourth">
        <DeviceLog
          ref="deviceLogRef"
          :data="logData"
          @pageRequest="deviceLogApi"
        ></DeviceLog>
      </el-tab-pane>
      <el-tab-pane :label="$t('deviceInstance.tabAlarm')" name="six">
        <DeviceAlarm
          :key="'alarm-'+tabKey"
          ref="deviceAlarmRef"
          :deviceData="deviceData"
          :ruleChanges="pendingRuleChange"
          @deleteRule="deleteRule"
          @open="alarmOpen"
        ></DeviceAlarm>
      </el-tab-pane>
      <el-tab-pane :label="$t('deviceInstance.tabAlarmLog')" name="eight">
        <DeviceAlarmLog
          ref="deviceAlarmLogRef"
          :deviceMeta="deviceData.deviceInstancePo">
        </DeviceAlarmLog>
      </el-tab-pane>
      <el-tab-pane
        v-if="deviceData.productPo.type == 'gateway'"
        :label="$t('deviceInstance.tabChildren')"
        name="seven"
      >
        <DeviceChildren
          ref="deviceChildrenRef"
          :deviceData="deviceData"
          :pendingBindings="pendingChildBinding"
          :pendingRows="pendingChildRows"
          @addChildrenClick="addChildrenClick"
          @delChildrenClick="delChildrenClick"
          @updateMeta="childrenMetaChange"
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
    @save="alarmSave"
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
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { normalizeEnumRuleParams } from "@/util/deviceRule";

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
    const { t } = useI18n();
    const { proxy } = getCurrentInstance();
    let deviceId = null;
    const gatewayData = ref([]);
    const dialogEdit = ref(false);
    const lazyLoad = ref(false);
    const parentData = ref(null);
    const deviceData = ref({});
    const editData = ref({});
    const saving = ref(false);
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
      pendingRuleChange.value = [];
      pendingChildBinding.value = [];
      pendingChildRows.value = [];
      reload();
    });
    const dialogAlarmState = ref(false);
    const dialogAlarmData = ref(null);
    const pendingRuleChange = ref([]);
    const pendingChildBinding = ref([]);
    const pendingChildRows = ref([]);
    const tabKey = ref(0);

    const cloneData = (value) => JSON.parse(JSON.stringify(value));

    const upsertById = (items, item, getId) => {
      const id = getId(item);
      const index = items.findIndex((current) => getId(current) === id);
      if (index >= 0) {
        items.splice(index, 1, item);
      } else {
        items.push(item);
      }
    };

    const refreshDeviceMetadataView = () => {
      const metadata = cloneData(editData.value.metadata || {});
      const rules = Array.isArray(metadata.rules) ? metadata.rules : [];
      for (const change of pendingRuleChange.value) {
        const rule = cloneData(change.ruleModel);
        const index = rules.findIndex((item) => item.id === rule.id);
        if (index >= 0) {
          rules.splice(index, 1, { ...rules[index], ...rule });
        } else {
          rules.push(rule);
        }
      }
      metadata.rules = rules;
      deviceData.value = {
        ...deviceData.value,
        deviceInstancePo: {
          ...deviceData.value.deviceInstancePo,
          metadata
        }
      };
      tabKey.value++;
    };

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
      // 本地合并到 editData，由顶部保存按钮统一提交
      Object.assign(editData.value, devicePo);
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
              denied=t('deviceInstance.permDeniedRead');
            }else if(JSON.parse(error.body).type=='write-property'){
              for (var p of JSON.parse(error.body).targetMsg.property) {
                propertyLoading(p, "write", false);
              }
              denied=t('deviceInstance.permDeniedWrite');
            }else if(JSON.parse(error.body).type=='function'){
              tabFunctionData.loading = false;
              tabFunctionData.result = {};
              denied=t('deviceInstance.permDeniedFunc');
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
            message: t('deviceInstance.readTimeout'),
            type: "error",
            plain: true
          });
        }
        if (JSON.parse(m.body).replyType == "SUCCESS" && JSON.parse(m.body).type == "read-reply") {
          for (var p of Object.keys(JSON.parse(m.body).properties)) {
            propertyLoading(p, "read", false);
          }
          ElMessage({
            message: t('deviceInstance.readSuccess'),
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
            message: t('deviceInstance.writeTimeout'),
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
            message: t('deviceInstance.writeSuccess'),
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
            message: t('deviceInstance.writeFail'),
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
          tabFunctionData.resultStr = JSON.parse(m.body).source;//JSON.parse(m.body).resultStrData;
          console.log("function success");
          ElMessage({
            message: t('common.operationSuccess'),
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
          tabFunctionData.resultStr = JSON.parse(m.body).source;
          ElMessage({
            message: t('deviceInstance.funcFail'),
            type: "error",
            plain: true
          });
        }
        if (JSON.parse(m.body).replyType == "TIMEOUT" &&JSON.parse(m.body).type == "function-reply") {
          tabFunctionData.loading = false;
          ElMessage({
            message: t('deviceInstance.requestTimeout'),
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
          editData.value = cloneData(value.data.deviceInstancePo);
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
          ElMessage.info(t('deviceInstance.syncNoUpdate'))
        }else{
          ElMessage.success(t('deviceInstance.syncDone'))
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

    const saveClick = () => {
      if (!editData.value.name?.trim()) {
        ElMessage({ message: t('deviceDialog.nameRequired'), type: "error" });
        return;
      }
      if (!editData.value.sn?.trim()) {
        ElMessage({ message: t('deviceDialog.snRequired'), type: "error" });
        return;
      }
      if (editData.value.productId == null) {
        ElMessage({ message: t('deviceDialog.productRequired'), type: "error" });
        return;
      }
      if (
        (deviceData.value.productPo.type === "gateway" ||
          deviceData.value.productPo.type === "device") &&
        editData.value.gatewayId == null
      ) {
        ElMessage({ message: t('deviceDialog.gatewayRequired'), type: "error" });
        return;
      }
      saving.value = true;
      const data = {
        id: editData.value.id,
        name: editData.value.name,
        sn: editData.value.sn,
        productId: editData.value.productId,
        orgId: editData.value.orgId,
        gatewayId: editData.value.gatewayId,
        parentId: editData.value.parentId,
        treeNode: editData.value.treeNode,
        metadata: editData.value.metadata
      };
      // 收集所有 pending 变更，一次性提交
      const payload = cloneData({
        device: data,
        ruleChange: pendingRuleChange.value,
        childBinding: pendingChildBinding.value
      });
      normalizeEnumRuleParams(payload.device.metadata, payload.ruleChange);
      proxy.$http.updateDeviceInstanceApi(payload).then((value) => {
        saving.value = false;
        ElMessage({ message: t('common.operationSuccess'), type: "success" });
        // 清空 pending
        pendingRuleChange.value = [];
        pendingChildBinding.value = [];
        pendingChildRows.value = [];
        reload();
      }, () => {
        saving.value = false;
      });
    };

    const updateDeviceInstanceBase = (baseData) => {
      console.log("updateDeviceInstanceBase");
      dialogEdit.value = false;
      const data = {
        id: baseData.id,
        name: baseData.name,
        gatewayId: baseData.gatewayId,
        orgId: baseData.orgId,
        parentId: baseData.parentId
      };
      // 本地合并到 editData，由顶部保存按钮统一提交
      Object.assign(editData.value, data);
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
    const alarmSave = (ruleData) => {
      upsertById(
        pendingRuleChange.value,
        cloneData(ruleData),
        (item) => item.ruleModel.id
      );
      dialogAlarmState.value = false;
      refreshDeviceMetadataView();
    };
    const deleteRule = (ruleId) => {
      const rules = editData.value.metadata?.rules || [];
      editData.value.metadata.rules = rules.filter((item) => item.id !== ruleId);
      pendingRuleChange.value = pendingRuleChange.value.filter(
        (item) => item.ruleModel.id !== ruleId
      );
      refreshDeviceMetadataView();
    };
    const childrenMetaChange = (metaData) => {
      editData.value.metadata = {
        ...(editData.value.metadata || {}),
        trees: cloneData(metaData.trees || [])
      };
      refreshDeviceMetadataView();
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
      const childId = row.deviceInstancePo.id;
      console.log("delChildrenClick:" + childId);
      const isNewBinding = pendingChildRows.value.some(
        (item) => item.deviceInstancePo.id === childId
      );
      if (isNewBinding) {
        pendingChildBinding.value = pendingChildBinding.value.filter(
          (item) => item.id !== childId
        );
        pendingChildRows.value = pendingChildRows.value.filter(
          (item) => item.deviceInstancePo.id !== childId
        );
        ElMessage({ message: t('common.operationSuccess'), type: "success" });
        return;
      }
      upsertById(
        pendingChildBinding.value,
        { id: childId, parentId: null, treeNode: null },
        (item) => item.id
      );
      ElMessage({ message: t('common.operationSuccess'), type: "success" });
    };
    const addChildrenClick = (treeNode) => {
      console.log("addChildrenClick");
      dialogChildrenData.status = true;
      dialogChildrenData.treeNode = treeNode;
      dialogChildrenRef.value.pageApi();
    };
    const addChildrenSubmit = (bindings, rows) => {
      for (const binding of bindings) {
        upsertById(pendingChildBinding.value, cloneData(binding), (item) => item.id);
      }
      for (const row of rows) {
        upsertById(
          pendingChildRows.value,
          cloneData(row),
          (item) => item.deviceInstancePo.id
        );
      }
      ElMessage({ message: t('common.operationSuccess'), type: "success" });
      dialogChildrenData.status = false;
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
      editData,
      saving,
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
      deviceLogApi,
      alarmOpen,
      alarmClose,
      alarmReload,
      alarmSave,
      pendingRuleChange,
      pendingChildBinding,
      pendingChildRows,
      tabKey,
      deleteRule,
      childrenMetaChange,
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
      syncApi,
      saveClick
    };
  }
});
</script>

<style scoped lang="scss">
@import "@/views/device/style/DeviceInstance.scss";
</style>
