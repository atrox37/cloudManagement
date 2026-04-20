<template>
  <el-dialog v-model="productDialog.status" :title="$t('productDialog.createTitle')" width="30%">
    <el-form ref="createForm" :rules="rules" :model="productDialog.product">
      <el-form-item :label="$t('productDialog.productName')" prop="productName">
        <el-input v-model="productDialog.product.name"></el-input>
      </el-form-item>
      <el-form-item :label="$t('productDialog.productSn')" prop="productSn">
        <el-input v-model="productDialog.product.sn"></el-input>
      </el-form-item>
      <el-form-item :label="$t('productDialog.productType')">
        <el-select v-model="productDialog.product.type">
          <el-option
            v-for="(item, index) in productTypeList"
            :key="index"
            :label="item.name"
            :value="item.type"
          >
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="right-flex-contain">
        <el-button
          type="primary"
          @click="submitClick"
          :loading="productDialog.loading"
          >{{ $t('common.submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import {
  defineComponent,
  reactive,
  ref,
  computed,
  getCurrentInstance,
  onMounted,
  toRef,
} from "vue";
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: "DialogCreateProduct",
  props: {
    data: {
      type: Object,
      required: false,
      default: () => ({ status: false, loading: false, product: {} }),
    },
  },
  emits: ["createClick"],
  setup(props, context) {
    const { t } = useI18n()
    const createForm = ref(null);
    const productDialog = toRef(props, "data");

    const productTypeList = computed(() => [
      { type: "device", name: t('productDialog.directDevice') },
      { type: "gateway", name: t('productDialog.gatewayDevice') },
      { type: "children", name: t('productDialog.childDevice') },
    ])

    const validateSelect = (rule, value, callback) => {
      if (rule.field == "productName") {
        if (
          productDialog.value.product.name == undefined ||
          productDialog.value.product.name == ""
        ) {
          callback(t('productDialog.productNameRequired'));
        } else {
          callback();
        }
      }else if (rule.field == "productSn") {
        if (
          productDialog.value.product.sn == undefined ||
          productDialog.value.product.sn == ""
        ) {
          callback(t('productDialog.productSnRequired'));
        } else {
          callback();
        }
      }
    };
    const rules = ref({
      productName: [{ validator: validateSelect, trigger: "blur" }],
      productSn: [{ validator: validateSelect, trigger: "blur" }]
    });
    const submitClick = () => {
      console.log("submitClick!");
      createForm.value.validate((valid, fields) => {
        if (valid) {
          context.emit("createClick");
        } else {
          console.log("error submit!", fields);
        }
      });
    };
    return { rules, createForm, productTypeList, productDialog, submitClick };
  },
});
</script>
