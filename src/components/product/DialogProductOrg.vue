<template>
  <el-dialog v-model="pd.status" title="分配机构" width="40%">
    <el-form>
      <el-form-item label="机构" label-width="70" label-position="left">
        <el-tree
            ref="treeRef"
            style="max-width: 600px"
            :data="pdTarget.tree"
            node-key="value"
            :check-strictly="checkedChild"
            :props="defaultProps"
            show-checkbox
            @check-change="handleCheckChange"
        />
      </el-form-item>
      <el-form-item label="已选择" label-width="70" label-position="left">
        <el-space wrap>
          <el-tag v-for="(item,index) in pdTarget.data" effect="dark">{{item.sysDimensionPo.name}}</el-tag>
        </el-space>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeClick">取消</el-button>
      <el-button @click="saveClick" :loading="pd.loading" type="primary">保存</el-button>
    </template>
  </el-dialog>
</template>

<script>
import {defineComponent, ref,reactive, onMounted, onActivated, getCurrentInstance, toRef, watch} from "vue"

export default defineComponent({
  name: 'DialogProductOrg',
  emits: ['close','save'],
  props:{
    data: {
      type: Object,
      required: true,
      default: () => ({status:false,loading:false,tree:[],data:[]})
    }
  },
  setup(props, context) {
    const {proxy} = getCurrentInstance()
    const pd = toRef(props,'data')//props.data;
    const pdTarget = ref({status:false,loading:false,tree:[],data:[]})
    const treeRef=ref(null)
    const checkedChild=ref(true)

    const defaultProps = {
      children: 'children',
      label: 'label',
    }

    const initChecked=()=>{
      pdTarget.value=JSON.parse(JSON.stringify(pd.value))
      const checkIds=[]
      for(const item of pd.value.data){
        checkIds.push(item.sysDimensionPo.id)
      }
      treeRef.value.setCheckedKeys(checkIds)
      console.log('initChecked')
    }


    const closeClick=()=>{
      console.log('closeClick:%s',JSON.stringify(pd.value))
      context.emit('close')
    }
    const saveClick=()=>{
      const addData=[],delData=[]
      for(const item of pdTarget.value.data){
        let exit=false
        for(const item2 of pd.value.data){
          if(item.sysDimensionPo.id == item2.sysDimensionPo.id){
            exit=true
            break
          }
        }
        if(!exit){
          addData.push(item.sysDimensionPo.id)
        }
      }
      for(const item of pd.value.data){
        let exit=false
        for(const item2 of pdTarget.value.data){
          if(item.sysDimensionPo.id == item2.sysDimensionPo.id){
            exit=true
            break
          }
        }
        if(!exit){
          delData.push(item.productOrgPo.id)
        }
      }

      console.log('save del-->'+JSON.stringify(delData))
      console.log('save add-->'+JSON.stringify(addData))

      context.emit('save',addData,delData)
    }
    const deleteClick=()=>{
      console.log('deleteClick')
    }
    const handleCheckChange=(item,checked,childrenChecked)=>{
      console.log('handleCheckChange')
      if(checked){
        let flag=true
        for(let pdItem of pdTarget.value.data){
          if(pdItem.sysDimensionPo.id==item.value){
            flag=false
            break
          }
        }
        if(flag){
          pdTarget.value.data.push({sysDimensionPo:{name:item.label,id:item.value}})
        }
      }else{
        for(const index in pdTarget.value.data){
          if(pdTarget.value.data[index].sysDimensionPo.id==item.value){
            pdTarget.value.data.splice(index,1)
            break;
          }
        }
      }
    }

    return {
      treeRef,
      pd,
      pdTarget,
      checkedChild,
      defaultProps,
      initChecked,
      closeClick,
      saveClick,
      deleteClick,
      handleCheckChange
    }
  }
})
</script>    