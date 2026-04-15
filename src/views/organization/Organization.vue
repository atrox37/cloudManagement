<template>
    <div v-if="data!=null" class="container-view">
        <organization-chart :datasource="data" pan="true">
            <template #default="scope">
                <div class="org_header">{{scope.nodeData.name }}</div>
                <div class="org_footer">
                    <span class="footer_count">{{scope.nodeData.children==null?'0':scope.nodeData.children.length }}</span>
                    <span class="footer_more" @click="itemClicked(scope.nodeData)">
                            <el-dropdown :ref="setItemRef" trigger="contextmenu" @visible-change="dropChange" :id="scope.nodeData.id+``" @command="userClick">
                                <font-awesome-icon :icon="['fas', 'caret-down']" size="lg"><arrow-down /></font-awesome-icon>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item :command="`1-`+scope.nodeData.id">
                                            <el-text><el-icon><Edit /></el-icon>编辑</el-text>
                                        </el-dropdown-item>
                                        <el-dropdown-item :command="`2-`+scope.nodeData.id">
                                            <el-text><el-icon><User /></el-icon>人员</el-text>
                                        </el-dropdown-item>
                                        <el-dropdown-item :command="`3-`+scope.nodeData.id">
                                            <el-text><el-icon><Plus /></el-icon>添加</el-text>
                                        </el-dropdown-item>
                                        <el-dropdown-item :command="`4-`+scope.nodeData.id" divided>
                                            <el-text><el-icon><Delete /></el-icon>删除</el-text>
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </span>
                </div>
            </template>
        </organization-chart>
    </div>
    <OrgDialog :dimension="selectDimension" :status="orgDialogStatus" :loading="orgDialogLoading" @cancelClick="orgDialogCancel" @submitClick="orgDialogSubmit"></OrgDialog>
    <!--<div v-if="data!=null" class="container-view">
        <MenuContainerHeader :label="titleRef" :back="false">
        </MenuContainerHeader>


    </div>-->

    <el-drawer v-if="userDatas!=null" v-model="userDraw" direction="rtl" :size="drawSize" title="关联用户">
        <template #default>
            <el-table :data="userDatas">
                <el-table-column prop="username" label="用户"/>
                <el-table-column label="状态" align="center" min-width="100">
                    <template #default="scope">
                        <el-tag v-if="scope.row.state == 0" effect="dark" type="danger">禁用</el-tag>
                        <el-tag v-else effect="dark">正常</el-tag>
                    </template>
                </el-table-column>
            </el-table>
        </template>
    </el-drawer>


</template>

<script>
    import OrganizationChart from 'vue3-organization-chart'
    import 'vue3-organization-chart/dist/orgchart.css'
    import OrgDialog from "@/components/organization/OrgDialog.vue";
    import SelectUser from "@/components/organization/SelectUser.vue";
    /*import MenuContainerHeader from '@/components/menuContain/MenuContainerHeader.vue';
    import SelectUser from "@/components/organization/SelectUser.vue";
    import OrgDialog from "@/components/organization/OrgDialog.vue";*/
    import {defineComponent, ref, onMounted, getCurrentInstance} from "vue"
    export default defineComponent({
        name: "Organization",
        components:{OrganizationChart,SelectUser,OrgDialog},/**,MenuContainerHeader,SelectUser,OrgDialog**/
        setup() {
            const {proxy} = getCurrentInstance()
            const drawSize=ref('26%')
            const titleRef=ref("组织管理")
            const selectUserComponents=ref(null)
            const userDraw=ref(false)
            const orgDialogStatus=ref(false)
            const orgDialogLoading=ref(false)
            const data=ref(null)
            const userDatas=ref([])
            const selectId=ref(-1)
            const selectDimension=ref(null)
            const ds=ref({"id": "1","name": "Lao Lao","title": "general manager","children": [{ "id": "2", "name": "Bo Miao", "title": "department manager","children":[]},{ "id": "3", "name": "Su Miao", "title": "department manager","children": [{ "id": "4", "name": "Tie Hua", "title": "senior engineer","children":[] },{ "id": "5", "name": "Hei Hei", "title": "senior engineer","children": [{ "id": "6", "name": "Pang Pang", "title": "engineer" ,"children":[]},{ "id": "7", "name": "Xiang Xiang", "title": "UE engineer","children":[] }]}]},{ "id": "8", "name": "Hong Miao", "title": "department manager" ,"children":[]},{ "id": "9", "name": "Chun Miao", "title": "department manager","children":[] }]})
            const dropDown=ref([])
            const orgs=[]
            const orgsRef=ref([])


            const setItemRef = (el) => {
                dropDown.value.push(el)
            }
            const itemClicked=(data)=>{
                console.log('itemClicked'+data.id)
                for (var index in dropDown.value){
                    if (dropDown.value[index].id==data.id){
                        dropDown.value[index].handleOpen()
                    }else{
                        dropDown.value[index].handleClose()
                    }
                }
            }
            const requestApi=()=>{
                proxy.$http.dimensionTree().then(value => {
                    orgs.length=0
                    data.value=value.data
                    handlerOrgs([value.data])
                    console.log('requestApi')
                })
            }
            const requestById=()=>{
                let params={terms:[{column:'id',value:selectId.value}]}
                proxy.$http.querydimension(params).then(value => {
                    console.log('requestById')
                    selectDimension.value=value.data
                    orgDialogStatus.value=true
                })
            }



            const handlerOrgs=(values)=>{
                for(let index in values){
                    orgs.push(values[index].id)
                    if(values[index].children!=null&&values[index].children.length>0){
                        handlerOrgs(values[index].children)
                    }else{
                        continue
                    }
                }
            }
            const requestDimensionUser=()=>{
                if(selectId.value>=0){
                    const param={"terms": [{"column": "t.org_id","value": selectId.value}]}
                    proxy.$http.dimensionUser(param).then(value => {
                        userDatas.value.length=0
                        userDatas.value.push(...value.data)
                        userDraw.value=true
                        console.log("userdata")
                    })
                }

            }
            const requestSubmitAccount=(data)=>{
                console.log('requestSubmitAccount')
                if(data.length>0){
                    proxy.$http.saveUpdateUser(data).then(value => {
                        console.log(JSON.stringify(value))
                    })
                }
            }
            const requestSubmitDimension=()=>{
                console.log('requestSubmitDimension')
                orgDialogLoading.value=true
                proxy.$http.saveDimension(selectDimension.value).then(value=>{
                    console.log(JSON.stringify(value))
                    orgDialogStatus.value=false
                    orgDialogLoading.value=false
                    requestApi()
                })
            }
            const requestDeleteDimension=()=>{
                console.log('requestDeleteDimension')
                proxy.$http.deleteDimension({id:selectId.value}).then(value => {
                    console.log('deleteDimension')
                    requestApi()
                },error=>{
                    console.log('deleteDimension fail')
                })
            }
            const setAddDrawListener=function (flag) {
                console.log(flag)
                drawSize.value=flag?'30%':'26%'
            }
            const userClick=(dropCommand)=>{
                let splitData = dropCommand.split('-');
                let commandId=splitData[0]
                selectId.value=parseInt(splitData[1])
                orgsRef.value.length=0
                for(let index in orgs){
                    if(orgs[index] != selectId.value){
                        orgsRef.value.push(orgs[index])
                    }
                }
                console.log(commandId+'<--->'+selectId.value)
                if(commandId==2){
                    requestDimensionUser()
                }
                if(commandId==1){
                    requestById()
                }
                if(commandId==3){
                    selectDimension.value={parentId:selectId.value}
                    orgDialogStatus.value=true
                }
                if(commandId==4){
                    requestDeleteDimension()
                }

            }
            const dropChange=(visible)=>{
                console.log('dropChange')
            }
            const saveClick=function() {
                const submitData=selectUserComponents.value.getSubmitData()
                const commitData=[]
                for(let index in submitData[0]){
                    const itemData=submitData[0][index]
                    itemData.dimensionId=selectId.value
                    commitData.push(itemData)
                }
                for(let index in submitData[1]){
                    const itemData=submitData[1][index]
                    itemData.dimensionId=null
                    commitData.push(itemData)
                }

                console.log('saveClick')
                requestSubmitAccount(commitData)
            }
            const orgDialogCancel=()=>{
                orgDialogStatus.value=false
            }
            const orgDialogSubmit=()=>{
                console.log('orgDialogSubmit-->'+JSON.stringify(selectDimension.value))
                requestSubmitDimension()
            }
            onMounted(()=>{
                requestApi()
            })
            return {titleRef,
                data,
                ds,
                dropDown,
                userDraw,
                drawSize,
                userDatas,
                orgsRef,
                selectUserComponents,
                selectDimension,
                orgDialogStatus,
                orgDialogLoading,
                saveClick,
                setItemRef,
                itemClicked,
                dropChange,
                userClick,
                setAddDrawListener,
                orgDialogCancel,
                orgDialogSubmit}
        }
    })
</script>

<style scoped>
    @import url('style/index.scss');
</style>
