<template>
  <div
    v-if="!loading"
    style="width: 100%; height: 100%; padding: 0; margin: 0px"
  >
    <el-tabs
      v-model="activeName"
      class="tab-container"
      @tab-click="handleClick"
      addable
    >
      <el-tab-pane :label="$t('productInstance.tabInfo')" name="first">
        <TabProductDetail :productData="productData" :editData="editData" @edgeAsyn="edgeAsynApi"></TabProductDetail>
      </el-tab-pane>
      <el-tab-pane :label="$t('productInstance.tabModelProps')" name="second">
        <DeviceMeta
          ref="deviceMetaRef"
          :deviceUnit="deviceUnit"
          :deviceMeta="editData"
        ></DeviceMeta>
      </el-tab-pane>
      <el-tab-pane
        :label="$t('productInstance.tabGatewayRoute')"
        v-if="editData.type == 'gateway'"
        name="third"
      >
        <TabProductTree
          :productData="editData"
        ></TabProductTree>
      </el-tab-pane>
      <el-tab-pane :label="$t('productInstance.tabAlarmRules')" name="fourth">
        <TabProductRule
          :productData="editData"
          @open="productRuleOpen"
        ></TabProductRule>
      </el-tab-pane>
      <template #add-icon>
        <el-space wrap>
          <el-button type="warning" plain size="small" :loading="syncing" @click.stop="edgeAsynApi">{{ $t('productDetail.edgeSync') }}</el-button>
          <el-button type="primary" size="small" :loading="saving" @click.stop="saveClick">{{ $t('common.save') }}</el-button>
        </el-space>
      </template>
    </el-tabs>
  </div>
  <Loading :loading="loading"></Loading>

  <DialogAlarmRule
    :productData="editData"
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
import Loading from "@/components/load/Loading.vue";
import DeviceMeta from "@/views/device/info/DeviceMeta.vue";
import TabProductTree from "@/views/product/tab/TabProductTree.vue";
import TabProductRule from "@/views/product/tab/TabProductRule.vue";
import { useRouter, useRoute } from "vue-router";
import DialogAlarmRule from "@/components/product/DialogAlarmRule.vue";
import {
  defineComponent,
  ref,
  onMounted,
  getCurrentInstance,
  reactive,
} from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "ProductInstance",
  components: {
    DeviceMeta,
    MenuContainerHeader,
    TabProductDetail,
    TabProductTree,
    TabProductRule,
    Loading,
    DialogAlarmRule,
  },
  setup() {
    const { t } = useI18n();
    let productId = null;
    const router = useRouter();
    const route = useRoute();
    const { proxy } = getCurrentInstance();
    const titleLabel = ref("");
    const activeName = ref("first");
    const productData = ref({});
    const editData = ref({});
    const loading = ref(true);
    const saving = ref(false);
    const syncing = ref(false);

    const deviceMetaRef = ref(null);
    const deviceUnit = reactive([]);

    const dialogProductRuleState = ref(false);
    const productRuleData = ref(null);
    const productRuleIndex = ref(-1);

    const unitApi = () => {
      proxy.$http.unitApi().then((value) => {
        deviceUnit.length = 0;
        deviceUnit.push(...value.data);
      });
    };
    const productRuleOpen = (data, index, meta) => {
      productRuleData.value = data;
      productRuleIndex.value = index;
      dialogProductRuleState.value = true;
    };
    const productRuleClose = () => {
      dialogProductRuleState.value = false;
    };
    const productRuleReload = () => {
      requestApi();
    };
    const backClick = function () {
      router.go(-1);
    };
    const requestApi = function () {
      loading.value = true;
      saving.value = false;
      productId = parseInt(route.query.productId);
      let params = { terms: [{ column: "t.id", value: productId }] };
      proxy.$http.productDetail(params).then((value) => {
        productData.value = value.data;
        editData.value = value.data.productPo;
        setTimeout(() => {
          loading.value = false;
        }, 1000);
      });
    };
    const saveClick = () => {
      saving.value = true;
      const param = {
        id: productId,
        name: editData.value.name,
        sn: editData.value.sn,
        type: editData.value.type,
        orgId: editData.value.orgId,
        metadata: editData.value.metadata
      };
      proxy.$http.productUpdate(param).then(
        () => {
          ElMessage({ message: t('common.operationSuccess'), type: "success" });
          requestApi();
        },
        () => {
          ElMessage({ message: t('common.operationFail'), type: "error" });
          saving.value = false;
        }
      );
    };
    const edgeAsynApi = () => {
      syncing.value = true;
      proxy.$http.edgeProductSync({ id: editData.value.id }).then(v => {
        syncing.value = false;
        ElMessage({
          message: v.data.change == 0 ? t('productInstance.syncNoUpdate') : t('productInstance.syncUpdated'),
          type: "success",
        });
        if (v.data.change != 0) {
          requestApi();
        }
      }, () => {
        syncing.value = false;
      });
    };
    const handleClick = (tab, event) => {
      console.log(tab.paneName);
    };
    const productRuleSave = (rulePo) => {
      let param = { metadata: editData.value.metadata, columns: rulePo.columns, rulePo: rulePo.rulePo };
      proxy.$http.productSerialize(param).then(v => {
        editData.value.metadata.rules[productRuleIndex.value] = v.data;
        dialogProductRuleState.value = false;
      });
    };
    onMounted(() => {
      unitApi();
      requestApi();
    });
    return {
      loading,
      saving,
      syncing,
      deviceUnit,
      deviceMetaRef,
      titleLabel,
      activeName,
      productData,
      editData,
      backClick,
      handleClick,
      saveClick,
      edgeAsynApi,
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

:deep(.el-tabs__new-tab) {
  width: auto;
  height: auto;
  line-height: normal;
  border: none;
  background: transparent;
  margin-top: 0;
  display: flex;
  align-items: center;
}

:deep(.el-tabs__header) {
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--el-border-color-light);
  margin-bottom: 0;
}

:deep(.el-tabs__nav-wrap) {
  flex: 1;
  margin-bottom: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}
</style>
