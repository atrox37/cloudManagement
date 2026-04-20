<template>
  <el-dialog v-model="deviceDialog.status" :title="$t('deviceDialog.createTitle')" width="30%">
    <el-form ref="createForm" :rules="rules" :model="deviceDialog">
      <el-form-item :label="$t('deviceDialog.deviceName')" prop="deviceName" label-width="100">
        <el-input v-model="deviceDialog.device.name"></el-input>
      </el-form-item>
      <el-form-item :label="$t('deviceDialog.deviceSN')" prop="deviceSN" label-width="100">
        <el-input v-model="deviceDialog.device.sn"></el-input>
      </el-form-item>
      <el-form-item :label="$t('deviceDialog.product')" prop="productId" label-width="100">
        <el-select v-model="deviceDialog.device.productId" @change="onProductChange">
          <el-option v-for="(item,index) in products" :key="index" :label="item.productPo.name"
                     :value="item.productPo.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="showGateway" :label="$t('deviceDialog.gateway')" prop="gatewayId" label-width="100">
        <el-select v-model="deviceDialog.device.gatewayId" clearable>
          <el-option v-for="(item,index) in gateways" :key="index" :label="item.gatewayPo.name"
                     :value="item.gatewayPo.id"></el-option>
        </el-select>
      </el-form-item>
      <el-divider v-if="tags.length > 0" content-position="center"><el-text>{{ $t('deviceDialog.tag') }}</el-text></el-divider>
      <el-form-item v-for="(item,index) in tags" :key="index" :label="item.tagName" label-width="100">
        <el-input v-model="item.tagValue"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="right-flex-contain">
        <el-button type="primary" @click="submitClick" :loading="deviceDialog.loading">{{ $t('common.submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import { defineComponent, reactive, ref, computed, getCurrentInstance, onMounted, toRef } from "vue";
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: "DialogCreateDevice",
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
    const { t } = useI18n()
    const deviceDialog = toRef(props, "data");
    const createForm = ref(null);
    const products = reactive([]);
    const gateways = reactive([]);
    const tags = reactive([]);

    const selectedProductType = ref(null);

    const showGateway = computed(() =>
      selectedProductType.value === "device" || selectedProductType.value === "gateway"
    );

    const onProductChange = (productId) => {
      const matched = products.find(p => p.productPo.id === productId);
      selectedProductType.value = matched ? matched.productPo.type : null;
      if (selectedProductType.value === "children") {
        deviceDialog.value.device.gatewayId = null;
        deviceDialog.value.device.parentId = null;
        deviceDialog.value.device.treeNode = null;
      }
    };

    const validateSelect = (rule, value, callback) => {
      if (rule.field === "productId") {
        if (!deviceDialog.value.device.productId) {
          callback(t('deviceDialog.productRequired'));
        } else {
          callback();
        }
      } else if (rule.field === "deviceName") {
        if (!deviceDialog.value.device.name) {
          callback(t('deviceDialog.nameRequired'));
        } else {
          callback();
        }
      } else if (rule.field === "deviceSN") {
        if (!deviceDialog.value.device.sn) {
          callback(t('deviceDialog.snRequired'));
        } else {
          callback();
        }
      } else if (rule.field === "gatewayId") {
        if (showGateway.value && !deviceDialog.value.device.gatewayId) {
          callback(t('deviceDialog.gatewayRequired'));
        } else {
          callback();
        }
      }
    };

    const rules = ref({
      deviceName: [{ validator: validateSelect, trigger: "blur" }],
      productId: [{ validator: validateSelect, trigger: "change" }],
      deviceSN: [{ validator: validateSelect, trigger: "blur" }],
      gatewayId: [{ validator: validateSelect, trigger: "change" }]
    });

    const submitClick = () => {
      createForm.value.validate((valid, fields) => {
        if (valid) {
          context.emit("createClick");
        } else {
          console.log("error submit!", fields);
        }
      });
    };

    const requestAllProductApi = () => {
      proxy.$http.productPage({ "size": -1 }).then(value => {
        products.push(...value.data.records);
      });
    };

    const requestAllGatewayApi = () => {
      proxy.$http.gatewayPage({ "size": -1 }).then(value => {
        gateways.push(...value.data.records);
      });
    };

    onMounted(() => {
      requestAllProductApi();
      requestAllGatewayApi();
    });

    return {
      tags,
      createForm,
      rules,
      gateways,
      products,
      deviceDialog,
      showGateway,
      onProductChange,
      submitClick
    };
  }
});
</script>
