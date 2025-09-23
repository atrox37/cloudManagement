<template>
  <div class="tab-pan-content" style="box-sizing: border-box;padding: 0 4px;">
    <el-row :gutter="8" style="height: calc(100% - 10px)">
      <el-col :span="12">
        <el-card style="height:calc(100% - 10px)">
          <template #header>
            <div class="card-content">
              <el-text type="info"tag="b">结构分路</el-text>
              <el-button-group>
                <el-button @click="newClick">新增</el-button>
                <el-button @click="saveClick" :loading="load">保存</el-button>
              </el-button-group>

            </div>

          </template>
          <div style="height: 100%">
            <el-tree :props="defaultProps" node-key="id" :data="testData" @node-click="handleNodeClick" default-expand-all :expand-on-click-node="false">
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <div>
                    <el-button-group>
                      <el-button  size="small" @click="rename(data)">
                        重命名
                      </el-button>
                      <el-button  size="small" @click="append(data)">
                        新增
                      </el-button>
                      <el-button  size="small" @click="remove(node, data)">
                        删除
                      </el-button>
                    </el-button-group>

                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </el-card>

      </el-col>
      <el-col :span="6"></el-col>
      <el-col :span="6"></el-col>
    </el-row>

  </div>
  <el-dialog v-model="renameDialog.status" title="修改名称">
    <el-form :model="renameDialog">
      <el-form-item label="节点名称">
        <el-input v-model="renameDialog.node.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="right-flex-contain">
        <el-button @click="renameSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import {onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed} from "vue"
import { ElButton } from 'element-plus'

export default defineComponent({
  name: "TabProductTree",
  props: {
    productData: {
      type: Object,
      required: false
    },
    loading:{
      type:Boolean,
      required: true,
      default: false
    }
  },
  emits: ['submit'],
  setup(props, context) {
    const meta = toRef(props, 'productData')
    const load = toRef(props,'loading')
    const direction = ref("horizontal")
    const fillRatio = ref(30)
    const renameDialog=reactive({status:false,node:{id:'',name:''}})
    const testData = reactive([])


    const defaultProps = {
      children: 'children',
      label: 'name',
    }

    const createTagId=()=>{
      var id=Math.floor(Math.random()*1000+1);
      return id
    }

    const handleNodeClick = (tree) => {
      console.log('handleNodeClick')
      console.log(meta.value)
    }
    const append=(data)=>{
      const newChild={id:''+createTagId(),name:'Node',children:[]}
      if (!data.children) {
        data.children = []
      }
      data.children.push(newChild)
      console.log('append')
    }
    const remove=(node,data)=>{
      const parent = node.parent
      const children= parent?.data.children || parent?.data
      const index = children.findIndex((d) => d.id === data.id)
      children.splice(index, 1)
      console.log('remove')
    }
    const rename=(node,data)=>{
      console.log('rename')
      renameDialog.status=true
      renameDialog.node.id=node.id
      renameDialog.node.name=node.name
    }
    const renameSubmit=()=>{
      resetName(testData)
      renameDialog.status=false
    }
    const resetName=(source)=>{
      for(let index in source){
        if(source[index].id==renameDialog.node.id){
          source[index].name=renameDialog.node.name
          break
        }else if(source[index].children.length>0){
          resetName(source[index].children)
        }
      }
    }


    const saveClick=()=>{
      console.log("saveClick")
      context.emit('submit',testData)
    }
    const newClick=()=>{
      testData.push({id:''+createTagId(),name:'Node',children:[]})
    }

    onMounted(() => {
      testData.length = 0
      testData.push(...meta.value.metadata.trees)
    })
    return {
      load,
      fillRatio,
      direction,
      testData,
      defaultProps,
      renameDialog,
      rename,
      saveClick,
      handleNodeClick,
      append,
      remove,
      newClick,
      renameSubmit
    }
  }
})
</script>
<style>
@import url('style/index.scss');
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
.card-content{
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
}
</style>
<style scoped>
::v-deep .el-card__body{
  height: 85%;
  padding: var(--el-card-padding);
}
</style>