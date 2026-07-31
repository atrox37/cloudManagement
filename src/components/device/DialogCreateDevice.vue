<template>
  <el-dialog
    v-model="deviceDialog.status"
    :title="$t('deviceDialog.createTitle')"
    width="min(860px, 94vw)"
    destroy-on-close
    @closed="resetDraft"
  >
    <el-form
      ref="createForm"
      :rules="rules"
      :model="deviceDialog"
      label-width="120px"
      class="device-create-form"
    >
      <div class="form-grid">
        <el-form-item :label="$t('deviceDialog.deviceName')" prop="deviceName">
          <el-input v-model="deviceDialog.device.name" />
        </el-form-item>
        <el-form-item :label="$t('deviceDialog.deviceSN')" prop="deviceSN">
          <el-input v-model="deviceDialog.device.sn" />
        </el-form-item>
        <el-form-item :label="$t('deviceDialog.product')" prop="productId">
          <el-select
            v-model="deviceDialog.device.productId"
            style="width: 100%"
            @change="onProductChange"
          >
            <el-option
              v-for="item in products"
              :key="item.productPo.id"
              :label="item.productPo.name"
              :value="item.productPo.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="showCollectorGateway"
          :label="$t('deviceDialog.gateway')"
          prop="gatewayId"
        >
          <el-select v-model="deviceDialog.device.gatewayId" style="width: 100%">
            <el-option
              v-for="item in gateways"
              :key="item.gatewayPo.id"
              :label="item.gatewayPo.name"
              :value="item.gatewayPo.id"
            />
          </el-select>
        </el-form-item>
      </div>

      <template v-if="isChildProduct">
        <el-divider content-position="left">
          {{ $t('deviceDialog.childBinding') }}
        </el-divider>
        <div class="form-grid">
          <el-form-item
            :label="$t('deviceDialog.parentGateway')"
            prop="parentGatewayId"
          >
            <el-select
              v-model="selectedGatewayDeviceId"
              style="width: 100%"
              filterable
              @change="onGatewayDeviceChange"
            >
              <el-option
                v-for="item in gatewayDevices"
                :key="item.deviceInstancePo.id"
                :label="item.deviceInstancePo.name"
                :value="item.deviceInstancePo.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            :label="$t('deviceDialog.treeNode')"
            prop="treeNode"
          >
            <el-tree-select
              v-model="deviceDialog.device.treeNode"
              :data="gatewayTrees"
              :props="treeProps"
              node-key="id"
              check-strictly
              :render-after-expand="false"
              :disabled="!selectedGatewayDeviceId"
              style="width: 100%"
            />
          </el-form-item>
        </div>
      </template>

      <template v-if="tags.length">
        <el-divider content-position="left">
          {{ $t('deviceDialog.tag') }}
        </el-divider>
        <div class="form-grid">
          <el-form-item
            v-for="item in tags"
            :key="item.tagKey"
            :label="item.tagName"
          >
            <el-input v-model="item.tagValue" />
          </el-form-item>
        </div>
      </template>

      <el-divider content-position="left">
        {{ $t('deviceDialog.productRules') }}
      </el-divider>
      <el-table :data="productRules" border max-height="260">
        <el-table-column
          prop="name"
          :label="$t('deviceDialog.ruleName')"
          min-width="180"
        />
        <el-table-column
          :label="$t('common.status')"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.state === 1 ? 'success' : 'info'">
              {{ row.state === 1 ? $t('deviceAlarm.started') : $t('deviceAlarm.stopped') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('deviceDialog.boundUsers')"
          width="130"
          align="center"
        >
          <template #default="{ row }">
            {{ configuredNotifyCount(row.id) }}
          </template>
        </el-table-column>
        <el-table-column width="150" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="configureRule(row)"
            >
              {{ $t('deviceDialog.configureNotify') }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('deviceDialog.noProductRules')" :image-size="56" />
        </template>
      </el-table>
    </el-form>

    <template #footer>
      <el-button @click="deviceDialog.status = false">
        {{ $t('common.cancel') }}
      </el-button>
      <el-button
        type="primary"
        :loading="deviceDialog.loading"
        @click="submitClick"
      >
        {{ $t('common.submit') }}
      </el-button>
    </template>
  </el-dialog>

  <DialogAlarm
    v-if="dialogAlarmData"
    :device-data="draftDeviceData"
    :alarm-data="dialogAlarmData"
    :status="dialogAlarmVisible"
    @close="dialogAlarmVisible = false"
    @save="saveRuleChange"
  />
</template>

<script>
import {
  computed,
  defineComponent,
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
  toRef
} from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { normalizeEnumRuleParams } from "@/util/deviceRule";
import DialogAlarm from "@/components/device/DialogAlarm Copy.vue";

const cloneData = (value) => JSON.parse(JSON.stringify(value));

export default defineComponent({
  name: "DialogCreateDevice",
  components: { DialogAlarm },
  props: {
    data: {
      type: Object,
      required: false,
      default: () => ({ status: false, loading: false, device: { name: "" } })
    }
  },
  emits: ["createClick"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const { t } = useI18n();
    const deviceDialog = toRef(props, "data");
    const createForm = ref(null);
    const products = reactive([]);
    const gateways = reactive([]);
    const gatewayDevices = reactive([]);
    const gatewayTrees = reactive([]);
    const tags = reactive([]);
    const ruleChanges = reactive([]);
    const selectedProductType = ref(null);
    const selectedGatewayDeviceId = ref(null);
    const dialogAlarmVisible = ref(false);
    const dialogAlarmData = ref(null);

    const treeProps = {
      children: "children",
      label: "name",
      value: "id"
    };

    const showCollectorGateway = computed(() =>
      selectedProductType.value === "device" ||
      selectedProductType.value === "gateway"
    );
    const isChildProduct = computed(
      () => selectedProductType.value === "children"
    );
    const productRules = computed(
      () => deviceDialog.value.device.metadata?.rules || []
    );
    const draftDeviceData = computed(() => ({
      deviceInstancePo: deviceDialog.value.device
    }));

    const applyProduct = (productPo) => {
      selectedProductType.value = productPo?.type || null;
      deviceDialog.value.device.metadata = cloneData(productPo?.metadata || {
        properties: [],
        functions: [],
        propertyTags: [],
        trees: [],
        rules: [],
        tags: []
      });
      tags.length = 0;
      tags.push(...cloneData(deviceDialog.value.device.metadata.tags || []));
      deviceDialog.value.device.metadata.tags = tags;
      ruleChanges.length = 0;
      selectedGatewayDeviceId.value = null;
      gatewayTrees.length = 0;
      deviceDialog.value.device.gatewayId = null;
      deviceDialog.value.device.parentId = null;
      deviceDialog.value.device.treeNode = null;
    };

    const onProductChange = (productId) => {
      const matched = products.find(
        (item) => item.productPo.id === productId
      );
      if (!matched) return;
      applyProduct(matched.productPo);
      proxy.$http
        .productDetail({
          terms: [{ column: "t.id", value: productId }]
        })
        .then((value) => {
          if (deviceDialog.value.device.productId !== productId) return;
          applyProduct(value.data?.productPo || matched.productPo);
        });
    };

    const onGatewayDeviceChange = (deviceId) => {
      const selected = gatewayDevices.find(
        (item) => item.deviceInstancePo.id === deviceId
      );
      deviceDialog.value.device.parentId = deviceId;
      deviceDialog.value.device.gatewayId =
        selected?.deviceInstancePo?.gatewayId ?? null;
      deviceDialog.value.device.treeNode = null;
      gatewayTrees.length = 0;
      if (!deviceId) return;
      proxy.$http
        .deviceSearch({ terms: [{ column: "t.id", value: deviceId }] })
        .then((value) => {
          if (selectedGatewayDeviceId.value !== deviceId) return;
          gatewayTrees.push(
            ...cloneData(value.data?.deviceInstancePo?.metadata?.trees || [])
          );
        });
    };

    const configuredNotifyCount = (ruleId) =>
      ruleChanges.find((item) => item.ruleModel.id === ruleId)?.ruleMeta
        ?.length || 0;

    const toNotifyDtos = (ruleChange) =>
      (ruleChange?.ruleMeta || []).map((item) => ({
        ruleMetaPo: cloneData(item),
        notifyConfigPo: { id: null },
        notifyTemplatePo: null
      }));

    const configureRule = (rule) => {
      const existing = ruleChanges.find(
        (item) => item.ruleModel.id === rule.id
      );
      const openDialog = (columns) => {
        dialogAlarmData.value = {
          columns: cloneData(existing?.columns || columns || []),
          rulePo: cloneData(existing?.ruleModel || rule),
          notifyDtos: toNotifyDtos(existing)
        };
        dialogAlarmVisible.value = true;
      };
      if (existing) {
        openDialog(existing.columns);
        return;
      }
      proxy.$http.productParse(rule.ruleMeta).then(
        (value) => openDialog(value.data),
        () => ElMessage.error(t("deviceDialog.ruleParseFailed"))
      );
    };

    const saveRuleChange = (ruleChange) => {
      const index = ruleChanges.findIndex(
        (item) => item.ruleModel.id === ruleChange.ruleModel.id
      );
      const copy = cloneData(ruleChange);
      if (index >= 0) {
        ruleChanges.splice(index, 1, copy);
      } else {
        ruleChanges.push(copy);
      }
      const ruleIndex = productRules.value.findIndex(
        (item) => item.id === copy.ruleModel.id
      );
      if (ruleIndex >= 0) {
        productRules.value.splice(ruleIndex, 1, cloneData(copy.ruleModel));
      }
      dialogAlarmVisible.value = false;
    };

    const validateSelect = (rule, value, callback) => {
      if (rule.field === "productId" && !deviceDialog.value.device.productId) {
        callback(t("deviceDialog.productRequired"));
      } else if (
        rule.field === "deviceName" &&
        !deviceDialog.value.device.name?.trim()
      ) {
        callback(t("deviceDialog.nameRequired"));
      } else if (
        rule.field === "deviceSN" &&
        !deviceDialog.value.device.sn?.trim()
      ) {
        callback(t("deviceDialog.snRequired"));
      } else if (
        rule.field === "gatewayId" &&
        showCollectorGateway.value &&
        !deviceDialog.value.device.gatewayId
      ) {
        callback(t("deviceDialog.gatewayRequired"));
      } else if (
        rule.field === "parentGatewayId" &&
        isChildProduct.value &&
        !selectedGatewayDeviceId.value
      ) {
        callback(t("deviceDialog.parentGatewayRequired"));
      } else if (
        rule.field === "treeNode" &&
        isChildProduct.value &&
        !deviceDialog.value.device.treeNode
      ) {
        callback(t("deviceDialog.treeNodeRequired"));
      } else {
        callback();
      }
    };

    const rules = ref({
      deviceName: [{ validator: validateSelect, trigger: "blur" }],
      productId: [{ validator: validateSelect, trigger: "change" }],
      deviceSN: [{ validator: validateSelect, trigger: "blur" }],
      gatewayId: [{ validator: validateSelect, trigger: "change" }],
      parentGatewayId: [{ validator: validateSelect, trigger: "change" }],
      treeNode: [{ validator: validateSelect, trigger: "change" }]
    });

    const submitClick = () => {
      createForm.value.validate((valid) => {
        if (!valid) return;
        const device = cloneData(deviceDialog.value.device);
        device.metadata.tags = cloneData(tags);
        const ruleChange = cloneData(ruleChanges);
        normalizeEnumRuleParams(device.metadata, ruleChange);
        context.emit("createClick", {
          device,
          ruleChange,
          childBinding: []
        });
      });
    };

    const resetDraft = () => {
      dialogAlarmVisible.value = false;
      dialogAlarmData.value = null;
      selectedProductType.value = null;
      selectedGatewayDeviceId.value = null;
      gatewayTrees.length = 0;
      tags.length = 0;
      ruleChanges.length = 0;
      deviceDialog.value.device = { name: "" };
      createForm.value?.clearValidate();
    };

    const requestAllProductApi = () => {
      proxy.$http.productPage({ size: -1 }).then((value) => {
        products.length = 0;
        products.push(...value.data.records);
      });
    };

    const requestAllGatewayApi = () => {
      proxy.$http.gatewayPage({ size: -1 }).then((value) => {
        gateways.length = 0;
        gateways.push(...value.data.records);
      });
    };

    const requestGatewayDevices = () => {
      proxy.$http
        .devicePage({
          size: -1,
          terms: [
            {
              column: "t2.type",
              value: "gateway",
              termType: "eq",
              type: "and"
            }
          ]
        })
        .then((value) => {
          gatewayDevices.length = 0;
          gatewayDevices.push(...value.data.records);
        });
    };

    onMounted(() => {
      requestAllProductApi();
      requestAllGatewayApi();
      requestGatewayDevices();
    });

    return {
      createForm,
      deviceDialog,
      products,
      gateways,
      gatewayDevices,
      gatewayTrees,
      tags,
      productRules,
      selectedGatewayDeviceId,
      showCollectorGateway,
      isChildProduct,
      treeProps,
      rules,
      dialogAlarmVisible,
      dialogAlarmData,
      draftDeviceData,
      onProductChange,
      onGatewayDeviceChange,
      configuredNotifyCount,
      configureRule,
      saveRuleChange,
      submitClick,
      resetDraft
    };
  }
});
</script>

<style scoped>
.device-create-form {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
