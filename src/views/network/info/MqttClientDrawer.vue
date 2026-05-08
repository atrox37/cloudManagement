<template>
  <el-drawer v-model="dataInfo.status" :size="'25%'" >
    <el-form :model="dataInfo" label-width="100" :disabled="!dataInfo.add && initialState">
      <el-form-item :label="$t('common.name')">
        <el-input v-model="dataInfo.data.networkConfigPo.name" />
      </el-form-item>
      <el-form-item :label="$t('networkDrawer.ipAddress')">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.host"/>
      </el-form-item>
      <el-form-item :label="$t('networkDrawer.servicePort')">
        <el-input-number v-model="dataInfo.data.networkConfigPo.configuration.port"/>
      </el-form-item>
      <el-form-item :label="$t('networkDrawer.username')">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.username" />
      </el-form-item>
      <el-form-item :label="$t('networkDrawer.password')">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.password" />
      </el-form-item>
      <el-form-item :label="$t('networkDrawer.sslEnabled')">
        <el-switch
          v-model="dataInfo.data.networkConfigPo.configuration.sslEnabled"
          width="60"
          inline-prompt
          :active-text="$t('networkDrawer.sslOn')"
          :inactive-text="$t('networkDrawer.sslOff')"
        />
      </el-form-item>

      <el-form-item v-if="dataInfo.data.networkConfigPo.configuration.sslEnabled" :label="$t('networkDrawer.caCert')">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.sslCa" disabled>
          <template #append>
            <el-button :icon="dataInfo.icon" :loading="dataInfo.upload" @click="uploadClick('sslCa')">
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="dataInfo.data.networkConfigPo.configuration.sslEnabled" :label="$t('networkDrawer.sslCert')">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.sslCert" disabled>
          <template #append>
            <el-button :icon="dataInfo.icon" :loading="dataInfo.upload" @click="uploadClick('sslCert')">
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="dataInfo.data.networkConfigPo.configuration.sslEnabled" :label="$t('networkDrawer.sslKey')">
        <el-input v-model="dataInfo.data.networkConfigPo.configuration.sslKey" disabled>
          <template #append>
            <el-button :icon="dataInfo.icon" :loading="dataInfo.upload" @click="uploadClick('sslKey')">
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item :label="$t('networkDrawer.topics')">
        <el-input-tag v-model="dataInfo.data.networkConfigPo.configuration.topics" clearable :placeholder="$t('networkDrawer.topicsPlaceholder')" />
      </el-form-item>
      <el-form-item :label="$t('networkDrawer.generalPoll')">
        <el-table :data="dataInfo.data.networkConfigPo.configuration.boards" stripe border @row-click="boardRowClick">
          <el-table-column :label="$t('networkDrawer.boardName')" prop="name"></el-table-column>
          <el-table-column :label="$t('networkDrawer.boardTopic')" prop="topic"></el-table-column>
          <el-table-column :label="$t('networkDrawer.boardData')" prop="data"></el-table-column>
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
          <el-text size="large">{{dataInfo.add ? $t('networkDrawer.addTitle') : $t('networkDrawer.editTitle')}}</el-text><el-tag effect="dark">MQTT CLIENT</el-tag>
        </el-space>
        <input type="file" id="fileId" ref="fileInput" accept=".jar" style="display: none;"/>
      </div>
    </template>
    <template #footer>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-text>{{ $t('common.status') }}</el-text>
          <el-switch
            v-model="state"
            width="60"
            :disabled="dataInfo.add"
            inline-prompt
            :active-text="$t('networkDrawer.statusOn')"
            :inactive-text="$t('networkDrawer.statusOff')"
          />
          <el-tag :type="state ? 'success' : 'info'" effect="light" size="small">
            {{ state ? $t('networkDrawer.statusOn') : $t('networkDrawer.statusOff') }}
          </el-tag>
        </div>
        <el-button type="primary" :loading="dataInfo.saveloading" @click="saveClick">{{ $t('common.save') }}</el-button>
      </div>
    </template>
  </el-drawer>

  <DialogBoard :board="boardItem" @submit="boardSave" ></DialogBoard>

</template>
<script>
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";
import DialogBoard from "@/views/network/board/DialogBoard.vue";
import { useI18n } from 'vue-i18n';

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
    const { t } = useI18n()
    const dataInfo=toRef(props,'data')
    const fileInput=ref(null)
    const initialState=ref(false)

    const boardItem=reactive({status:false,index:-1,data:{name:'',topic:'',data:'',cluster:[]}})

    var tag=''
    watch(()=>dataInfo.value.status,(v)=>{
      if(v){
        initialState.value = dataInfo.value.data?.networkConfigPo?.state == 1
      }
    })
    watch(fileInput,(value => {
      value.addEventListener('change',function(){
        console.log('changeFile')
        if(this.files.length>0){
          context.emit('upload',tag,{file:this.files[0],bucketType:'s3'})
        }

        fileInput.value.value=null
      })
    }))
    const state=computed({
      get(){
        return dataInfo.value.data?.networkConfigPo?.state == 1;
      },
      set(v){
        if(dataInfo.value.data?.networkConfigPo){
          dataInfo.value.data.networkConfigPo.state = v?1:0;
        }
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
      if(initialState.value) return
      dataInfo.value.data.networkConfigPo.configuration.boards.splice(index,1)
    }
    const createTagId=()=>{
      var id=Math.floor(Math.random()*1000+1)+'';
      return id
    }
    const boardAddClick=()=>{
      if(initialState.value) return
      boardItem.status=true
      boardItem.index=-1
      boardItem.data= { id:createTagId(),name:'',topic:'',data:'',cluster:[] }
      console.log('addClick')
    }
    const boardRowClick=(row)=>{
      if(initialState.value) return
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
      initialState,
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
