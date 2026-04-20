<template>
  <el-drawer v-model="shareDialogData.status" :title="$t('gateway.assignOrg')" :show-close="false" @before-close="closeHandler" width="60%">
    <el-form :data="data">
        <el-form-item :label="$t('gateway.assignedOrg')" label-position="right" label-width="120px">
          <div class="left-flex-contain" style="flex-wrap: wrap;">
            <el-tag type="primary" v-for="(item,index) in data.gatewayOrg" :key="index" closable @close="delOrg(item,index)">{{ item.name }}</el-tag>
          </div>
        </el-form-item>
        <el-form-item :label="$t('common.org')" label-position="right" label-width="90px">
            <el-tree 
                :props="defaultProps" 
                :data="data.tree" 
                @node-click="treeNodeClick"
                default-expand-all></el-tree>
        </el-form-item>
    </el-form>

    <template #footer>
        <el-button @click="closeClick">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitClick">{{ $t('common.save') }}</el-button>
    </template>
  </el-drawer>
</template>

<script>
import {ref, reactive, defineComponent, getCurrentInstance, onMounted, toRef,watch} from "vue";
import { useI18n } from 'vue-i18n'
export default defineComponent({
  name: "DialogShare",
  props: {
    data:{
      type: Object,
      required: false,
      default: () => ({status:false,tree:{},gatewayOrg:[]})
    }
  },
  emits:['close'],
  setup(props,context){
    const { t } = useI18n()
    const shareDialogData=props.data
    //const shareDialogData=toRef(props,'data')
    const data=ref(null)
    
    const defaultProps=ref({
        children: 'children',
        label: 'name'
    })
    const treeNodeClick=(nodeElement,nodeProperty,node,event)=>{
        console.log('tree node click')
        data.value.gatewayOrg.push({id:nodeElement.id,name:nodeElement.name})
    }
    const cloneData=()=>{
        data.value=JSON.parse(JSON.stringify(shareDialogData))
        data.value.tree=[data.value.tree]
        console.log('clone:')
    }
    const closeHandler=(done)=>{
        console.log('closeHandler')
        done()
        context.emit('close')
    }
    const closeClick=()=>{
        context.emit('close')
    }
    const submitClick=()=>{
        console.log('sublime')
    }
    const delOrg=(item,index)=>{
        console.log('delOrg')
    }

    onMounted(()=>{
        cloneData()
    })
    watch(shareDialogData,value=>{
        cloneData()
    })
    return {defaultProps,data,shareDialogData,closeHandler,closeClick,submitClick,treeNodeClick,delOrg}
  }
})
</script>

<style  scoped>
@import url('./style/share.scss')

</style>
