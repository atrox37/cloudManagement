<template>
    <el-drawer v-model="drawer" direction="rtl" :before-close="closeDrawer">
        <template #header>
            <h4>权限菜单</h4>
        </template>
        <template #default>
            <el-form v-model="menu" label-position="right" label-width="80px">
                <el-form-item label="菜单名称">
                    <el-input disabled v-model="menu.label" placeholder="请输入名称"></el-input>
                </el-form-item>
                <el-form-item label="目录地址">
                    <el-input disabled v-model="menu.path" placeholder="请输入地址"></el-input>
                </el-form-item>
                <el-form-item label="权限">
                    <el-checkbox-group v-model="checkboxGroup" @change="handlerPermissionCheck">
                        <el-checkbox v-for="(item,index) in sourceCheck" :key="String(index)"  :label="item.id" border style="margin: 0 4px 8px 0px;">
                            {{item.name}}
                        </el-checkbox>
                    </el-checkbox-group>
                </el-form-item>
            </el-form>
        </template>
        <template #footer>
            <div class="right-flex-contain">
                <el-button type="primary" @click="submitClick" :loading="submitLoading">保存提交</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script>
import {defineComponent, toRef,ref, reactive, watch, getCurrentInstance} from "vue";
export default defineComponent({
    name: "RoleMenuPermissionDrawer",
    props:{
        permissionDrawer:{
            type: Boolean,
            required: true,
            default: false
        },
        roleData:{
            type:Object,
            request: false,
            default: undefined
        },
        menuData:{
            type:Object,
            request: false,
            default: undefined
        }
    },
    emits:['close'],
    setup(props,context){
        const {proxy} = getCurrentInstance()
        const drawer=toRef(props,'permissionDrawer')
        const role=toRef(props,'roleData')
        const menu=toRef(props,'menuData')
        const permissions = reactive([])
        const checkboxGroup = ref([])
        const sourceCheck=reactive([])
        const submitLoading=ref(false)
        watch(drawer,(value,oldValue) => {
            if(value){
                permissionApi()
            }
        })
        watch(menu,(value,oldValue)=>{
            console.log('pdrawer')
            if(value!=null&&value.id!=null){
                requestMenuPermission()
            }
        })
        const handlerPermissionCheck=(value)=>{
            //checkboxGroup.value.length=0
            //checkboxGroup.value.push(...value)
            console.log(JSON.stringify(checkboxGroup.value))
        }
        const closeDrawer=()=>{
            submitLoading.value=false
            context.emit('close')
        }
        const requestMenuPermission=()=>{
            const params={menuId:menu.value.id}
            proxy.$http.menuPermissionApi(params).then(value=>{
                permissions.length=0
                for(const item of value.data){
                    permissions.push(item)
                }
                console.log('requestMenuPermission')
            })
        }
        const permissionApi=()=>{
            const params={roleId: role.value.sysRolePo.id}
            proxy.$http.userPermissionApi(params).then(value => {
                console.log('permissionApi')
                checkboxGroup.value.length=0
                sourceCheck.length=0
                for(let p of permissions){
                    for(let item of value.data){
                        if(p.id==item.id){
                            sourceCheck.push(item)
                            if(item.permissionStatus==1){
                                checkboxGroup.value.push(item.id)
                            }
                            break
                        }
                    }
                }
            })
        }
        const submitClick=()=>{
            submitLoading.value=true
            let submitData=[]
            for(let sourceItem of sourceCheck){
                let statusData=0
                for(let checkId of checkboxGroup.value){
                    if(checkId == sourceItem.id){
                        statusData=1
                        break
                    }
                }
                submitData.push({id:sourceItem.rolePermissionId,roleId:role.value.sysRolePo.id,permissionId:sourceItem.id,state:statusData})
            }
            for(let data of submitData){
                console.log(JSON.stringify(data))
            }
            proxy.$http.rolePermissionUpdate(submitData).then(value=>{
                console.log('result->'+JSON.stringify(value))
                closeDrawer()
            })

        }
        return {
            submitLoading,
            drawer,
            menu,
            checkboxGroup,
            permissions,
            sourceCheck,
            submitClick,
            closeDrawer,
            handlerPermissionCheck
        }
    }
})
</script>

<style scoped>

</style>
