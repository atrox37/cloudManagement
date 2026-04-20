<template>
    <el-container>
        <el-header>
            <div class="search-box">
                <el-form v-model="searchParams" :inline="true">
                    <el-form-item :label="$t('notifyUser.name')">
                        <el-input v-model="searchParams.name" placeholder="" clearable />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="queryClick">{{ $t('common.search') }}</el-button>
                    </el-form-item>
                </el-form>
            </div>

        </el-header>
        <el-main>
            <el-table height="100%" :data="tableData" v-loading="loading" stripe @cell-click="itemClick">
                <!-- <el-table-column prop="templateUserPo.id" label="ID" width="60" header-align="center" align="center"/> -->
                <el-table-column prop="templateUserPo.name" :label="$t('notifyUser.name')" width="100" header-align="center" align="center"/>
                <el-table-column prop="templateUserPo.receiver" :label="$t('notifyUser.receiver')" width="200"  header-align="center" align="center"/>
                <el-table-column prop="configPo.code.msgName" :label="$t('notifyUser.receiveType')" width="100"  header-align="center" align="center"/>
                <el-table-column prop="configPo.name" :label="$t('notifyUser.notifyName')" width="100"  header-align="center" align="center"/>
                <el-table-column prop="configPo.code.name" :label="$t('notifyUser.notifyType')" width="100"  header-align="center" align="center"/>
                <el-table-column prop="templatePo.msgType.name" :label="$t('notifyUser.templateType')" width="100"  header-align="center" align="center"/>
                <el-table-column prop="templatePo.msgType.name" :label="$t('notifyUser.templateData')" width="200"  header-align="center" align="center">
                    <template #default="scope">
                        <p style="overflow:hidden;text-overflow: ellipsis;white-space: nowrap;">{{handlerNotifyContent(scope.row)}}</p>
                    </template>
                </el-table-column>
                <el-table-column>
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
                        :total="pageTotal">
                </el-pagination>
            </div>
        </el-footer>
    </el-container>
</template>
<script>
    import {defineComponent, reactive, ref, getCurrentInstance, onMounted} from "vue"
    import {useRouter} from "vue-router";
    import { useI18n } from 'vue-i18n'
    export default defineComponent({
        name: "NotifyUserPage",
        setup() {
            const { t } = useI18n()
            const {proxy} = getCurrentInstance()
            const router = useRouter()
            const searchParams=ref({})
            const tableData = reactive([])
            const loading = ref(true)
            const pageTotal = ref(0)
            const page=ref({size:10,current:1, sorts: [{ column: "t.update_time", order: "desc" }]})
            const pageApi=()=>{
                loading.value=true
                proxy.$http.notifyTemplateUserPage(page.value).then(value => {
                    pageTotal.value=value.data.total
                    loading.value=false
                    tableData.length=0
                    tableData.push(...value.data.records)
                })
            }
            const pageChange=(current)=>{
                page.value.current=current
                console.log('pageChange'+current)
                pageApi()
            }
            const itemClick=(row, column, cell, event)=>{
                console.log('itemclick')
            }
            const editClick=(row,index,target)=>{
                console.log('editClick')
            }
            const deleteClick=(row,index)=>{
                console.log('deleteClick')
            }
            const queryClick=()=>{
                console.log('queryClick')
            }
            const handlerNotifyContent=(data)=>{
                console.log('handlerNotifyContent')
                if(JSON.stringify(data) != "{}"){
                    var resultData={}
                    for(var key in JSON.parse(data.templatePo.msgContent)){
                        var val= JSON.parse(data.templatePo.msgContent)[key]
                        for(var vKey in data.templateUserPo.variables){
                            if(val.indexOf('{$'+vKey+'}')>=0){
                                val=val.replaceAll('{$'+vKey+'}',data.templateUserPo.variables[vKey])
                            }
                        }
                        resultData[key]=val
                    }
                    console.log('handlerNotifyContent')
                    return JSON.stringify(resultData)
                }else{
                    return ''
                }

            }
            onMounted(()=>{
                console.log('mounted')
                pageApi()
            })
            return {
                loading,
                searchParams,
                tableData,
                page,
                pageTotal,
                pageChange,
                editClick,
                deleteClick,
                queryClick,
                handlerNotifyContent,
                itemClick
            }
        }
    })
</script>
<style scoped lang="sass">
    @import '../../scss/container.scss'
</style>