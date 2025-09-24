<template>
  <el-container>
    <el-header>
      <div class="search-box">
        <el-form v-model="searchParams" :inline="true">
          <el-form-item v-for="(item,index) in searchParams" :label="item.label" :key="index">
            <el-input v-if="item.type == 'input'" v-model="item.value" placeholder="" clearable />
            <el-tree-select
                    style="width: 220px;"
                    v-if="item.type == 'tree'"
                    v-model="item.value"
                    :data="dimensionAllTree"
                    check-strictly
                    :render-after-expand="false">
              <template #empty>
                <el-empty description="暂无数据" />
              </template>
            </el-tree-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="queryClick">查询</el-button>
            <el-button type="info" @click="resetClick">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

    </el-header>
    <el-main>
      <el-table height="100%" v-loading="loading" @row-click="selectClick" :data="tableData" border highlight-current-row >
        <el-table-column prop="sysUserPo.username" label="用户" align="center" min-width="100"/>
        <el-table-column prop="sysRolePo.roleName" label="角色" align="center" min-width="100"/>
        <el-table-column prop="dimensionPo.name" label="机构" align="center" min-width="100"/>
        <el-table-column prop="sysUserPo.state" label="状态" align="center" min-width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.sysUserPo.state == 0" effect="dark" type="danger">禁用</el-tag>
            <el-tag v-else effect="dark">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sysUserPo.updateTime" label="更新时间" align="center" min-width="100"/>
        <el-table-column >
          <template #header>
            <div class="center-flex-contain">
              <el-button-group>
                <el-button @click="addClick"><font-awesome-icon size="1x" :icon="['fasr', 'square-plus']" /></el-button>
              </el-button-group>
            </div>
          </template>
          <template #default="scope">
            <div class="center-flex-contain">
              <el-button-group>
                <el-button @click.native.stop="passClick(scope.row,scope.$index)"><font-awesome-icon :icon="['fas', 'lock']" /></el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="tableEmpty" />
        </template>
      </el-table>
    </el-main>
    <el-footer>
      <div class="center-flex-contain">
        <el-pagination background layout="prev, pager, next" :total="pageInfo.total" :page-size="pageInfo.size" @current-change="pageChange"/>
      </div>
    </el-footer>
  </el-container>

  <el-drawer v-model="isDrawer"
             :title="isAdd?'新建用户':'编辑'"
             direction="rtl"
             size="30%">
    <template #default>
      <el-form ref="formUser" :model="selectUser" label-width="70px" :rules="rules" status-icon>
        <el-form-item label="用户名"  prop="username">
          <el-input v-model="selectUser.sysUserPo.username" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="selectUser.sysUserPo.roleId">
            <el-option v-for="(item,index) in roleData"
                       :key="index"
                       :label="item.roleName"
                       :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="机构" prop="orgId">
          <el-tree-select
                  v-model="selectUser.sysUserPo.orgId"
                  :data="dimensionTree"
                  check-strictly
                  :render-after-expand="false">
            <template #empty>
              <el-empty description="暂无数据" />
            </template>
          </el-tree-select>
        </el-form-item>
        <el-form-item label="邮箱"  prop="email">
          <el-input v-model="selectUser.sysUserPo.email" />
        </el-form-item>
        <el-form-item label="电话"  prop="phone">
          <el-input v-model="selectUser.sysUserPo.phone" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="selectUser.sysUserPo.state" size="small">
            <el-radio-button :label="0">禁用</el-radio-button>
            <el-radio-button :label="1">正常</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div class="right-flex-contain">
        <el-button type="primary" v-if="uploading" :disabled="uploading">
          <el-icon><Loading /></el-icon>正在提交
        </el-button>
        <el-button type="primary" v-else @click="submitClick" :disabled="uploading">
          保存提交
        </el-button>
      </div>

    </template>

  </el-drawer>

  <el-dialog v-model="passDialog" title="修改密码" width="500">
    <el-form :model="selectUser.sysUserPo" label-width="auto">
      <el-form-item label="密码">
        <el-input v-model="selectUser.sysUserPo.password" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="right-flex-contain">
        <el-button @click="()=>{passDialog=false}">取消</el-button>
        <el-button type="primary" v-if="uploading" :disabled="uploading">
          <el-icon><Loading /></el-icon>正在提交
        </el-button>
        <el-button type="primary" @click="updatePassClick" v-else>修改</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
  import {defineComponent, onMounted, ref, reactive, getCurrentInstance,computed} from "vue"
  import {ElMessage} from "element-plus";
  import MD5 from 'crypto-js/md5'
export default defineComponent({
  name: "UserPage",
  setup(props,context){
    const {proxy} = getCurrentInstance()
    let pageInfo = reactive({size:10,current:1,total:0,terms:[]})
    const loading=ref(false)
    const uploading=ref(false)
    const passDialog=ref(false)
    const tableData=reactive([])
    const searchParams=reactive([])
    const tableEmpty=ref("暂无数据")
    const radioModel=ref(1)

    const isDrawer=ref(false)
    const isAdd=ref(false)
    const selectUser = reactive({sysUserPo:{},sysRolePo:{},dimensionPo:{}})
    const roleData = reactive([])
    const dimensionTree = ref([])
    const formUser=ref(null)

    const dimensionAllTree=computed(()=>{
      const rootTree={value:-1,label:'全部',children:[]}
      rootTree.children.push(...dimensionTree.value)
      return [rootTree]
    })

    const resetParam=()=>{
      searchParams.length=0
      searchParams.push({column:'t.username',value:'',termType:'like',label:'用户名',type:'input'})
      searchParams.push({column:'t.org_id',value:-1,termType:'eq',label:'机构',type:'tree'})
    }

    const validateSelect=(rule, value, callback)=>{
      console.log('validateSelect:'+rule.field)
      if(rule.field == 'username'){
        if(selectUser.sysUserPo.username == undefined || selectUser.sysUserPo.username==''){
          callback(('用户名不能为空'))
        }else{
          callback()
        }
      }else if(rule.field == 'roleId'){
        if(selectUser.sysUserPo.roleId == undefined || selectUser.sysUserPo.roleId==''){
          callback(('角色不能为空'))
        }else{
          callback()
        }
      }else if(rule.field == 'orgId'){
        if(selectUser.sysUserPo.orgId == undefined || selectUser.sysUserPo.orgId==''){
          callback(('机构不能为空'))
        }else{
          callback()
        }
      }else if(rule.field == 'email'){
        if(selectUser.sysUserPo.email == undefined || selectUser.sysUserPo.email==''){
          callback(('邮箱不能为空'))
        }else{
          callback()
        }
      }else if(rule.field == 'phone'){
        if(selectUser.sysUserPo.phone == undefined || selectUser.sysUserPo.phone==''){
          callback(('电话不能为空'))
        }else{
          callback()
        }
      }

    }

    const pageApi=()=>{
      for(var i=pageInfo.terms.length-1;i>=0;i--){
        if(pageInfo.terms[i].column=='t.org_id'&&pageInfo.terms[i].value<0){
          pageInfo.terms.splice(i,1)
        }else if(pageInfo.terms[i].column=='t.username'&&pageInfo.terms[i].value==''){
          pageInfo.terms.splice(i,1)
        }
      }
      console.log('pageApi')
      loading.value=true
      proxy.$http.sysUserPage(pageInfo).then(value=>{
        tableEmpty.value='暂无数据'
        console.log(JSON.stringify(value))
        pageInfo.total=value.data.total
        tableData.length=0
        tableData.push(...value.data.records)
        loading.value=false
      },error=>{
        console.log('error--->')
        tableEmpty.value=error.msg
        tableData.length=0
        loading.value=false
      })
    }
    const addClick=()=>{
      console.log('addClick')
      isAdd.value=true
      isDrawer.value=true
      selectUser.sysUserPo={state: 1}
    }
    const deleteClick=(row,index)=>{
      console.log('deleteClick')
    }
    const passClick=(row,index)=>{
      console.log('passClick')
      selectUser.sysUserPo=JSON.parse(JSON.stringify(row.sysUserPo))
      passDialog.value=true
    }
    const pageChange=(current)=>{
      pageInfo.current=current
      pageApi()
    }
    const roleApi=()=>{
      roleData.length = 0
      proxy.$http.roleApi({current: 1,size: -1}).then(value => {
        console.log('roleApi')
        for(var item of value.data.records){
          roleData.push(item.sysRolePo)
        }
      })
    }
    const dimensionApi=()=>{
      dimensionTree.value.length=0
      proxy.$http.dimensionTree().then(value => {
        var tree={}
        handlerDimensionTree(value.data,tree)
        dimensionTree.value.push(tree)
        console.log('dimensionTree')
      })
    }
    const reloadApi=()=>{
      passDialog.value=false
      uploading.value=false
      isDrawer.value=false
      isAdd.value=false
      pageInfo.current=1
      pageApi()
    }
    const saveUpdateApi=()=>{
      uploading.value=true
      let param=JSON.parse(JSON.stringify(selectUser.sysUserPo))
      if(param.password != undefined && param.password != ''){
        param.password=MD5(param.password).toString()
      }
      delete param.updateTime
      proxy.$http.sysUserSaveUpdate(param).then(value=>{
        reloadApi()
        ElMessage({
          message: '操作成功',
          type: 'success',
          plain: true,
        })
      })
    }
    const selectClick=(row)=>{
      selectUser.sysUserPo=JSON.parse(JSON.stringify(row.sysUserPo))
      console.log('selectClick')
      isDrawer.value=true
      isAdd.value=false
    }
    const queryClick=()=>{
      pageInfo.terms.length=0
      pageInfo.terms.push(...searchParams)
      console.log('查询')
      pageApi()
    }
    const resetClick=()=>{
      console.log('重置')
      resetParam()
      pageInfo.terms.length=0
      pageInfo.terms.push(...searchParams)
      pageApi()
    }
    const handlerDimensionTree=(data,result)=>{
      console.log(data.id+'<->'+data.name)
      result.value=data.id
      result.label=data.name
      result.children=[]
      if(data.children!=null&&data.children.length>0){
        for(let item in data.children){
          const childrenItem={}
          handlerDimensionTree(data.children[item],childrenItem)
          result.children.push(childrenItem)
        }
      }
    }
    const submitClick=()=>{
      console.log('submitClick')
      formUser.value.validate((valid, fields) => {
        if (valid) {
          console.log('submit!:'+JSON.stringify(selectUser.sysUserPo))
          saveUpdateApi()
        } else {
          console.log('error submit!', fields)
        }
      })
    }
    const updatePassClick=()=>{
      if(selectUser.sysUserPo.password != undefined && selectUser.sysUserPo.password != ''){
        saveUpdateApi()
      }else {
        passDialog.value=false
      }
    }
    const rules=ref({
      username:[{validator:validateSelect, trigger: 'blur' }],
      roleId:[{validator:validateSelect, trigger: 'blur' }],
      orgId:[{validator:validateSelect, trigger: 'blur' }],
      email:[{validator:validateSelect, trigger: 'blur' }],
      phone:[{validator:validateSelect, trigger: 'blur' }]
    })
    onMounted(()=>{
      resetParam()
      pageApi()
      roleApi()
      dimensionApi()
    })

    return {
      formUser,
      rules,
      selectUser,
      dimensionAllTree,
      dimensionTree,
      roleData,
      isAdd,
      isDrawer,
      tableEmpty,
      searchParams,
      loading,
      uploading,
      pageInfo,
      tableData,
      passDialog,
      radioModel,
      resetClick,
      passClick,
      selectClick,
      queryClick,
      addClick,
      deleteClick,
      pageChange,
      submitClick,
      updatePassClick
    }
  }
})
</script>

<style scoped lang="sass">
  @use '@/scss/container.scss'
</style>
