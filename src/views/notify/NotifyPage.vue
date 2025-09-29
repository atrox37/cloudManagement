<template>
    <el-container>
        <el-header>
            <div class="search-box">
                <el-form v-model="searchParams" :inline="true">
                    <el-form-item label="名称">
                        <el-input v-model="searchParams.name" placeholder="" clearable />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="queryClick">查询</el-button>
                    </el-form-item>
                </el-form>
            </div>

        </el-header>
        <el-main>
            <el-table height="100%" :data="tableData" v-loading="loading" border stripe @selection-change="handleSelectionChange" @row-click="editClick">
                <el-table-column prop="configPo.name" label="名称" header-align="center" align="center"/>
                <el-table-column label="类型" width="100"  header-align="center" align="center">
                    <template #default="scope">
                        <el-text>{{notifyEnum(scope.row)}}</el-text>
                    </template>
                </el-table-column>
                <el-table-column prop="userPo.username" label="创建人" width="200"  header-align="center" align="center"/>
                <el-table-column prop="dimensionPo.name" label="所属机构" width="250"  header-align="center" align="center"/>
                <el-table-column prop="configPo.createTime" label="创建时间" width="200"  header-align="center" align="center"/>
                <el-table-column prop="configPo.updateTime" label="更新时间" width="200"  header-align="center" align="center"/>
                <el-table-column>
                    <template #header>
                        <div class="center-flex-contain">
                            <el-dropdown placement="top-start" @command="(command) => addClick(command)">
                                <el-button>
                                    <font-awesome-icon size="1x" :icon="['fasr', 'square-plus']"/>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item command="email">邮箱</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                    </template>
                    <template #default="scope">
                        <div class="center-flex-contain">
                            <el-button @click.native.stop="deleteClick(scope.row,scope.$index)"><font-awesome-icon :icon="['fasr', 'trash']" /></el-button>
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
    <NotifyEmailConfig :data="configData" @close="closeDraw" @save="saveDraw"></NotifyEmailConfig>
    <NotifyAwsEmailConfig :data="configData" @close="closeDraw" @save="saveDraw"></NotifyAwsEmailConfig>
</template>

<script>
    import {defineComponent, reactive, ref, getCurrentInstance, onMounted, toRef} from "vue"
    import NotifyEmailConfig from '@/views/notify/components/NotifyEmailConfig.vue'
    import NotifyAwsEmailConfig from '@/views/notify/components/NotifyAwsEmailConfig.vue'
    import {notifyType} from '@/model/notify/NotifyType'
    import {useRouter} from "vue-router";
    import { ElMessage } from "element-plus";
    export default defineComponent({
        name: "NotifyPage",
        components:{NotifyEmailConfig,NotifyAwsEmailConfig},
        setup(context){
            const {proxy} = getCurrentInstance()
            const router = useRouter()
            const searchParams=ref({})
            const tableData = reactive([])
            const loading = ref(true)
            const nType=toRef(notifyType)
            const pageTotal = ref(0)
            const page=ref({size:10,current:1})

            const configData=reactive({state:false,loading:false,data:{}});

            const notifyEnum=(row)=>{
                var label=''
                for(let item of nType.value){
                    if(item.type == row.configPo.code){
                        label=item.name
                        break
                    }
                }
                console.log('notifyEnum')
                return label
            }

            const pageApi=()=>{
                console.log('notifyPageApi')
                loading.value=true
                proxy.$http.notifyPage(page.value).then(value => {
                    pageTotal.value=value.data.total
                    loading.value=false
                    tableData.length=0
                    tableData.push(...value.data.records)
                })
            }
            const reload=()=>{
                configData.loading=false
                configData.state=false
                pageApi()
            }
            const saveUpdate=()=>{
                proxy.$http.notifyConfigSaveUpdate(configData.data).then(value => {
                  ElMessage({
                    showClose: true,
                    message: "操作成功",
                    type: "success",
                  });
                  reload()
                }, error => {
                  reload()
                })
            }
            const addClick=(type)=>{
                configData.loading=false
                console.log('addClick:'+type)
                if(type=='email'){
                    configData.data={name:'',code:'email',config:{type:'email',host:'',port:0,pass:'',from:''}}
                }else if(type=='aws-email'){
                    configData.data={name:'',code:'aws-email',config:{type:'type',from:'',host:'',smtpUsername:0,smtpPassword:''}}
                }
                configData.state=true
                /*configData.data=row.configPo
                configData.state=true*/
            }
            const editClick=(row)=>{
                console.log('rowclick-->'+JSON.stringify(row))
                configData.data=row.configPo
                configData.state=true
                /*router.push({
                    path: '/notifyAdd',
                    query: {
                        id: row.configPo.id
                    }
                })*/
            }
            const deleteClick=(row,index)=>{
                console.log('deleteClick')
            }
            const queryClick=()=>{
                console.log('queryClick')
            }
            const handleSelectionChange=(selection)=>{
                console.log(selection)
            }
            const pageChange=(current)=>{
                page.value.current=current
                console.log('pageChange'+current)
                pageApi()
            }
            const closeDraw=()=>{
                configData.state=false
            }
            const saveDraw=(data)=>{
                console.log('saveDraw')
                configData.loading=true
                delete configData.updateTime
                delete configData.createTime
                saveUpdate()
            }

            onMounted(() => {
                pageApi()
            })
            return {
                loading,
                tableData,
                pageTotal,
                searchParams,
                saveDraw,
                configData,
                closeDraw,
                notifyEnum,
                queryClick,
                addClick,
                editClick,
                deleteClick,
                pageChange,
                handleSelectionChange
            }
        }
    })
</script>

<style scoped lang="sass">
    @import '../../scss/container.scss'
    @import 'style/page.scss'
</style>