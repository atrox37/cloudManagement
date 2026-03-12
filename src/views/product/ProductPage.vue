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
                        <el-select v-if="item.type == 'select'" v-model="item.value" style="width:200px">
                            <el-option v-for="(item,index) in item.select" :key="index" :label="item.name" :value="item.type"></el-option>
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
            <el-table :data="tableData" v-loading="loading" stripe @row-click="editClick" border highlight-current-row>
                <!-- <el-table-column prop="productPo.id" label="ID" width="60" header-align="center" align="center" /> -->
                <el-table-column prop="productPo.name" label="名称"  header-align="center" align="center" width="200"/>
                <el-table-column label="产品类型"  header-align="center" align="center" width="180">
                    <template #default="scope">
                        <el-tag v-if="scope.row.productPo.type == 'gateway'">网关</el-tag>
                        <el-tag v-if="scope.row.productPo.type == 'device'">直连设备</el-tag>
                        <el-tag v-if="scope.row.productPo.type == 'children'">子设备</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="sysUserPo.username" label="创建人" width="250" header-align="center" align="center"/>
                <el-table-column prop="sysDimensionPo.name" label="机构" width="150" header-align="center" align="center"/>
                <el-table-column prop="productPo.updateTime" label="更新时间" width="250" header-align="center" align="center"/>
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
                                <el-button @click.native.stop="deleteClick(scope.row,scope.$index)"><font-awesome-icon :icon="['fasr', 'trash']" /></el-button>
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
    <DialogProductOrg ref="dialogProductOrgRef" @close="shareClose" @save="shareSave" :data="shareDialog"></DialogProductOrg>
    <DialogCreateProduct :data="dialogCreateProduct" @createClick="creatProduct"></DialogCreateProduct>
</template>

<script>
    import {defineComponent, reactive, ref,toRef, getCurrentInstance, onMounted, computed} from "vue"
    import { ElMessage, ElMessageBox } from 'element-plus'
    import handlerDimensionTree from '@/util/dimension/DimensionTree'
    import {productType} from '@/model/product/ProductType'
    import DialogProductOrg from '@/components/product/DialogProductOrg.vue'
    import DialogCreateProduct from '@/components/product/DialogCreateProduct.vue'
    import {useRouter} from "vue-router";
    import {deleteProductOrgIds, productOrgPage, saveBatchProductOrg} from "@/util/request";
    export default defineComponent({
        name: "ProductPage",
        components: {DialogProductOrg,DialogCreateProduct},
        setup(){
            const {proxy} = getCurrentInstance()
            const router = useRouter()
            const searchParams=reactive([])
            const tableData = reactive([])
            const loading = ref(true)
            const pageTotal = ref(0)
            const page=ref({size:10,current:1,terms:[], sorts: [{ column: "t.update_time", order: "desc" }]})
          let selectProductId=undefined
            const dialogCreateProduct=ref({})
          const dialogProductOrgRef=ref(null)
            const dimensionTree = ref([])
            const dimensionAllTree=computed(()=>{
                const rootTree={value:-1,label:'全部',children:[]}
                rootTree.children.push(...dimensionTree.value)
                return [rootTree]
            })
            const queryClick=()=>{
                console.log('queryClick')
                page.value.current=1
                productPageApi()
            }
            const resetClick=()=>{
                page.value.current=1
                resetParam()
                productPageApi()
            }

            const shareDialog=reactive({status:false,loading:false,tree:[],data:[]})

            const resetParam=()=>{
                const p=toRef(productType)
                searchParams.length=0
                searchParams.push({column:'t.name',value:'',termType:'like',label:'产品名称',type:'input'})
                searchParams.push({column:'t.org_id',value:-1,termType:'eq',label:'机构',type:'tree'})
                searchParams.push({column:'t.type',value:'',termType:'eq',label:'产品类型',type:'select',select:p.value})
                console.log('resetParam')
            }
            const productPageApi=()=>{
                page.value.terms.length=0
                for(var item of searchParams){
                    if(item.column=='t.org_id'&&item.value>=0){
                        page.value.terms.push(item)
                    }else if(item.column!='t.org_id'&&item.value!=undefined&&item.value!=''){
                        page.value.terms.push(item)
                    }
                }
                console.log('productPageApi')

                loading.value=true
                proxy.$http.productPage(page.value).then(value => {
                    pageTotal.value=value.data.total
                    loading.value=false
                    tableData.length=0
                    tableData.push(...value.data.records)
                })
            }
            const requestDimensionApi=()=>{
                proxy.$http.dimensionTree().then(value=>{
                    var tree={}
                  shareDialog.tree.length=0
                    dimensionTree.value.length=0
                    handlerDimensionTree(value.data,tree)
                    dimensionTree.value.push(tree)
                  if(tree.children!=undefined&&tree.children.length>0){
                    shareDialog.tree.push(...tree.children)
                  }
                    console.log('requestDimensionApi')
                })
            }
            const deleteProductApi=(row)=>{
                proxy.$http.productDelete({id:row.productPo.id}).then(value => {
                    reloadApi()
                    ElMessage({
                        type: 'success',
                        message: '删除成功',
                    })
                })
            }

            const productShareOrg=(id)=>{
              shareDialog.loading=true
              shareDialog.status=true
              const param={current:0,size:-1,terms:[{column:'t.product_id',value:id}]}
                proxy.$http.productOrgPage(param).then(value=>{
                  shareDialog.data.length=0
                  shareDialog.loading=false
                  shareDialog.data.push(...value.data.records)
                  console.log('productShareOrg')
                  dialogProductOrgRef.value.initChecked()
                })
            }
            const shareClick=(row,index)=>{
                console.log("shareclick:"+row.productPo.id)
              selectProductId=row.productPo.id
                productShareOrg(row.productPo.id)
            }
            const editClick=(row)=>{
                console.log('rowclick-->'+JSON.stringify(row))
                router.push({
                    path: '/productInstance',
                    query: {
                        productId: row.productPo.id
                    }
                })
            }
            const deleteClick=(row,index)=>{
                console.log('deleteClick')
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
                        deleteProductApi(row)
                    })
                    .catch(() => {
                    })
            }
            const addClick=()=>{
                console.log('addClick')
                dialogCreateProduct.value={status:true,loading:false,product:{name:'',sn:'',type:'device',metadata:{properties:[],functions:[],propertyTags:[],trees:[],rules:[],tags:[]}}}
            }
            const creatProduct=()=>{
                dialogCreateProduct.value.loading=true
                proxy.$http.productUpdate(dialogCreateProduct.value.product).then(value=>{
                    console.log('creatProduct success')
                    reloadApi()
                },error=>{
                    console.log('creatProduct error')
                    reloadApi()
                })
            }
            const deleteProductOrgIds=(delIds,addIds,successFunc,failFunc)=>{
              if(delIds.length>0){
                proxy.$http.deleteProductOrgIds(delIds).then(v=>{
                  console.log('deleteProductOrg success')
                  saveProductOrgIds(addIds,successFunc,failFunc)
                },e=>{
                  console.log('deleteProductOrg fail')
                  failFunc()
                })
              }else{
                saveProductOrgIds(addIds,successFunc,failFunc)
              }

            }

            const saveProductOrgIds=(datas,successFunc,failFunc)=>{
              if(datas.length>0){
                proxy.$http.saveBatchProductOrg(datas).then(v=>{
                  successFunc()
                },e=>{
                  failFunc()
                })
              }else{
                successFunc()
              }

            }

            const reloadApi=()=>{
                dialogCreateProduct.value.loading=false
                dialogCreateProduct.value.status=false
                page.value.current=1
                productPageApi()
            }
            const pageChange=(current)=>{
                page.value.current=current
                console.log('pageChange'+current)
                productPageApi()
            }
            const shareClose=()=>{
                shareDialog.status=false
            }
            const shareSave=(addData,delData)=>{
              //shareDialog.loading=true
              var batchInsert=[]
              for(var item of addData){
                batchInsert.push({productId:selectProductId,orgId:item})
              }
              console.log('shareSave:'+JSON.stringify(addData)+JSON.stringify(delData))
              shareDialog.loading=true
              deleteProductOrgIds(delData,batchInsert,()=>{
                shareDialog.loading=false
                shareDialog.status=false
              },()=>{
                ElMessage.info('未更新')
                shareDialog.loading=false
              })

            }
            onMounted(()=>{
                resetParam()
                productPageApi()
                requestDimensionApi()
            })
            return {
              dialogProductOrgRef,
                dimensionTree,
                dimensionAllTree,
                dialogCreateProduct,
                shareDialog,
                loading,
                page,
                pageTotal,
                searchParams,
                tableData,
                creatProduct,
                shareClose,
                shareClick,
                pageChange,
                queryClick,
                resetClick,
                editClick,
                deleteClick,
                addClick,
              shareSave
            }
        }
    })
</script>

<style scoped lang="sass">
@use '@/scss/container.scss'
</style>

