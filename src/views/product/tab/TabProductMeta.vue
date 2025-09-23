<template>
    <el-tabs type="border-card" style="overflow: hidden;height: 100%">
        <el-tab-pane label="属性">
            <el-table :data="metadata.properties" stripe @selection-change="deletePropertyListener">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="id" label="Id" width="180" />
                <el-table-column prop="name" label="名称" width="180" />
                <el-table-column prop="valueType.type" label="类型" width="180" />
                <el-table-column prop="valueType.unit" label="单位" width="180" />
                <el-table-column>
                    <template #header>
                        <div class="right-flex-contain">
                            <el-button-group>
                                <el-button @click="addPropertyClick"><font-awesome-icon :icon="['fasr', 'square-plus']" /></el-button>
                                <el-button @click="deletePropertyBatchClick"><font-awesome-icon :icon="['fasr', 'trash']" /></el-button>
                            </el-button-group>
                        </div>
                    </template>
                    <template #default="scope">
                        <div class="right-flex-contain">
                            <el-button-group>
                                <el-button @click="editPropertyClick(scope.row,scope.$index,$event)"><font-awesome-icon :icon="['fas', 'pen-to-square']" /></el-button>
                                <el-button @click="deletePropertyClick(scope.row,scope.$index)"><font-awesome-icon :icon="['fasr', 'trash']" /></el-button>
                            </el-button-group>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-tab-pane>
        <el-tab-pane label="功能">
            <el-table :data="metadata.functions">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="id" label="id" width="180" />
                <el-table-column prop="name" label="名称" width="180" />
                <el-table-column prop="async" label="是否异步" width="180" />
                <el-table-column>
                    <template #header>
                        <div class="right-flex-contain">
                            <el-button-group>
                                <el-button @click="addFunctionClick"><font-awesome-icon :icon="['fasr', 'square-plus']" /></el-button>
                                <el-button @click="deleteFunctionBatchCLick"><font-awesome-icon :icon="['fasr', 'trash']" /></el-button>
                            </el-button-group>
                        </div>
                    </template>
                    <template #default="scope">
                        <div class="right-flex-contain">
                            <el-button-group>
                                <el-button @click="editFunctionClick(scope.row,scope.$index,$event)"><font-awesome-icon :icon="['fas', 'pen-to-square']" /></el-button>
                                <el-button @click="deleteFunctionClick(scope.row,scope.$index)"><font-awesome-icon :icon="['fasr', 'trash']" /></el-button>
                            </el-button-group>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-tab-pane>
    </el-tabs>

    <MetaProperty :selectData="selectPropertyData"
                  :drawerData="enableDraw"
                  :selectIndex="selectIndex"
                  @close="closePropertyDraw"
                  @submit="submitPropertyClick"></MetaProperty>

</template>

<script>
    import {defineComponent, ref, onMounted, getCurrentInstance, toRef} from "vue"
    import MetaProperty from '@/components/device/MetaProperty.vue'
    export default defineComponent({
        name: "TabProductMeta",
        props: {
            productData: {
                type: Object,
                required: false
            }
        },
        components: {MetaProperty},
        setup(props,context){
            const enableDraw=ref(false)
            const data = toRef(props,'productData')
            const metadata=ref({})
            const copyMetaData=ref({})
            const selectPropertyData=ref({valueType:{}})
            const selectIndex=ref(-1)
            const deleteMeta=ref([])
            console.log(JSON.stringify(data))
            metadata.value=JSON.parse(data.value.data.metadata)

            const deletePropertyListener=(datas)=>{
                deleteMeta.value=datas
                console.log('deletePropertyListener')
            }
            const editPropertyClick=(row,index,target)=>{
                selectPropertyData.value=JSON.parse(JSON.stringify(row))
                selectIndex.value=index
                enableDraw.value=true
                console.log('editPropertyClick')
            }
            const deletePropertyClick=(row,index)=>{
                deleteMeta.value.length=0
                deleteMeta.value[0]=row
                handlerDeletePropertyData()
            }
            const closePropertyDraw=()=>{
                enableDraw.value=false
                resetSelectData()
                console.log('关闭侧边栏')
            }
            const submitPropertyClick=()=>{
                enableDraw.value=false
                copyMeta()
                if(selectIndex.value<0){
                    copyMetaData.value.properties.push(selectPropertyData.value)
                }else{
                    copyMetaData.value.properties[selectIndex.value]=selectPropertyData.value
                }
                updateProductApi()
            }
            const resetSelectData=()=>{
                deleteMeta.value.length=0
                selectIndex.value=-1
                selectPropertyData.value={valueType:{}}
            }


            const editFunctionClick=(row,index,target)=>{
                console.log('editFunctionClick')
            }
            const deleteFunctionClick=(row,index)=>{
                console.log('deleteFunctionClick')
            }


            //Header
            const addPropertyClick=function(evt){
                console.log('header property add')
                resetSelectData()
                enableDraw.value=true
            }
            const deletePropertyBatchClick=()=>{
                console.log('header property delete')
                handlerDeletePropertyData()
            }

            const handlerDeletePropertyData=()=>{
                copyMeta()
                for(let i=copyMetaData.value.properties.length-1;i>=0;i--){
                    for(let index in deleteMeta.value){
                        if(deleteMeta.value[index].id == copyMetaData.value.properties[i].id){
                            copyMetaData.value.properties.splice(i,1)
                            break
                        }
                    }
                }
                updateProductApi()
            }

            const addFunctionClick=()=>{
                console.log('header function add')
            }
            const deleteFunctionBatchCLick=()=>{
                console.log('header function delete')
            }

            const copyMeta=function(){
                copyMetaData.value=JSON.parse(data.value.data.metadata)
            }

            const updateProductApi=()=>{
                console.log(JSON.stringify(copyMetaData.value))
            }
            return {
                metadata,
                enableDraw,
                selectPropertyData,
                selectIndex,
                deletePropertyListener,
                editPropertyClick,
                deletePropertyClick,
                addPropertyClick,
                deletePropertyBatchClick,
                closePropertyDraw,
                submitPropertyClick,
                editFunctionClick,
                deleteFunctionClick,
                addFunctionClick,
                deleteFunctionBatchCLick,
            }
        }
    })
</script>

<style scoped>
    @import url('style/index.scss');
</style>