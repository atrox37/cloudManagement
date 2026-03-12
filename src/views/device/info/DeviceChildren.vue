<template>
  <div class="tab-pan-content">
    <el-container>
      <el-aside width="350px">

        <el-card>
          <template #header>
            <div class="card-content">
              <el-text type="info" tag="b">结构分路</el-text>
              <el-button-group>
                <el-button @click="newNodeClick">新增</el-button>
                <el-button @click="saveNodeClick">保存</el-button>
              </el-button-group>
            </div>
          </template>
          <div>
            <el-tree :props="defaultProps" :data="childrenTree" @node-click="handleNodeClick" show-checkbox check-strictly check-on-click-node @check-change="nodeChange">
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <div>
                    <el-button-group>
                      <el-button  size="small" @click="nodeRename(data)">
                        重命名
                      </el-button>
                      <el-button  size="small" @click="nodeAppend(data)">
                        新增
                      </el-button>
                      <el-button  size="small" @click="nodeRemove(node, data)">
                        删除
                      </el-button>
                    </el-button-group>

                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </el-card>

      </el-aside>
      <el-container>
        <el-main>
          <el-table height="100%" :data="tableData" v-loading="loading" border stripe @row-click="rowClick"
                    style="width: 100%">
            <el-table-column prop="deviceInstancePo.name" label="设备名称" width="150" header-align="center"
                             align="center"/>
            <el-table-column prop="deviceInstancePo.name" label="产品名称" width="150" header-align="center"
                             align="center"/>
<!--            <el-table-column label="产品类型" header-align="center" align="center" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.productPo.type == 'gateway'">网关</el-tag>
                <el-tag v-if="scope.row.productPo.type == 'device'">直连设备</el-tag>
                <el-tag v-if="scope.row.productPo.type == 'children'">子设备</el-tag>
              </template>
            </el-table-column>-->
            <el-table-column prop="gatewayPo.name" label="关联网关" width="200" header-align="center" align="center"/>
            <el-table-column prop="sysDimensionPo.name" label="所属机构" width="150" header-align="center"
                             align="center"/>
            <el-table-column prop="sysUserPo.username" label="创建人" width="100" header-align="center"
                             align="center"/>
            <el-table-column prop="deviceInstancePo.createTime" label="创建时间" width="200" header-align="center"
                             align="center"/>
            <el-table-column label="状态" header-align="center" align="center" width="100">
              <template #default="scope">
                <el-tag style="margin-left: 5px"
                        :type="scope.row.deviceInstancePo.status=='offline'?'info':'success'">
                  {{ scope.row.deviceInstancePo.status == 'offline' ? '离线' : '在线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column header-align="center" align="center">
              <template #header>
                <div class="center-flex-contain">
                  <el-button-group>
                    <el-button @click.native.stop="addClick">
                      <font-awesome-icon size="1x" :icon="['fasr', 'square-plus']"/>
                    </el-button>
                  </el-button-group>
                </div>
              </template>
              <template #default="scope">
                <div class="center-flex-contain">
                  <el-button-group>
                    <el-button @click.native.stop="deleteClick(scope.row,scope.$index)">
                      <font-awesome-icon :icon="['fasr', 'trash']"/>
                    </el-button>
                  </el-button-group>
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
    </el-container>
  </div>
  <el-dialog v-model="renameDialog.status" title="修改名称">
    <el-form :model="renameDialog">
      <el-form-item label="节点名称">
        <el-input v-model="renameDialog.node.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="right-flex-contain">
        <el-button @click="nodeRenameClick">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import {defineComponent, reactive, ref, getCurrentInstance, onMounted, toRef} from "vue"
import {useRouter} from "vue-router";
import {ElMessageBox,ElMessage} from "element-plus";

export default defineComponent({
  name: "DeviceChildren",
  props: {
    deviceData: {
      type: Object,
      required: false
    }
  },
  emits: ['delChildrenClick', 'addChildrenClick','updateMeta'],
  setup(props, context) {
    const {proxy} = getCurrentInstance()
    const data = toRef(props, 'deviceData')
    const tableData = reactive([])
    const childrenTree=reactive([])
    const selectTree=new Set()
    const page = ref({
      loading: false,
      size: 10,
      current: 1,
      total: 0,
      sorts: [{ column: "t.create_time", order: "desc" }],
      terms: [{column: "t.parent_id", value: data.value.deviceInstancePo.id}]
    })
    const renameDialog=reactive({status:false,node:{id:'',name:''}})
    const defaultProps = {
      children: 'children',
      label: 'name',
    }

    const pageApi = () => {
      page.value.loading = true
      proxy.$http.devicePage(page.value).then(value => {
        page.value.loading = false
        tableData.length = 0
        page.value.total = value.data.total
        tableData.push(...value.data.records)
        console.log('page data->' + value.data.records)
      })
    }
    const pageChange = (current) => {
      console.log('pageChange' + current)
      page.value.current = current
      pageApi()
    }
    const rowClick = (row, column, event) => {
      console.log('click->' + row.deviceInstancePo.id)
      //router.push('/test')
      /*router.push({
          path: '/deviceInstance',
          query: {
              deviceId: row.deviceInstancePo.id
          }
      })*/
    }
    const addClick = () => {
      console.log('addClick')
      if(selectTree.size==1){
        context.emit('addChildrenClick',Array.from(selectTree)[0])
      }else{
        ElMessage.error('请先选择一个节点')
      }

    }
    const deleteClick = (row, index) => {
      console.log('deleteClick')
      ElMessageBox.confirm(
          '确定是否需要删除?',
          '提示',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
          }
      )
          .then(() => {
            context.emit('delChildrenClick', row)
          })
          .catch(() => {
          })
    }

    const createTagId=()=>{
      var id=Math.floor(Math.random()*1000+1)+'';
      return id
    }
    const handleNodeClick=(node)=>{
      console.log('handleNodeClick')
    }

    const nodeChange=(node,current,parent)=>{
      if(current){
        selectTree.add(node.id)
      }else{
        selectTree.delete(node.id)
      }
      var terms=[{column: "t.parent_id", value: data.value.deviceInstancePo.id}]
      if(selectTree.size>0)terms.push({column: 't.tree_node',value:Array.from(selectTree),termType:'in'})
      page.value.terms.length=0
      page.value.terms.push(...terms)
      console.log('nodeChange')
      pageApi()
    }

    const newNodeClick=()=>{
      console.log('newNodeClick')
      childrenTree.push({id:''+createTagId(),name:'Node',children:[]})
    }

    const saveNodeClick=()=>{
      console.log('saveNodeClick')
      var meta=JSON.parse(JSON.stringify(data.value.deviceInstancePo.metadata))
      meta.trees=childrenTree
      context.emit('updateMeta',meta)
    }

    const initPage = () => {
      page.value.current = 1
      pageApi()
    }


    const nodeAppend=(data)=>{
      const newChild={id:''+createTagId(),name:'Node',children:[]}
      if (!data.children) {
        data.children = []
      }
      data.children.push(newChild)
      console.log('append')
    }
    const nodeRemove=(node,data)=>{
      const parent = node.parent
      const children= parent?.data.children || parent?.data
      const index = children.findIndex((d) => d.id === data.id)
      children.splice(index, 1)
      console.log('remove')
    }
    const nodeRename=(node,data)=>{
      console.log('rename')
      renameDialog.status=true
      renameDialog.node.id=node.id
      renameDialog.node.name=node.name
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
    const nodeRenameClick=()=>{
      resetName(childrenTree)
      renameDialog.status=false
    }

    onMounted(()=>{
      childrenTree.length=0
      childrenTree.push(...data.value.deviceInstancePo.metadata.trees)
    })

    return {
      renameDialog,
      childrenTree,
      page,
      tableData,
      nodeChange,
      defaultProps,
      addClick,
      pageChange,
      rowClick,
      deleteClick,
      initPage,
      handleNodeClick,
      nodeRemove,nodeRename,nodeAppend,
      nodeRenameClick,
      newNodeClick,
      saveNodeClick
    }
  }
})
</script>

<style scoped lang="scss">
@import "@/views/device/style/DeviceChildren.scss";
</style>
<style lang="scss">
.content-box {
  height: 100%;
  width: 100%;
  background: #2c3e50;
}
.card-content{
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
</style>