<template>
  <el-drawer v-model="shareDialogData.status" title="分配子机构" :show-close="false" @before-close="closeHandler" width="60%">
    <el-form :data="data">
        <el-form-item label="已分配机构" label-position="right" label-width="100px">
          <div class="left-flex-contain" style="flex-wrap: wrap;">
            <el-tag type="primary" v-for="(item,index) in data.productOrg" :key="index" closable @close="delOrg(item,index)">{{ item.name }}</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="机构" label-position="right" label-width="90px">
            <el-tree 
                :props="defaultProps" 
                :data="data.tree" 
                @node-click="treeNodeClick"
                default-expand-all></el-tree>
        </el-form-item>
    </el-form>

    <template #footer>
        <el-button @click="closeClick">取消</el-button>
        <el-button type="primary" @click="submitClick">保存</el-button>
    </template>
  </el-drawer>
</template>

<script>
import {ref, reactive, defineComponent, getCurrentInstance, onMounted, toRef,watch} from "vue";
export default defineComponent({
  name: "DialogProductShare",
  props: {
    data:{
      type: Object,
      required: false,
      default: () => ({status:false,tree:{},productOrg:[]})
    }
  },
  emits:['close'],
  setup(props,context){
    const shareDialogData=props.data
    const data=ref(null)
    const defaultProps=ref({
        children: 'children',
        label: 'name'
    })
    const treeNodeClick=(nodeElement)=>{
        data.value.productOrg.push({id:nodeElement.id,name:nodeElement.name})
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
    watch(shareDialogData,value=>{
        cloneData()
    })
    return {
        shareDialogData,
        defaultProps,
        data,
        treeNodeClick,
        closeHandler,
        closeClick,
        submitClick,
        delOrg
    }
  }
})
</script>

<style  scoped>
@import url('./style/share.scss')
</style>
