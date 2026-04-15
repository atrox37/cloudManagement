<template>
  <el-dialog v-model="data.status" title="总招" width="40%">
    <div>
      <el-checkbox-group v-model="checkList">
        <el-checkbox v-for="(item,index) in boardList" :key="index" :value="item.id" border>
          <template #default="scope">
            <span>{{ item.name }}</span>
            <span v-if="item.state!=null && item.state==1">
             <el-icon class="is-loading">
              <Refresh />
            </el-icon>
          </span>
            <span v-if="item.state!=null && item.state==2">
             <el-icon>
              <SuccessFilled />
            </el-icon>
          </span>
            <span v-if="item.state!=null && item.state==-1">
             <el-icon>
              <CircleClose />
            </el-icon>
          </span>
            <span v-if="item.state!=null && item.state==-2">
             <el-icon>
              <Timer />
            </el-icon>
          </span>
          </template>
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <br />
    <el-text size="large">记录</el-text>
    <div>
      <el-table :data="record.records" border v-loading="record.loading">
        <el-table-column prop="ts" width="250" >
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
          <template #default="scope">
            {{scope.row.ts}}
          </template>
        </el-table-column>
        <el-table-column prop="boardName" label="总招名称" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceSn" label="设备Sn" />
        <el-table-column label="状态" width="100" >
          <template #default="scope">
            <el-tag v-if="scope.row.state=='success'" type="success">成功</el-tag>
            <el-tag v-else-if="scope.row.state=='timeout'" type="info">超时</el-tag>
            <el-tag type="warning" v-else>失败</el-tag>
          </template>
        </el-table-column>
        <template slot="empty">
          <div class="no-data">
            <span>暂无数据</span>
          </div>
        </template>
      </el-table>
    </div>
    <br />
    <div class="center-flex-contain">
      <el-pagination layout="prev, pager, next" :total="record.total" background @change="currentClick"/>
    </div>
    <template #footer>
      <div class="right-flex-contain">
        <el-button :disabled="buttonState" type="primary" @click="send">发送</el-button>
      </div>
    </template>

  </el-dialog>
</template>
<script>
import SockJS from "sockjs-client/dist/sockjs.min.js";
import Stomp from "stompjs";
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";
import { ElMessage } from "element-plus";
import {initPickTime,formatTs} from "@/util/common/pickTime";
import { boardData } from "@/util/request";

export default defineComponent({
  name: "DialogPushBoard",
  props: {
    row: {
      type: Object,
      required: false,
      default: () => ({ status: false, data: {} })
    }
  },
  setup(props, context) {
    const data = toRef(props, "row");
    const boardList = reactive([]);
    const checkList = ref([]);
    const { proxy } = getCurrentInstance();
    const pickTime=ref([])
    const page = reactive({ current: 1, size: 10, terms: [], sorts: [{ column: "ts", order: "desc" }] });
    const record = reactive({
      loading: false,
      records: [{ netId: 4, boardId: "383", state: "timeout", ts: "2025-11-30 20:59:10" }],
      total: 13,
      size: 5,
      current: 1
    });
    let dataStr = [];
    watch(pickTime,v => {
      page.terms.length=0
      if(data.value.data.networkConfigPo!=undefined){
        page.terms.push({column: "net_id", value: data.value.data.networkConfigPo.id})
        page.terms.push({column:'ts',termType:'gt',value:formatTs(pickTime.value[0])})
        page.terms.push({column:'ts',termType:'lte',value:formatTs(pickTime.value[1])})
        pageApi()
      }
    })

    let stompState = ref(false);
    let stomp = null;
    let socket = null;

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
    const buttonState = computed(() => {
      if (!stompState.value) return true;
      if (checkList.value.length == 0) return true;
      var flag = false;
      for (var index in boardList) {
        if (boardList[index].state != null && boardList[index].state == 1) {
          flag = true;
          break;
        }
      }
      return flag;
    });
    const connectToStomp = function() {
      let boardTopic = "/topic/board_network_" + data.value.data.networkConfigPo.id;
      console.log("boardTopic->" + boardTopic);
      stomp.connect(
        { Authorization: window.sessionStorage.getItem("token") },
        function(frame) {
          console.log("Connected: ");
          stompState.value = true;
          stomp.subscribe(boardTopic, function(greeting) {
            console.log("stomp:" + greeting.body);
          });
          stomp.onreceive = function(m) {
            console.log("收到消息" + m.body);
            var boardId = undefined, state = undefined;
            if (JSON.parse(m.body).replyType == "TIMEOUT") {
              ElMessage.error("请求超时，请检查网络及设备");
              boardId = JSON.parse(m.body).requestWsData.boardId;
              state = -2;
            } else if (JSON.parse(m.body).replyType == "LOADING") {
              ElMessage.info("正在请求,总招");
              boardId = JSON.parse(m.body).targetMsg.data.id;
              state = 1;
            } else if (JSON.parse(m.body).replyType == "SUCCESS") {
              ElMessage.success("下发总招成功");
              boardId = JSON.parse(m.body).requestWsData.boardId;
              state = 2;
            } else if (JSON.parse(m.body).replyType == "FAIL") {
              ElMessage.error("下发总招失败");
              boardId = JSON.parse(m.body).requestWsData.boardId;
              state = -1;
            }
            //fetchStomp(boardId,state)
            if (boardId != undefined) {
              for (var index in boardList) {
                if (boardId == boardList[index].id) {
                  boardList[index].state = state;
                  break;
                }
              }
            }
            console.log("fetchStomp");
          };
        },
        function(frame) {
          console.log("connect fail");
          stompState.value = false;
          setTimeout(connectToStomp, 3000);
        }
      );
    };

    const connectFunc = function() {
      console.log("stomp启动连接");
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

    const resetData=()=>{
      var boardMap={}
      for(var item in boardList){
        boardMap[boardList[item].id]=boardList[item].name
      }
      console.log('resetData')
      for(var item in record.records){
        record.records[item].boardName=boardMap[record.records[item].boardId]
      }
    }

    const pageApi = () => {
      record.loading=true
      record.records.length=0
      proxy.$http.boardData(page).then(value => {
        console.log('success page')
        record.loading=false
        record.records.push(...value.data.records)
        record.current=value.data.current
        record.total=value.data.total
        record.size=value.data.size
        resetData()
      },error => {
        console.log('fail page')
        record.loading=false
      });
    };

    const currentClick=(num)=>{
      page.current=num
      pageApi()
    }

    watch(data, (newValue, oldValue) => {
      console.log("status changed:", newValue.status);
      if (newValue.status) {
        boardList.length = 0;
        boardList.push(...JSON.parse(JSON.stringify(newValue.data.networkConfigPo.configuration.boards)));
        connectFunc();
        page.terms.length=0
        page.terms.push({column: "net_id", value: newValue.data.networkConfigPo.id})
        page.terms.push({column:'ts',termType:'gt',value:formatTs(pickTime.value[0])})
        page.terms.push({column:'ts',termType:'lte',value:formatTs(pickTime.value[1])})
        pageApi()
      } else {
        disConnectFunc();
      }
    }, { deep: true });

    const send = () => {
      dataStr.length = 0;
      for (let item of checkList.value) {
        dataStr.push({ netId: data.value.data.networkConfigPo.id, data: { id: item } });
      }
      console.log("send:" + JSON.stringify(dataStr));
      stomp.send(
        "/queue/queue_stomp_board",
        { "reply-to": "/temp-queue/foo" },
        JSON.stringify(dataStr)
      );
    };
    onMounted(()=>{
      pickTime.value = initPickTime()
    })
    return {
      pickTime,
      record,
      stompState,
      checkList,
      boardList,
      data,
      buttonState,
      send,
      currentClick
    };
  }
});
</script>