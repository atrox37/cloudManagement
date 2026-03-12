<template>
    <el-container>
        <el-main>

            <el-table ref="elTable" :data="records" border highlight-current-row @current-change="handleCurrentChange" style="width: auto;">
                <!-- <el-table-column prop="id" label="Id" align="center" width="100"/> -->
                <el-table-column prop="roleName" label="角色名称" align="center" width="400"/>
                <el-table-column prop="orgName" label="组织机构" align="center" width="400"/>
                <el-table-column prop="updateTime" label="更新时间" align="center" width="300"/>

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
                                <el-button @click="deleteClick(scope.row,scope.$index)"><font-awesome-icon :icon="['fasr', 'trash']" /></el-button>
                            </el-button-group>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

        </el-main>
        <el-footer>
            <el-pagination background layout="prev, pager, next" :total="pageInfo.total" :page-size="pageInfo.size"
                           @current-change="prevClick" @next-click="prevClick" @prev-click="prevClick"/>
        </el-footer>
    </el-container>

    <!--<el-drawer v-model="drawer" :direction="direction" :before-close="drawCloseListener" :size="drawer2?'40%':'30%'">
        <template #header>
            <h4>一级菜单</h4>
        </template>
        <template #default>
            <div>
                <el-tree
                        :data="treeData"
                        show-checkbox
                        node-key="id"
                        @node-click="menuClick"
                        ref="elTree"
                        default-expand-all
                        :default-checked-keys="[]"
                        :props="defaultProps"/>
            </div>

            <el-drawer v-model="drawer2" :direction="direction" :before-close="draw2CloseListener">
                <template #header>
                    <h4>二级菜单</h4>
                </template>
                <template #default>
                    <el-form label-position="right" label-width="80px">
                        <el-form-item label="菜单名称">
                            <el-input></el-input>
                        </el-form-item>
                        <el-form-item label="目录地址">
                            <el-input></el-input>
                        </el-form-item>
                        <el-form-item label="权限">
                            <el-checkbox-group v-model="checkboxGroup" @change="handlerPermissionCheck">
                                <el-checkbox v-for="(item,index) in permissions" :key="String(index)"  :label="item.id" border>
                                    {{item.name}}
                                </el-checkbox>
                            </el-checkbox-group>
                        </el-form-item>
                    </el-form>
                </template>
                <template #footer>
                    <div style="flex: auto">
                        <el-button>cancel</el-button>
                        <el-button type="primary">confirm</el-button>
                    </div>
                </template>

            </el-drawer>

        </template>
        <template #footer>
            <div style="flex: auto">
                <el-button>cancel</el-button>
                <el-button type="primary">confirm</el-button>
            </div>
        </template>
    </el-drawer>-->
    <RoleMenuDrawer :roleDrawer="drawer" :roleData="drawer" @close="drawCloseListener"></RoleMenuDrawer>
    <RoleDialog :status="roleDialogStatus" @closeListener="closeListener" @closeRefreshListener="refreshListener"></RoleDialog>

</template>
<script>
import { defineComponent,ref,reactive,getCurrentInstance,toRef,onMounted} from 'vue'
import RoleDialog from '@/components/role/RoleDialog.vue';
import RoleMenuDrawer from "@/components/role/RoleMenuDrawer.vue";
import {roleApi,menuRoleApi,menuPermissionApi,userPermissionApi} from "@/util/request";
export default defineComponent({
    name: "Role",
    components:{RoleDialog},
    setup(props){
        let elTree = ref();

        let drawer = ref(false);
        let drawerMinWidth = ref(200);
        let drawer2 = ref(false);
        const direction = ref('rtl')
        let elTable = ref();

        let records = reactive([])
        let checkboxGroup = ref([1])
        let pageInfo = reactive({size:10,current:0,total:0, sorts: [{ column: "t.update_time", order: "desc" }]})
        let treeData=reactive([])
        let permissions = reactive([])

        const roleDialogStatus=ref(false)
        const defaultProps={
            children: 'children',
            label: 'label',
        }
        const drawClose=()=>{
            drawer.value=false
        }
        const addClick=()=>{
            roleDialogStatus.value=true
        }
        const closeListener=()=>{
            console.log('closeListener')
            roleDialogStatus.value=false
        }
        const refreshListener=()=>{
            pageInfo.current=0
            closeListener()
            apiAllMenu()
        }
        const drawCloseListener=(done)=>{
            console.log("drawCloseListener1")
            let data=elTable.value.getSelectionRows()
            elTable.value.setCurrentRow()
            drawer.value=false
            console.log(`drawCloseListener2:${data}`)
        }
        const draw2OpenListener=(done)=>{
            drawer2.value=true
        }
        const draw2CloseListener=(done)=>{
            drawer2.value=false
        }
        const editClick=(row,index,target)=>{
            console.log('rowclick-->'+JSON.stringify(row))
        }
        const deleteClick=(row,index)=>{
            console.log('deleteClick')
        }
        const apiMenuAll=(params)=>{
            menuRoleApi(params).then(value => {
                if(JSON.stringify(params) == "{}"){
                    let data=[];
                    for(const item of value.data){
                        let elItem={id:item.id,label:item.name,children:[]}
                        if(item.children != null&&item.children.length>0){
                            handlerTreeData(item.children,elItem)
                        }
                        data.push(elItem)
                    }
                    treeData.length=0
                    for(const item of data){
                        treeData.push(item)
                    }
                }else{
                    elTree.value.setCheckedKeys([2]);
                    let checks=[]
                    handerCheckTree(value.data,checks)
                    elTree.value.setCheckedKeys(checks);
                    console.log("选中菜单")

                }
                console.log(treeData)
            })
        }

        const handerCheckTree=(data,checkId)=>{
            for(let dataItem of data){
                checkId.push(dataItem.id)
                if(dataItem.children!=null&&dataItem.children.length>0){
                    handerCheckTree(dataItem.children,checkId)
                }
            }
        }

        const handlerPermissionCheck=(value)=>{
            checkboxGroup.value=[]
            for(let n of value){
                checkboxGroup.value.push(n)
            }
        }

        const handlerTreeData=(data,parent)=>{
            for(let item of data){
                let elItem={id:item.id,label:item.name,children:[]}
                if(data.children!=null&&data.children.length>0){
                    handlerTreeData(data.children,elItem)
                }
                parent.children.push(elItem)
            }
        }
        const apiAllMenu=()=>{
            roleApi(pageInfo).then(value => {
                records.length=0
                pageInfo.total=value.data.total
                for(let item of value.data.records){
                    records.push(item)
                }
                console.log(pageInfo)
            })
        }
        const apiUserPermission=(params)=>{
            userPermissionApi(params).then(value => {
                checkboxGroup.value = []
                for(let item of value.data){
                    checkboxGroup.value.push(item.id)
                }
            })
        }
        const prevClick=(num)=>{
            console.log(`num=>${num}`)
            records.length=0
            pageInfo.current = num
            apiAllMenu()
        }
        const handleCurrentChange=(data)=>{
            console.log(`选中${data}`);
            /*apiMenuAll(data!=null?{roleId: data.id}:{})
            if(data!=null){
                apiUserPermission({roleId: data.id})
            }*/
            drawer.value=true;
        }
        const menuClick=(data)=>{
            requestMenuPermission(data.id)
            draw2OpenListener(null)
        }
        const requestMenuPermission=(menuId)=>{
            menuPermissionApi({menuId:menuId}).then(value=>{
                console.log(value)
                permissions.length=0
                for(const item of value.data){
                    permissions.push(item)
                }
            })
        }

        onMounted(()=>{
            apiMenuAll({})
            apiAllMenu()
        })
        return {
            elTree,
            elTable,
            drawer,
            drawerMinWidth,
            drawer2,
            direction,
            defaultProps,
            treeData,
            permissions,
            checkboxGroup,
            records,
            pageInfo,
            roleDialogStatus,
            addClick,
            closeListener,
            refreshListener,
            prevClick,
            handleCurrentChange,
            menuClick,
            handlerPermissionCheck,
            drawCloseListener,
            draw2OpenListener,
            draw2CloseListener}
    }
})
</script>

<style scoped>
    @import url('style/index_role.scss');

</style>
