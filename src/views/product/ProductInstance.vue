<template>
  <div
    v-if="!loading"
    style="width: 100%; height: 100%; padding: 0; margin: 0px"
  >
    <el-tabs
      v-model="activeName"
      class="tab-container"
      @tab-click="handleClick"
    >
      <el-tab-pane label="信息" name="first">
        <TabProductDetail :productData="productData" @submit="updateCopyApi"></TabProductDetail>
      </el-tab-pane>
      <!--<el-tab-pane label="属性" name="second">
          <TabProductMeta :productData="productData"></TabProductMeta>
      </el-tab-pane>-->
      <el-tab-pane label="模型属性" name="second">
        <DeviceMeta
          ref="deviceMetaRef"
          :deviceUnit="deviceUnit"
          :deviceMeta="productData.productPo"
          @updateClick="updateMetaApi"
        ></DeviceMeta>
      </el-tab-pane>
      <el-tab-pane
        label="网关分路"
        v-if="productData.productPo.type == 'gateway'"
      >
        <TabProductTree
          :productData="productData.productPo"
          :loading="treeLoad"
          @submit="submitTree"
        ></TabProductTree>
      </el-tab-pane>
      <el-tab-pane label="告警规则">
        <TabProductRule
          :productData="productData.productPo"
          @open="productRuleOpen"
        ></TabProductRule>
      </el-tab-pane>
    </el-tabs>
  </div>
  <Loading :loading="loading"></Loading>

  <DialogAlarmRule
    :productData="productData.productPo"
    :alarmData="productRuleData"
    :status="dialogProductRuleState"
    @save="productRuleSave"
    @close="productRuleClose"
    @reload="productRuleReload"
  ></DialogAlarmRule>
</template>

<script>
import MenuContainerHeader from "@/components/menuContain/MenuContainerHeader.vue";
import TabProductDetail from "@/views/product/tab/TabProductDetail.vue";
import TabProductMeta from "@/views/product/tab/TabProductMeta.vue";
import ProductFunction from "@/views/product/tab/ProductFunction.vue";
import Loading from "@/components/load/Loading.vue";
import DeviceMeta from "@/views/device/info/DeviceMeta.vue";
import TabProductTree from "@/views/product/tab/TabProductTree.vue";
import TabProductRule from "@/views/product/tab/TabProductRule.vue";
import { useRouter, useRoute } from "vue-router";
import DialogAlarmRule from "@/components/product/DialogAlarmRule.vue";
import {
  computed,
  defineComponent,
  ref,
  watch,
  onMounted,
  getCurrentInstance,
  onBeforeUnmount,
  reactive,
} from "vue";
import { ElMessage } from "element-plus";
import { productSerialize } from "@/util/request";

export default defineComponent({
  name: "ProductInstance",
  components: {
    DeviceMeta,
    MenuContainerHeader,
    TabProductDetail,
    TabProductMeta,
    TabProductTree,
    TabProductRule,
    ProductFunction,
    Loading,
    DialogAlarmRule,
  },
  setup() {
    let productId = null;
    const router = useRouter();
    const route = useRoute();
    const { proxy } = getCurrentInstance();
    const titleLabel = ref("产品详情");
    const activeName = ref("first");
    const productData = ref({});
    const loading = ref(true);

    const deviceMetaRef = ref(null);
    const deviceUnit = reactive([]);
    const productFormRef = ref(null);

    const treeLoad = ref(false);
    const dialogProductRuleState = ref(false);
    const productRuleData = ref(null);
    const productRuleIndex = ref(-1)
    const unitApi = () => {
      proxy.$http.unitApi().then((value) => {
        deviceUnit.length = 0;
        deviceUnit.push(...value.data);
        console.log("unitApi");
      });
    };
    const productRuleOpen = (data,index,meta) => {
      console.log("productRuleOpen");
      productRuleData.value = data;
      productRuleIndex.value=index;
      dialogProductRuleState.value = true;
    };
    
    const productRuleClose = () => {
      dialogProductRuleState.value = false;
    };
    
    const productRuleReload = () => {
      // 重新加载数据
      requestApi();
    };
    // watch(dialogEditVisible, (v) => {
    //   if (v) {
    //     dialogEditData.value = JSON.parse(
    //       JSON.stringify(productData.value.productPo)
    //     );
    //   }
    // });
    const backClick = function () {
      router.go(-1);
    };
    const requestApi = function () {
      loading.value = true;
      treeLoad.value = false;
      productId = route.query.productId;
      console.log("productId--->" + productId);
      let params = { terms: [{ column: "t.id", value: productId }] };
      proxy.$http.productDetail(params).then((value) => {
        console.log(JSON.stringify(value));
        productData.value = value.data;
        setTimeout(() => {
          loading.value = false;
        }, 1000);
      });
    };
    const updateApi = (param) => {
      proxy.$http.productUpdate(param).then(
        () => {
          console.log("updateMetaApi");
          ElMessage({
            message: "操作成功",
            type: "success",
          });
          requestApi();
        },
        () => {
          ElMessage({
            message: "操作失败",
            type: "fail",
          });
          requestApi();
        }
      );
    };
    const updateMetaApi = (metaData) => {
      const param = {id: productId, metadata: metaData, name: productData.value.productPo.name}
      console.log('update product meta')
      updateApi(param)
    }
    const updateCopyApi = (copyData) => {
      const param={id: copyData.id, metadata: copyData.metadata, name: copyData.name,orgId:copyData.orgId,sn:copyData.sn}
      console.log('update product meta')
      updateApi(param)
    }
    const handleClick = (tab, event) => {
      console.log(tab.paneName)
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
    const productRuleSave=(rulePo)=>{
      let param={metadata:productData.value.productPo.metadata,columns:rulePo.columns,rulePo:rulePo.rulePo}
      proxy.$http.productSerialize(param).then(v=>{
        productData.value.productPo.metadata.rules[productRuleIndex.value]=v.data
        console.log("productRuleSave")
      })
    }
    onMounted(() => {
      console.log("sss");
      unitApi();
      requestApi();
    });
    return {
      productFormRef,
      loading,
      deviceUnit,
      deviceMetaRef,
      titleLabel,
      activeName,
      productData,
      treeLoad,
      backClick,
      handleClick,
      updateMetaApi,
      submitTree,
      productRuleOpen,
      productRuleClose,
      productRuleReload,
      productRuleSave,
      productRuleData,
      dialogProductRuleState,
    };
  },
});
</script>

<style scoped>
@import url("style/instance.scss");
</style>
