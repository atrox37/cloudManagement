<template>
    <el-container>
        <el-header>
            <div class="search-box">
                <el-form v-model="searchParams" :inline="true">
                    <el-form-item v-for="(item,index) in searchParams" :label="item.label" :key="index">
                        <el-input v-if="item.type == 'input'" v-model="item.value" placeholder="" clearable/>
                        <el-tree-select
                                style="width: 220px;"
                                v-if="item.type == 'tree'"
                                v-model="item.value"
                                :data="dimensionAllTree"
                                check-strictly
                                :render-after-expand="false">
                            <template #empty>
                                <el-empty description="暂无数据"/>
                            </template>
                        </el-tree-select>
                        <el-select v-if="item.type == 'select'" v-model="item.value" style="width:200px">
                            <el-option v-for="(item,index) in item.select" :key="index" :label="item.name"
                                       :value="item.type"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="queryClick">查询</el-button>
                        <el-button type="info" @click="resetClick">重置</el-button>
                    </el-form-item>
                </el-form>
            </div>

        </el-header>
        <el-main>
            <el-table height="100%" :data="tableData" v-loading="loading" stripe @row-click="rowClick"
                      style="width: 100%">
                <el-table-column prop="deviceInstancePo.id" label="ID" width="40" header-align="center" align="center"/>
                <el-table-column prop="deviceInstancePo.name" label="设备名称" min-width="150" header-align="center"
                                 align="center"/>
                <el-table-column prop="deviceInstancePo.name" label="产品名称" min-width="150" header-align="center"
                                 align="center"/>
                <el-table-column label="产品类型" header-align="center" align="center" width="100">
                    <template #default="scope">
                        <el-tag v-if="scope.row.productPo.type == 'gateway'">网关</el-tag>
                        <el-tag v-if="scope.row.productPo.type == 'device'">直连设备</el-tag>
                        <el-tag v-if="scope.row.productPo.type == 'children'">子设备</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="gatewayPo.name" label="关联网关" width="200" header-align="center" align="center"/>
                <el-table-column prop="sysDimensionPo.name" label="所属机构" min-width="100" header-align="center"
                                 align="center"/>
                <el-table-column prop="sysUserPo.username" label="创建人" width="150" header-align="center"
                                 align="center"/>
                <el-table-column prop="deviceInstancePo.createTime" label="创建时间" width="180" header-align="center"
                                 align="center"/>
                <el-table-column label="状态" header-align="center" align="center" width="100">
                    <template #default="scope">
                        <el-tag style="margin-left: 5px"
                                :type="scope.row.deviceInstancePo.status=='offline'?'info':'success'">
                            {{scope.row.deviceInstancePo.status=='offline'?'离线':'在线'}}
                        </el-tag>
                    </template>
                </el-table-column>
                <!--<el-table-column label="操作" header-align="center" align="center">

                </el-table-column>-->
                <el-table-column>
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
                                <el-button @click.native.stop="deleteClick(scope.row,scope.$index)">
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
                        :total="pageInfo.total">
                </el-pagination>
            </div>
        </el-footer>
    </el-container>
    <DialogCreateDevice :data="deviceCreateData" @createClick="createDeviceClick"></DialogCreateDevice>
    <DialogDeleteDevice :data="deviceDeleteData" @submit="deviceDeleteSubmit" @cancel="deviceDeleteCancel"></DialogDeleteDevice>

</template>

<script>
    import {useRouter} from 'vue-router';
    import handlerDimensionTree from '@/util/dimension/DimensionTree'
    import DialogCreateDevice from '@/components/device/DialogCreateDevice.vue';
    import DialogDeleteDevice from "@/components/device/DialogDeleteDevice.vue";
    import {productType} from '@/model/product/ProductType'
    import {onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed} from "vue"
    import {deleteDeviceInstanceApi} from "@/util/request";
    import {ElMessage} from "element-plus";

    export default defineComponent({
        name: "DevicePage",
        components: {DialogCreateDevice,DialogDeleteDevice},
        setup() {
            const router = useRouter()
            const {proxy} = getCurrentInstance()
            let pageInfo = reactive({size: 10, current: 1, total: 0, terms: []})
            const loading = ref(true)
            const searchParams = reactive([])
            const selectData = ref(null)
            const deviceCreateData=reactive({status:false,loading:false,device:{name:''}})
            const deviceDeleteData=reactive({status:false,loading:false,device:{}})
            const dimensionTree = ref([])
            const dimensionAllTree = computed(() => {
                const rootTree = {value: -1, label: '全部', children: []}
                rootTree.children.push(...dimensionTree.value)
                return [rootTree]
            })
            const selectList = reactive({
                data: [
                    {
                        name: 'zhangsa',
                        value: 1
                    },
                    {
                        name: '221212',
                        value: 2
                    }]
            })

            const tableData = reactive([])
            watch(selectData, (newData, oldData) => {
                console.log(inputData.value + '<-->' + JSON.stringify(newData));
            })

            const resetParam = () => {
                const p = toRef(productType)
                searchParams.length = 0
                searchParams.push({column: 't.name', value: '', termType: 'like', label: '设备名称', type: 'input'})
                searchParams.push({column: 't.org_id', value: -1, termType: 'eq', label: '机构', type: 'tree'})
                searchParams.push({
                    column: 't2.type',
                    value: '',
                    termType: 'eq',
                    label: '产品类型',
                    type: 'select',
                    select: p.value
                })
                console.log('resetParam')
            }



            const createDeviceClick=()=>{
                deviceCreateData.loading=true
                console.log('createDeviceClick')
                proxy.$http.updateDeviceInstanceApi(deviceCreateData.device).then(value => {
                    resetClick()
                },error=>{
                    deviceCreateData.loading=false
                    deviceCreateData.status=false
                })
            }

            const queryClick = () => {
                pageInfo.current = 1
                devicePageApi()
            }
            const resetClick = () => {
                deviceCreateData.loading=false
                deviceCreateData.status=false
                pageInfo.current = 1
                deviceDeleteData.loading=false
                deviceDeleteData.status=false
                resetParam()
                devicePageApi()
            }
            const nameInputChange = (event) => {
                console.log(event)
            }
            const requestDimensionApi = () => {
                proxy.$http.dimensionTree().then(value => {
                    var tree = {}
                    dimensionTree.value.length = 0
                    handlerDimensionTree(value.data, tree)
                    dimensionTree.value.push(tree)
                    console.log('requestDimensionApi')
                })
            }
            const devicePageApi = () => {
                pageInfo.terms.length = 0
                for (var item of searchParams) {
                    if (item.column == 't.org_id' && item.value >= 0) {
                        pageInfo.terms.push(item)
                    } else if (item.column != 't.org_id' && item.value != undefined && item.value != '') {
                        pageInfo.terms.push(item)
                    }
                }
                console.log('devicePageApi')
                loading.value = true
                proxy.$http.devicePage(pageInfo).then(value => {
                    loading.value = false
                    tableData.length = 0
                    pageInfo.total = value.data.total
                    tableData.push(...value.data.records)
                    console.log('page data->' + value.data.records)
                })
            }
            const pageChange = (current) => {
                console.log('pageChange' + current)
                pageInfo.current = current
                devicePageApi()
            }
            const rowClick = (row, column, event) => {
                console.log('click->' + row.deviceInstancePo.id)
                //router.push('/test')
                router.push({
                    path: '/deviceInstance',
                    query: {
                        deviceId: row.deviceInstancePo.id
                    }
                })
            }

            const deviceDeleteSubmit=(data)=>{
              console.log('deviceDeleteSubmit')
              deviceDeleteData.loading=true
              proxy.$http.deleteDeviceInstanceApi({id:data.id}).then(result=>{
                resetClick()
                ElMessage({
                  showClose: true,
                  message: '操作成功',
                  type: 'success',
                })
              },error => {
                resetClick()
              })
            }

            const deviceDeleteCancel=()=>{
              deviceDeleteData.status=false
            }

            const addClick = () => {
                console.log('addClick')
                deviceCreateData.status=true
            }
            const deleteClick = (row, index) => {
                deviceDeleteData.status=true
                deviceDeleteData.device=row.deviceInstancePo
                console.log('deleteClick')
            }

            onMounted(() => {
                resetParam()
                requestDimensionApi()
                devicePageApi()
            })

            return {
                deviceCreateData,
                deviceDeleteData,
                pageInfo,
                dimensionAllTree,
                resetClick,
                loading,
                tableData,
                selectList,
                selectData,
                searchParams,
                createDeviceClick,
                addClick,
                deleteClick,
                queryClick,
                rowClick,
                nameInputChange,
                pageChange,
                deviceDeleteSubmit,
                deviceDeleteCancel
            }
        }
    })
</script>
<style scoped lang="sass">
    @use '@/scss/container.scss'
</style>
<style scoped>
    .online-style {
        color: green;
    }

    .offline-style {
        color: red;
    }

</style>
