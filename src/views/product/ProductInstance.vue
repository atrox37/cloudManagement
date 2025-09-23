<template>
  <div v-if="!loading" style="width: 100%;height:100%;padding: 0;margin: 0px">
    <el-tabs v-model="activeName" class="tab-container" @tab-click="handleClick">
      <el-tab-pane label="信息" name="first">
        <TabProductDetail :productData="productData" @dialogClick="editDialog"></TabProductDetail>
      </el-tab-pane>
      <!--<el-tab-pane label="属性" name="second">
          <TabProductMeta :productData="productData"></TabProductMeta>
      </el-tab-pane>-->
      <el-tab-pane label="模型属性" name="second">
        <DeviceMeta ref="deviceMetaRef" :deviceUnit="deviceUnit" :deviceMeta="productData.productPo"
                    @updateClick="updateMetaApi"></DeviceMeta>
      </el-tab-pane>
      <el-tab-pane label="网关分路" v-if="productData.productPo.type=='gateway'">
        <TabProductTree :productData="productData.productPo" :loading="treeLoad" @submit="submitTree"></TabProductTree>
      </el-tab-pane>
      <el-tab-pane label="告警规则">
        <TabProductRule :productData="productData.productPo"></TabProductRule>
      </el-tab-pane>
    </el-tabs>
  </div>
  <Loading :loading="loading"></Loading>
  <el-dialog v-model="dialogEditVisible" title="编辑" :show-close="false" width="30%">
    <el-form ref="productFormRef" :model="dialogEditData" :rules="rules">
      <el-form-item label="产品名称" prop="name">
        <el-input v-model="dialogEditData.name"/>
      </el-form-item>
      <el-form-item>
        <div class="right-flex-contain">
          <el-button @click="editSubmit" type="primary">保存</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>

</template>

<script>
import MenuContainerHeader from '@/components/menuContain/MenuContainerHeader.vue';
import TabProductDetail from '@/views/product/tab/TabProductDetail.vue';
import TabProductMeta from '@/views/product/tab/TabProductMeta.vue';
import ProductFunction from '@/views/product/tab/ProductFunction.vue';
import Loading from '@/components/load/Loading.vue';
import DeviceMeta from '@/views/device/info/DeviceMeta.vue'
import TabProductTree from "@/views/product/tab/TabProductTree.vue";
import TabProductRule from '@/views/product/tab/TabProductRule.vue';
import {useRouter, useRoute} from 'vue-router';
import {
  computed,
  defineComponent,
  ref,
  watch,
  onMounted,
  getCurrentInstance,
  onBeforeUnmount,
  reactive
} from "vue"
import {ElMessage} from "element-plus";

export default defineComponent({
  name: "ProductInstance",
  components: {DeviceMeta, MenuContainerHeader, TabProductDetail, TabProductMeta,TabProductTree,TabProductRule, ProductFunction, Loading},
  setup() {
    let productId = null
    const router = useRouter()
    const route = useRoute()
    const {proxy} = getCurrentInstance()
    const titleLabel = ref("产品详情")
    const activeName = ref("first")
    const productData = ref({})
    const loading = ref(true)
    const dialogEditVisible = ref(false)
    const dialogEditData = ref({})

    const deviceMetaRef = ref(null)
    const deviceUnit = reactive([])
    const productFormRef = ref(null)

    const treeLoad=ref(false)

    const unitApi = () => {
      proxy.$http.unitApi().then(value => {
        deviceUnit.length = 0
        deviceUnit.push(...value.data)
        console.log('unitApi')
      })
    }
    watch(dialogEditVisible, v => {
      if (v) {
        dialogEditData.value = JSON.parse(JSON.stringify(productData.value.productPo))
      }
    })
    const backClick = function () {
      router.go(-1)
    }
    const requestApi = function () {
      loading.value = true
      treeLoad.value=false
      productId = route.query.productId
      console.log('productId--->' + productId)
      let params = {terms: [{column: 't.id', value: productId}]}
      proxy.$http.productDetail(params).then(value => {
        console.log(JSON.stringify(value))
        productData.value = value.data
        setTimeout(() => {
          loading.value = false
        }, 1000)
      })
    }
    const updateApi = (param) => {
      proxy.$http.productUpdate(param).then(value => {
        console.log("updateMetaApi")
        ElMessage({
          message: '操作成功',
          type: 'success',
        })
        requestApi()
      },error => {
        ElMessage({
          message: '操作失败',
          type: 'fail',
        })
        requestApi()
      })
    }
    const updateMetaApi = (metaData) => {
      const param = {id: productId, metadata: metaData, name: productData.value.productPo.name}
      console.log('update product meta')
      updateApi(param)
    }
    const updateConfig = () => {
      const param = {id: productId, name: dialogEditData.value.name}
      updateApi(param)
    }
    const editDialog = () => {
      dialogEditVisible.value = true
    }
    const handleClick = (tab, event) => {
      console.log(tab.paneName)
    }
    const validateSelect = (rule, value, callback) => {
      if (rule.field == 'name') {
        console.log('rule')
        if (dialogEditData.value.name == undefined || dialogEditData.value.name == '') {
          callback(('产品不能为空'))
        } else {
          callback()
        }
      }

    }
    const rules = ref({
      name: [{validator: validateSelect, trigger: 'blur'}]
    })
    const editSubmit = () => {
      productFormRef.value.validate((valid) => {
        if (valid) {
          console.log('submit!:')
          dialogEditVisible.value = false
          updateConfig()
        } else {
          console.log('error submit!')
        }
      })
    }
    const submitTree = (trees)=>{
      var meta=JSON.parse(JSON.stringify(productData.value.productPo.metadata))
      meta.trees.length=0
      meta.trees.push(...trees)
      let param={id:productId,metadata:meta}
      treeLoad.value=true
      console.log('submitTree')
      updateApi(param)
    }
    onMounted(() => {
      console.log('sss')
      unitApi()
      requestApi()
    })
    return {
      dialogEditData,
      rules,
      productFormRef,
      dialogEditVisible,
      loading,
      deviceUnit,
      deviceMetaRef,
      titleLabel,
      activeName,
      productData,
      treeLoad,
      editSubmit,
      backClick,
      handleClick,
      updateMetaApi,
      editDialog,
      submitTree
    }
  }
})
</script>

<style scoped>
@import url('style/instance.scss');
</style>
