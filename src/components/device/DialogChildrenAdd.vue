<template>
    <el-dialog v-model="childrenData.status" :title="$t('deviceDialog.addChildDevice')" :show-close="false" class="pdf-preview">
        <el-container>
            <el-main>
                <el-table :data="tableData" v-loading="page.loading" stripe borde @selection-change="handleSelectionChange">
                    <el-table-column type="selection"  width="55" />
                    <el-table-column prop="deviceInstancePo.name" :label="$t('deviceDialog.deviceName')" width="200" header-align="center" align="center"/>
                    <el-table-column prop="deviceInstancePo.sn" :label="$t('deviceDialog.deviceSN')"  header-align="center" align="center"/>
                    <el-table-column prop="productPo.name" :label="$t('device.productName')" width="200" header-align="center" align="center"/>
                    <el-table-column prop="sysUserPo.username" :label="$t('common.creator')" width="80" header-align="center" align="center"/>
                    <el-table-column prop="deviceInstancePo.updateTime" :label="$t('common.updateTime')" width="200" header-align="center" align="center"/>
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
        </el-container>
        <template #footer>
          <el-button :loading="page.submitloading" @click="closeClick">{{ $t('common.close') }}</el-button>
            <el-button type="primary" :loading="page.submitloading" @click="submitClick">{{ $t('common.save') }}</el-button>
        </template>

    </el-dialog>
</template>
<script>
    import {defineComponent, reactive, ref, getCurrentInstance, onMounted,watch,toRef} from "vue"
    import {useRouter} from "vue-router";

    export default defineComponent({
        name: "DialogChildrenAdd",
        props:{
            data:{
                type: Object,
                required: false,
                default: () => ({status:false,treeNode:null,deviceData:{}})
            }
        },
        emits:['submit','close'],
        setup(props, context) {
            const childrenData=toRef(props,'data')
            const {proxy} = getCurrentInstance()
            const tableData=reactive([])
            const page=reactive({current:1,size:10,total:0,loading:false,submitloading:false,terms:[], sorts: [{ column: "t.update_time", order: "desc" }]})
            const addSelect=reactive([])
            const pageApi=()=>{
                page.submitloading=false
                addSelect.length=0
                page.loading=true
                tableData.length=0
                page.terms.length=0
                page.terms.push({column:'t2.type',value:'children'})
                page.terms.push({column:'t.parent_id',termType:'isnull'})
                proxy.$http.devicePage(page).then(value => {
                    console.log('pageApi success')
                    page.loading=false
                    page.total=value.data.total
                    tableData.push(...value.data.records)
                },error=>{
                    console.log('pageApi error')
                    tableData.length=0
                    page.loading=false
                })
            }
            const addSelectApi=()=>{
                if(addSelect.length>0){
                    page.submitloading=true
                    var params=[]
                    for(var index in addSelect){
                        params.push({id:addSelect[index].deviceInstancePo.id,parentId:childrenData.value.deviceData.deviceInstancePo.id,treeNode:childrenData.value.treeNode})
                    }
                    proxy.$http.updateBatchDeviceInstanceApi(params).then(value => {
                        console.log("submit success")
                        page.submitloading=false
                        context.emit('submit')
                    },error=>{
                        page.submitloading=false
                        console.log("submit error")
                    })
                }
            }
            const pageChange = (current) => {
                console.log('pageChange' + current)
                page.current = current
                pageApi()
            }
            const handleSelectionChange=(vs)=>{
                console.log('handleSelectionChange')
                addSelect.length=0
                addSelect.push(...vs)
            }
            const submitClick=()=>{
                addSelectApi()
                //context.emit('submit',addSelect)
            }
            const closeClick=()=>{
              context.emit('close')
            }
            watch(childrenData.status,value => {
                console.log('watch childrenData')
            })
            return {
                page,
                tableData,
                childrenData,
                pageApi,
                pageChange,
                handleSelectionChange,
                submitClick,
                closeClick,
                addSelectApi
            }
        }
    })
</script>
<style scoped lang="scss">
    @use "@/components/device/style/DialogChildrenAdd.scss";
</style>
<style lang="scss">
    .pdf-preview{
        height: 70%;
        .el-dialog__body {
            height: calc(100% - 80px) !important;
        }
    }

</style>