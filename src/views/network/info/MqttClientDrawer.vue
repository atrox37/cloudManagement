<template>
  <el-drawer v-model="dataInfo.status" :size="'25%'" >
    <el-form :model="dataInfo" label-width="100">
      <el-form-item label="名称">
        <el-input v-model="dataInfo.data.networkConfigPo.name" />
      </el-form-item>
      <el-form-item label="ip地址">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.host"/>
      </el-form-item>
      <el-form-item label="服务端口">
        <el-input-number v-model="dataInfo.data.networkConfigPo.configuration.port"/>
      </el-form-item>
      <el-form-item label="用户名">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.username" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.password" />
      </el-form-item>
      <el-form-item label="是否SSL">
        <el-switch
          v-model="dataInfo.data.networkConfigPo.configuration.sslEnabled"
          width="60"
          inline-prompt
          active-text="开启"
          inactive-text="关闭"
        />
      </el-form-item>

      <el-form-item v-if="dataInfo.data.networkConfigPo.configuration.sslEnabled" label="CA证书">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.sslCa" disabled>
          <template #append>
            <el-button :icon="dataInfo.icon" :loading="dataInfo.upload" @click="uploadClick('sslCa')">
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="dataInfo.data.networkConfigPo.configuration.sslEnabled" label="SSLCert证书">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.sslCert" disabled>
          <template #append>
            <el-button :icon="dataInfo.icon" :loading="dataInfo.upload" @click="uploadClick('sslCert')">
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="dataInfo.data.networkConfigPo.configuration.sslEnabled" label="SSLKey证书">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.sslKey" disabled>
          <template #append>
            <el-button :icon="dataInfo.icon" :loading="dataInfo.upload" @click="uploadClick('sslKey')">
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="状态">
        <el-switch
          v-model="state"
          width="60"
          :disabled="dataInfo.add"
          inline-prompt
          active-text="开启"
          inactive-text="关闭"
        />
      </el-form-item>
      <el-form-item label="主题">
        <el-input-tag v-model="dataInfo.data.networkConfigPo.configuration.topics" clearable placeholder="请输入订阅的主题，回车确认" />
      </el-form-item>
      <el-form-item label="总招">
        <el-table :data="dataInfo.data.networkConfigPo.configuration.boards" stripe border @row-click="boardRowClick">
          <el-table-column label="名称" prop="name"></el-table-column>
          <el-table-column label="主题" prop="topic"></el-table-column>
          <el-table-column label="报文" prop="data"></el-table-column>
          <el-table-column width="60">
            <template #header>
              <div class="center-flex-contain">
                <el-button-group>
                  <el-button @click.native.stop="boardAddClick">
                    <font-awesome-icon size="1x" :icon="['fasr', 'square-plus']"/>
                  </el-button>
                </el-button-group>
              </div>
            </template>
            <template #default="scope">
              <div class="center-flex-contain">
                <el-button @click.native.stop="boardDeleteClick(scope.$index, value)">
                  <font-awesome-icon size="1x" :icon="['fasr', 'trash']"/>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
    </el-form>
    <template #header>
      <div>
        <el-space wrap>
          <el-text size="large">{{dataInfo.add?'添加':'编辑'}}</el-text><el-tag effect="dark">MQTT CLIENT</el-tag>
        </el-space>
        <input type="file" id="fileId" ref="fileInput" accept=".jar" style="display: none;"/>
      </div>
    </template>
    <template #footer>
      <el-button type="primary" :loading="dataInfo.saveloading" @click="saveClick">保存</el-button>
    </template>
  </el-drawer>

  <DialogBoard :board="boardItem" @submit="boardSave" ></DialogBoard>

</template>
<script>
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";
import DialogBoard from "@/views/network/board/DialogBoard.vue";

export default defineComponent({
  name: "MqttClientDrawer",
  props: {
    data: {
      type: Object,
      required: false,
      default: () => ({saveloading:false,add:false,icon:'Loading',upload:false,status:false,data:{}})
    }
  },
  components:{DialogBoard},
  emits:['submit','upload'],
  setup(props, context) {
    const dataInfo=toRef(props,'data')
    const fileInput=ref(null)

    const boardItem=reactive({status:false,index:-1,data:{name:'',topic:'',data:'',cluster:[]}})

    var tag=''
    watch(fileInput,(value => {
      value.addEventListener('change',function(){
        console.log('changeFile')
        if(this.files.length>0){
          context.emit('upload',tag,{file:this.files[0],bucketType:'s3'})
          //context.emit('upload',selectData.value.id==undefined?{file:this.files[0],provider:selectData.value.configuration.provider,bucketType:selectData.value.configuration.type}:{id:selectData.value.id,file:this.files[0],provider:selectData.value.configuration.provider,bucketType:selectData.value.configuration.type})
        }

        fileInput.value.value=null
      })
    }))
    const state=computed({
      get(){
        return dataInfo.value.data.networkConfigPo.state == 1;
      },
      set(v){
        dataInfo.value.data.networkConfigPo.state = v?1:0;
      }
    })

    const uploadClick=(item)=>{
      tag=item
      fileInput.value.click()
    }

    const saveClick=()=>{
      context.emit("submit",dataInfo.value)
    }
    const boardDeleteClick=(index,row)=>{
      dataInfo.value.data.networkConfigPo.configuration.boards.splice(index,1)
    }
    const createTagId=()=>{
      var id=Math.floor(Math.random()*1000+1)+'';
      return id
    }
    const boardAddClick=()=>{
      boardItem.status=true
      boardItem.index=-1
      boardItem.data= { id:createTagId(),name:'',topic:'',data:'',cluster:[] }
      console.log('addClick')
    }
    const boardRowClick=(row)=>{
      console.log('boardClick')
      boardItem.status=true
      boardItem.data=JSON.parse(JSON.stringify(row))
      boardItem.index=dataInfo.value.data.networkConfigPo.configuration.boards.indexOf(row)
      console.log('boardClick')
    }
    const boardSave=(index,data)=>{
      console.log('boardSave')
      if(index<0){
        dataInfo.value.data.networkConfigPo.configuration.boards.push(data)
      }else{
        dataInfo.value.data.networkConfigPo.configuration.boards[index]=data
      }
      boardItem.status=false
    }

    return {
      boardItem,
      fileInput,
      state,
      dataInfo,
      boardDeleteClick,
      boardAddClick,
      boardRowClick,
      uploadClick,
      saveClick,
      boardSave
    };
  }
});
</script>