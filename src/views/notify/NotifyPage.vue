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
                            <el-empty :description="$t('common.noData')" />
                        </template>
                        </el-tree-select>
                        <el-select v-if="item.type == 'select'" v-model="item.value" style="width:200px">
                        <el-option v-for="(item,index) in item.select" :key="index" :label="item.name"
                                    :value="item.type"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="queryClick">{{ $t('common.search') }}</el-button>
                        <el-button type="info" @click="resetClick">{{ $t('common.reset') }}</el-button>
                    </el-form-item>
                </el-form>
            </div>

        </el-header>
        <el-main>
            <el-table height="100%" :data="tableData" v-loading="loading" border stripe @selection-change="handleSelectionChange" @row-click="editClick">
                <el-table-column prop="configPo.name" :label="$t('notify.name')" header-align="center" align="center"/>
                <el-table-column :label="$t('notify.type')" width="100"  header-align="center" align="center">
                    <template #default="scope">
                        <el-text>{{notifyEnum(scope.row)}}</el-text>
                    </template>
                </el-table-column>
                <el-table-column prop="userPo.username" :label="$t('notify.creator')" width="200"  header-align="center" align="center"/>
                <el-table-column prop="dimensionPo.name" :label="$t('notify.org')" width="250"  header-align="center" align="center"/>
                <el-table-column prop="configPo.createTime" :label="$t('notify.createTime')" width="200"  header-align="center" align="center"/>
                <el-table-column prop="configPo.updateTime" :label="$t('notify.updateTime')" width="200"  header-align="center" align="center"/>
                <el-table-column>
                    <template #header>
                        <div class="center-flex-contain">
                            <el-dropdown placement="top-start" @command="(command) => addClick(command)">
                                <el-button>
                                    <font-awesome-icon size="1x" :icon="['fasr', 'square-plus']"/>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <!-- <el-dropdown-item command="email">{{ $t('notify.emailType') }}</el-dropdown-item> -->
                                        <el-dropdown-item command="aws-email">{{ $t('notify.awsEmailType') }}</el-dropdown-item>
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
    import { ElMessage, ElMessageBox } from "element-plus";
    import { useI18n } from 'vue-i18n'
    export default defineComponent({
        name: "NotifyPage",
        components:{NotifyEmailConfig,NotifyAwsEmailConfig},
        setup(context){
            const {proxy} = getCurrentInstance()
            const router = useRouter()
            const { t } = useI18n()
            const searchParams = reactive([]);
            const tableData = reactive([])
            const loading = ref(true)
            const nType=toRef(notifyType)
            const pageTotal = ref(0)
            const page=reactive({size:10,current:1,terms:[], sorts: [{ column: "t.create_time", order: "desc" }]})

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

            const resetParam = () => {
                searchParams.length = 0;
                searchParams.push({ column: "t.name", value: "", termType: "like", label: t('notify.nameLabel'), type: "input" });
                console.log("resetParam");
            };

            const pageApi=()=>{
                console.log('notifyPageApi')
                loading.value=true
                page.terms.length = 0;
                for (var item of searchParams) {
                    page.terms.push({ column: item.column, value: item.value, termType: item.termType, type: "and" });
                }
                proxy.$http.notifyPage(page).then(value => {
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
                    message: t('common.operationSuccess'),
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
                    configData.data={name:'',code:'aws-email',config:{type:'aws-email',from:'',host:'',smtpUsername:'',smtpPassword:''}}
                }
                configData.state=true
            }
            const editClick=(row)=>{
                console.log('rowclick-->'+JSON.stringify(row))
                configData.data=row.configPo
                configData.state=true
            }
            const deleteClick=(row,index)=>{
                ElMessageBox.confirm(
                    t('notify.confirmDeleteMsg', { name: row.configPo.name }),
                    t('notify.confirmDeleteTitle'),
                    {
                        confirmButtonText: t('common.confirm'),
                        cancelButtonText: t('common.cancel'),
                        type: 'warning',
                    }
                ).then(() => {
                    proxy.$http.notifyConfigDelete({ id: row.configPo.id }).then(() => {
                        ElMessage({ showClose: true, message: t('common.deleteSuccess'), type: 'success' })
                        reload()
                    })
                }).catch(() => {})
            }
            const queryClick=()=>{
                page.current = 1;
                pageApi();
            }
            const resetClick=()=>{
                page.current = 1;
                resetParam()
                pageApi()
            }
            const handleSelectionChange=(selection)=>{
                console.log(selection)
            }
            const pageChange=(current)=>{
                page.current=current
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
                resetParam()
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
                resetClick,
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
