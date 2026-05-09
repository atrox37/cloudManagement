<template>
  <div class="tab-pan-content">
    <el-descriptions :column="3" border>
      <template #title>
        <span>{{ data.deviceInstancePo.name }}</span>
      </template>
      <template #extra>
      </template>
      <el-descriptions-item :label="$t('deviceInfo.deviceName')">
        <el-input v-model="data.deviceInstancePo.name" />
      </el-descriptions-item>
      <el-descriptions-item :label="$t('deviceInfo.deviceSN')">
        <el-input v-model="data.deviceInstancePo.sn" />
      </el-descriptions-item>
      <el-descriptions-item :label="$t('deviceInfo.org')">
        <el-tree-select
          v-model="data.deviceInstancePo.orgId"
          style="width: 220px;"
          :data="dimensionAllTree"
          check-strictly
          :render-after-expand="false"
        >
          <template #empty>
            <el-empty :description="$t('common.noData')" />
          </template>
        </el-tree-select>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('deviceInfo.productName')">
        <el-link type="primary" @click="goProduct">{{ data.productPo.name }}</el-link>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('deviceInfo.productType')">
        <el-tag>{{ type }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('deviceInfo.owner')">
        {{ data.sysUserPo.username }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="data.productPo.type === 'children'"
        :label="$t('deviceInfo.gatewayDevice')"
      >
        {{ parentName }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="data.productPo.type === 'children'"
        :label="$t('deviceInfo.collectGateway')"
      >
        {{ data.gatewayPo?.name ?? '' }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="data.productPo.type !== 'children'"
        :label="$t('deviceInfo.collectGateway')"
      >
        <el-select
          v-model="selectedGatewayId"
          :placeholder="$t('deviceInfo.selectGateway')"
          style="width: 220px;"
          clearable
        >
          <el-option
            v-for="item in gatewayData"
            :key="item.gatewayPo.id"
            :label="item.gatewayPo.name"
            :value="item.gatewayPo.id"
          />
        </el-select>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('deviceInfo.collectType')">
        <el-tag size="small">{{ data.networkConfigPo?.type ?? '' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('common.createTime')">
        {{ data.deviceInstancePo.createTime }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('common.updateTime')">
        {{ data.deviceInstancePo.updateTime }}
      </el-descriptions-item>
    </el-descriptions>

    <el-descriptions
      v-if="data.deviceInstancePo.metadata.tags.length > 0"
      border
      :title="$t('deviceInfo.deviceTags')"
      style="margin-top: 30px"
    >
      <el-descriptions-item
        v-for="(item, index) in data.deviceInstancePo.metadata.tags"
        :key="index"
        :label="item.tagName"
      >
        <el-input v-model="item.tagValue" />
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script>
import { computed, defineComponent, getCurrentInstance, onMounted, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import handlerDimensionTree from "@/util/dimension/DimensionTree";

export default defineComponent({
  name: "DeviceDetail",
  props: {
    gateways: {
      type: Array,
      required: true,
      default: () => ([]),
    },
    deviceData: {
      type: Object,
      required: false,
    },
    parentData: {
      type: Object,
      required: false,
    },
  },
  emits: ["tagSave", "detailSave"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const { t } = useI18n();
    const router = useRouter();
    const gatewayData = toRef(props, "gateways");
    const data = toRef(props, "deviceData");
    const parent = toRef(props, "parentData");
    const dimensionTree = ref([]);

    const dimensionAllTree = computed(() => {
      const rootTree = [];
      rootTree.push(...dimensionTree.value);
      return rootTree;
    });

    const parentName = computed(() => {
      if (parent.value == null) {
        return t("deviceInfo.none");
      }

      return parent.value.deviceInstancePo.name;
    });

    const selectedGatewayId = computed({
      get: () => data.value.deviceInstancePo.gatewayId ?? -1,
      set: (val) => {
        if (val === null || val === undefined || val === "") {
          data.value.deviceInstancePo.gatewayId = null;
          return;
        }
        data.value.deviceInstancePo.gatewayId = val;
      },
    });

    watch(data, () => {
      console.info("detail");
    });

    const productTypeLabelMap = computed(() => ({
      gateway: t("product.gateway"),
      children: t("product.childDevice"),
      device: t("product.directDevice"),
    }));

    const type = computed(() => productTypeLabelMap.value[data.value.productPo.type] || data.value.productPo.type);

    const requestDimensionApi = () => {
      proxy.$http.dimensionTree().then((value) => {
        const tree = {};
        dimensionTree.value.length = 0;
        handlerDimensionTree(value.data, tree);
        dimensionTree.value.push(tree);
        console.log("requestDimensionApi");
      });
    };

    onMounted(() => {
      requestDimensionApi();
      console.info("deviceDetail");
    });

    const editClick = () => {
      console.log("editClick:" + JSON.stringify(data.value.deviceInstancePo.metadata.tags));
      context.emit("detailSave", data.value.deviceInstancePo);
    };

    const goProduct = () => {
      router.push({ path: '/productInstance', query: { productId: data.value.deviceInstancePo.productId } });
    };

    return {
      selectedGatewayId,
      gatewayData,
      dimensionAllTree,
      type,
      data,
      editClick,
      parentName,
      goProduct,
    };
  },
});
</script>

<style scoped>
@import url('../style/tab-content.css');

.form-title {
  margin: 10px;
}

.el-descriptions {
  background: #ffffff;
}
</style>
