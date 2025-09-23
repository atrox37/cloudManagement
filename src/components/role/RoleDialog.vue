<template>
    <el-dialog ref="selfDialog" v-model="drawerStatus" title="角色" @close="closeClick" width="30%">
        <el-form ref="formRole" :model="modeData" :rules="rules">
            <el-form-item label="名称" prop="name">
                <el-input v-model="modeData.name" placeholder="名称" clearable />
            </el-form-item>
            <el-form-item label="机构" prop="orgId">
                <el-tree-select
                        v-model="modeData.select"
                        :data="modeData.data"
                        check-strictly
                        :render-after-expand="false">
                    <template #empty>
                        <el-empty description="暂无数据" />
                    </template>
                </el-tree-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="closeClick">关闭</el-button>
            <el-button type="primary" @click="submitClick" loading-icon="Eleme" :loading="saveLoading">保存</el-button>
        </template>
    </el-dialog>
</template>

<script>
    import {defineComponent, toRef, ref, toRefs, watch, getCurrentInstance} from "vue";
    import { Eleme } from '@element-plus/icons-vue'
    import { ElLoading } from 'element-plus'
    export default defineComponent({
        name: "RoleDialog",
        props:{
            status:{
                type: Boolean,
                required: true,
                default: false
            }
        },
        emits:['closeListener','closeRefreshListener'],
        setup(props,context){
            const {proxy} = getCurrentInstance()
            const saveLoading=ref(false)
            const drawerStatus=toRef(props,'status')
            const selfDialog=ref(null)
            const loading=ref(null)
            const formRole=ref(null)
            const modeData=ref({data:[]})
            const validateSelect=(rule, value, callback)=>{
                if(rule.field == 'name'){
                    if(modeData.value.name == undefined || modeData.value.name == ''){
                        callback(('名称不能为空'))
                    }else{
                        callback()
                    }
                }else if(rule.field == 'orgId'){
                    if(modeData.value.select == undefined || modeData.value.select==''){
                        callback(('机构不能为空'))
                    }else{
                        callback()
                    }
                }

            }
            const rules=ref({
                name:[{validator:validateSelect, trigger: 'blur' }],
                orgId:[{validator:validateSelect, trigger: 'blur' }]
            })

            const dimensionApi=()=>{
                proxy.$http.dimensionTree().then(value => {
                    //modeData.value.data=value.data
                    modeData.value.data.length=0
                    const dimenTree={}
                    handlerDimensionTree(value.data,dimenTree)
                    modeData.value.data.push(dimenTree)
                    loading.value.close()
                })
            }
            const roleSaveApi=()=>{
                let params={roleName:modeData.value.name,orgId:modeData.value.select}
                console.log(params)
                saveLoading.value=true
                setTimeout(()=>{
                    proxy.$http.roleSave(params).then(value => {
                        saveLoading.value=false
                        closeClick()
                        context.emit('closeRefreshListener')
                    })
                },100)
            }

            watch(drawerStatus,(value, oldValue) => {
                console.log('--->'+value)
                if(value){
                    setTimeout(()=>{
                        loading.value=ElLoading.service({ target: '.el-dialog', text: '加载中...',fullscreen: false})
                        dimensionApi()
                    },20)
                }
            })

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
                formRole.value.validate((valid, fields) => {
                    if (valid) {
                        console.log('submit!:')
                        roleSaveApi()
                    } else {
                        console.log('error submit!', fields)
                    }
                })
            }
            const closeClick=()=>{
                console.log('sss')
                context.emit("closeListener")
            }
            return {
                formRole,rules,saveLoading,selfDialog,drawerStatus,modeData,submitClick,closeClick
            }
        }
    })
</script>

<style scoped>
    @import url('./style/index.scss');
</style>
