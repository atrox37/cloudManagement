<template>
    <el-drawer ref="drawerView" v-model="drawer" direction="rtl" :before-close="drawCloseListener" :size="permitterDrawer?'40%':'30%'">
        <template #header>
            <h4>页面菜单</h4>
        </template>
        <template #default>
            <div>
                <el-tree
                        :data="treeData"
                        show-checkbox
                        node-key="id"
                        @node-click="menuClick"
                        @check-change="menuChange"
                        ref="elTree"
                        default-expand-all
                        :check-on-click-leaf="false"
                        :default-checked-keys="[]"
                        :props="defaultProps">
                    <template #empty>
                        <el-empty description="暂无数据" />
                    </template>
                </el-tree>
            </div>
        </template>
        <template #footer>
            <div class="right-flex-contain">
                <el-button type="primary" @click="submitClick">保存提交</el-button>
            </div>
        </template>
    </el-drawer>
    <RoleMenuPermissionDrawer :permissionDrawer="permitterDrawer" :roleData="role" :menuData="menuData" @close="permissionClose"></RoleMenuPermissionDrawer>
</template>

<script>
    import {defineComponent, watch, ref, toRef, reactive, getCurrentInstance,onMounted} from "vue";
    import RoleMenuPermissionDrawer from '@/components/role/RoleMenuPermissionDrawer.vue';

    export default defineComponent({
        name: "RoleMenuDrawer",
        components:{RoleMenuPermissionDrawer},
        props:{
            roleDrawer:{
                type: Boolean,
                required: true,
                default: false
            },
            roleData:{
                type:Object,
                request: false,
                default: undefined
            }
        },
        emits:['close'],
        setup(props,context){
            const {proxy} = getCurrentInstance()
            const drawerView=ref(null)
            const elTree=ref(null)
            const drawer=toRef(props,'roleDrawer')
            const role=toRef(props,'roleData')
            let treeData=reactive([])
            let checksource=reactive([])
            let sourceTreeData=[]
            let rootData=new Set()

            let submitAdd=[]

            const permitterDrawer=ref(false)
            const menuData=ref(null)

            const defaultProps=reactive({
                children: 'children',
                label: 'label'
            })
            watch(drawer,(value,oldvalue)=>{
                if(value){
                    let params=role.value==null?{}:{roleId: role.value.sysRolePo.id}
                    requestMenuApi(params)
                }
            })

            const menuClick=(data)=>{
                menuData.value=data
                permitterDrawer.value=true
            }
            const menuChange=(po,currentNode,parentNode)=>{
                if(!rootData.has(po.id)){
                    po.state=currentNode?1:0
                }
                handlerTree(treeData)
            }

            //获取所有checked的id
            const handerCheckTree=(data,checkId)=>{
                for(let dataItem of data){
                    if(rootData.has(dataItem.id)&&dataItem.state==1){
                        checkId.push(dataItem.id)
                        console.log('checkId')
                    }
                    if(dataItem.children!=null&&dataItem.children.length>0){
                        handerCheckTree(dataItem.children,checkId)
                    }
                }
            }
            //实时修改checked状态
            const handlerTree=(data)=>{
                let flag=0;
                for(let dataItem of data){
                    if(dataItem.children!=null&&dataItem.children.length>0){
                        flag=handlerTree(dataItem.children)
                        dataItem.state=flag
                        continue
                    }else{
                        if(dataItem.state==1){
                            flag=1;
                            break
                        }
                    }
                }
                return flag;

            }
            //初始化tree数据
            const handlerTreeData=(data,parent)=>{
                for(let item of data){
                    let elItem={id:item.id,label:item.name,children:[],state:item.state,statusSource:item.state,roleMenuId:item.roleMenuId}
                    if(data.children!=null&&data.children.length>0){
                        rootData.add(item.id)
                        handlerTreeData(data.children,elItem)
                    }else{
                        elItem.path=item.path
                    }
                    parent.children.push(elItem)
                }
            }
            //初始化tree的中roleMenuId
            const initHandlerTreeCheck=(data)=>{
                for(let dataItem of data){

                    for(let checksourceItem of checksource){
                        if(checksourceItem.id == dataItem.id){
                            dataItem.roleMenuId=checksourceItem.roleMenuId
                        }
                    }

                    if(dataItem.children!=null&&dataItem.children.length>0){
                        initHandlerTreeCheck(dataItem.children)
                    }
                }
            }

            const submitAddFunc=(trees,updateData)=>{
                for(let dataItem of trees){
                    if(dataItem.state!=dataItem.statusSource){
                        updateData.push({roleId:role.value.id,menuId:dataItem.id,state:dataItem.state,id:dataItem.roleMenuId})
                    }
                    if(dataItem.children!=null&&dataItem.children.length>0){
                        submitAddFunc(dataItem.children,updateData)
                    }
                }
            }
            const requestMenuApi=(params)=>{
                console.log('requestMenuApi')
                proxy.$http.menuRoleApi(params).then(value => {
                    var checks=[]
                    treeData.length=0
                    sourceTreeData.length=0
                    let data=[];
                    for(const item of value.data){
                        let elItem={id:item.id,label:item.name,children:[],state:item.state,statusSource:item.state,roleMenuId:item.roleMenuId}
                        if(item.children != null&&item.children.length>0){
                            rootData.add(item.id)
                            handlerTreeData(item.children,elItem)
                        }else{
                            elItem.path=item.path
                        }
                        data.push(elItem)
                    }
                    for(const item of data){
                        treeData.push(item)
                    }
                    console.log("初始化菜单111")
                    checksource.length=0
                    handerCheckTree(value.data,checks)
                    setTimeout(()=>{
                        elTree.value.setCheckedKeys(checks);
                    },100)
                })
            }


            const permissionClose=()=>{
                console.log('permissionClose')
                permitterDrawer.value=false
            }
            const drawCloseListener=(done)=>{
                context.emit('close')
            }
            const submitClick=()=>{
                let submitData=[]
                submitAddFunc(treeData,submitData)
                console.log(JSON.stringify(submitData))
                if(submitData.length>0){
                    proxy.$http.roleMenuUpdate(submitData).then(value => {
                        console.log('submit success')
                        drawCloseListener()
                    })
                }else{
                    drawCloseListener()
                }

            }

            return {
                defaultProps,
                treeData,
                elTree,
                drawerView,
                drawer,
                permitterDrawer,
                menuData,
                role,
                menuClick,
                submitClick,
                menuChange,
                drawCloseListener,
                permissionClose
            }
        }
    })
</script>

<style scoped>
@import "style/index_menu_drawer.scss";
</style>
