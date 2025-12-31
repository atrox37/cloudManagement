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
            <el-table height="100%" :data="tableData" v-loading="loading" stripe border @row-click="editClick">
                <el-table-column prop="name" label="协议名称" header-align="center" align="center"/>
                <el-table-column label="支持类型" header-align="center" align="center">
                    <template #default="scope">
                        <el-space wrap>
                            <el-tag type="success" v-for="(item,index) in handlerSupport(scope.row)" :key="index">{{item.name}}</el-tag>
                        </el-space>
                    </template>
                </el-table-column>
                <el-table-column width="250" label="是否关联网关" header-align="center" align="center">
                    <template #default="scope">
                        <el-space wrap>
                            <el-tag v-if="scope.row.gatewayTotal==0" type="warning">否</el-tag>
                            <el-tag v-else type="success">是 </el-tag>
                            <el-tag v-if="scope.row.gatewayTotal>0" type="success">已绑定{{scope.row.gatewayTotal}}个网关</el-tag>
                        </el-space>
                    </template>
                </el-table-column>
                <el-table-column prop="sysDimensionName" label="所属机构" header-align="center"
                                 align="center"/>
                <el-table-column prop="updateTime" label="更新时间" width="250" header-align="center"
                                 align="center"/>
                <el-table-column width="250">
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
                                <el-button @click.native.stop="reloadClick(scope.row,scope.$index,$event)">
                                    <font-awesome-icon :icon="['fas', 'arrows-rotate']"/>
                                </el-button>
                                <el-button @click.native.stop="testClick(scope.row,scope.$index,$event)">
                                    <font-awesome-icon :icon="['fas', 'gears']"/>
                                </el-button>
                                <el-button @click.native.stop="deleteClick(scope.row,scope.$index,$event)" :disabled="scope.row.gatewayTotal!=0">
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
        <ProtocolAdd :status="drawerState" :data="selectData" :uploadStatus="uploadStatus" @save="saveApi"
                     @upload="uploadApi" @close="closeApi"></ProtocolAdd>
        <ProtocolMqttTest ref="mqttTestRef" :data="mqttTest" @test="testApi"></ProtocolMqttTest>
        <ProtocolKafkaTest ref="kafkaTestRef" :data="kafkaTest" @test="testApi"></ProtocolKafkaTest>
    </el-container>


</template>

<script>
    import {defineComponent, reactive, ref, getCurrentInstance, onMounted, computed, toRef} from "vue"
    import {useRouter} from "vue-router";
    import {ElMessage, ElMessageBox} from 'element-plus'
    import handlerDimensionTree from '@/util/dimension/DimensionTree'
    import {protocolType} from "@/model/protocol/ProtocolType";
    import ProtocolAdd from "@/views/protocol/components/ProtocolAdd.vue";
    import ProtocolMqttTest from "@/views/protocol/components/ProtocolMqttTest.vue";
    import ProtocolKafkaTest from '@/views/protocol/components/ProtocolKafkaTest.vue';

    export default defineComponent({
        name: "ProtocolPage",
        components: {ProtocolAdd,ProtocolMqttTest,ProtocolKafkaTest},
        setup() {
            const router = useRouter()
            const {proxy} = getCurrentInstance()
            const type = ref(protocolType)
            const loading = ref(true)
            const searchParams = reactive([])
            const page = reactive({current: 0, size: 10,terms:[]})
            const tableData = reactive([])

            const selectData = ref({support: [], configuration: {}})
            const drawerState = ref(false)
            const uploadStatus = ref({icon: 'Upload', loading: false})

            const mqttTest=ref({drawable: false, mqtt: {}, result: {}})
            const mqttTestRef=ref(null)
            const kafkaTest=ref({drawable: false, kafka: {}, result: {}})
            const kafkaTestRef=ref(null)
            const dimensionTree = ref([])
            const dimensionAllTree=computed(()=>{
                const rootTree={value:-1,label:'全部',children:[]}
                rootTree.children.push(...dimensionTree.value)
                return [rootTree]
            })

            const handlerSupport = (v) => {
                var supports = []
                for (var i of type.value) {
                    for (var j of v.support) {
                        if (i.type == j) {
                            supports.push(i)
                            break
                        }
                    }
                }
                return supports;
            }
            const resetParam = () => {
                searchParams.length = 0
                searchParams.push({column: 't.name', value: '', termType: 'like', label: '名称', type: 'input'})
                searchParams.push({column: 't.org_id', value: -1, termType: 'eq', label: '机构', type: 'tree'})
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
            const requestApi = () => {
                loading.value = true
                page.terms.length=0
                page.terms.push(...searchParams)
                for(var i=page.terms.length-1;i>=0;i--){
                    if(page.terms[i].column=='t.org_id'&&page.terms[i].value<0){
                        page.terms.splice(i,1)
                    }else if(page.terms[i].column=='t.name'&&page.terms[i].value==''){
                        page.terms.splice(i,1)
                    }
                }
                proxy.$http.protocolPage(page).then(value => {
                    console.log('GatewayPage')
                    page.total = value.data.total
                    loading.value = false
                    tableData.length = 0
                    tableData.push(...value.data.records)
                })
            }
            const reloadApi=()=>{
                page.current=1
                requestApi()
            }
            const closeApi = () => {
                selectData.value = {configuration: {}}
                drawerState.value = false
            }
            const saveApi = () => {
                selectData.value.state = 1
                selectData.value.type = 'jar'
                console.log('saveApi->' + JSON.stringify(selectData.value))
                proxy.$http.saveUpdateProtocol(selectData.value).then(data => {
                    closeApi()
                    reloadApi()
                    console.log('success')
                }).catch(error => {
                    closeApi()
                    reloadApi()
                })
            }
            const uploadApi = (param) => {
                console.log('uploadApi')
                uploadStatus.value.icon = 'Loading'
                uploadStatus.value.loading = true
                proxy.$http.protocolFileUpload(param).then(value => {
                    console.log('protocolFileUpload')
                    uploadStatus.value.icon = 'Upload'
                    uploadStatus.value.loading = false
                    if (value.code == 200) {
                        if(selectData.value.support == undefined){
                            selectData.value['support']=[]
                        }else{
                            selectData.value.support.length = 0
                        }
                        selectData.value.configuration.location = value.data.url
                        selectData.value.support.push(...value.data.support)
                    }
                }).catch(error => {
                    console.log('error')
                    uploadStatus.value.icon = 'Upload'
                    uploadStatus.value.loading = false
                })
            }
            const testApi=(param)=>{
                console.log('testProtocol')
                proxy.$http.testProtocol(param).then(value => {
                    console.log('protocolFileUpload')
                    if(param.type=='mqtt'){
                        mqttTest.value.result=value.data
                        mqttTestRef.value.handlerResult()
                    }else if(param.type=='kafka'){
                        kafkaTest.value.result=value.data
                        kafkaTestRef.value.handlerResult()
                    }

                }).catch(error => {
                    console.log('error')
                })
            }
            const deleteApi=(id)=>{
                console.log("deleteApi:"+id)
                loading.value = true
                proxy.$http.deleteProtocol({id:id}).then(value=>{
                    reloadApi()
                },error=>{
                    loading.value = false
                    console.log('deleteApi:error')
                })
            }
            const reloadClick = function (row, column, event) {
                console.log('reloadclick-->' + row.id)
                proxy.$http.reloadProtocol({id: row.id}).then(value => {
                    console.log('reload success')
                    ElMessage({
                        message: value.msg,
                        type: 'success',
                    })
                })
            }
            const testClick = (row) => {
                var s=row.support
                if(s.length==1&&s[0]=='KAFKA'){
                    kafkaTest.value.drawable=true
                    kafkaTest.value.kafka={id:row.id,type:'kafka'}
                    kafkaTest.value.result={}
                }else if(s.length==1&&s[0]=='MQTT_SERVER'||s.length==1&&s[0]=='MQTT_CLIENT'){
                    mqttTest.value.drawable=true
                    mqttTest.value.mqtt={id:row.id,type:'mqtt'}
                    mqttTest.value.result={}
                }

            }
            const deleteClick = function (row, column, event) {
                console.log('deleteClick-->' + row.id)
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
                        console.log('delectClick:'+row.id)
                        deleteApi(row.id)
                    })
                    .catch(() => {
                    })
            }
            const addClick = function () {
                console.log('addclick')
                selectData.value = {configuration: {}}
                drawerState.value = !drawerState.value
            }
            const queryClick = () => {
                console.log('queryClick')
                requestApi()
            }
            const resetClick = () => {
                resetParam()
                reloadApi()
            }
            const editClick = (row) => {
                selectData.value = row
                drawerState.value = !drawerState.value
                console.log('editClick')
            }
            const pageChange = (current) => {
                page.current = current
                requestApi()
            }
            onMounted(() => {
                resetParam()
                dimensionApi()
                requestApi()
            })
            return {
                dimensionAllTree,
                selectData,
                drawerState,
                uploadStatus,
                loading,
                tableData,
                searchParams,
                page,
                mqttTest,
                mqttTestRef,
                kafkaTest,
                kafkaTestRef,
                handlerSupport,
                addClick,
                resetClick,
                queryClick,
                reloadClick,
                testClick,
                deleteClick,
                editClick,
                pageChange,
                saveApi,
                uploadApi,
                closeApi,
                testApi
            }
        }
    })
</script>

<style scoped>
    @import '../../scss/container.scss';
    @import './style/index.scss';
</style>