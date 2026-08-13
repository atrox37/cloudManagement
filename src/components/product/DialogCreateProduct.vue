<template>
  <el-dialog
    v-model="productDialog.status"
    :title="$t('productDialog.createTitle')"
    width="min(760px, 94vw)"
  >
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

      <el-divider content-position="left">{{ $t('productDetail.tags') }}</el-divider>
      <div class="tag-toolbar">
        <el-button type="primary" :icon="Plus" plain @click="addTag">
          {{ $t('productDetail.addTag') }}
        </el-button>
      </div>
      <div
        v-for="(tag, index) in productDialog.product.metadata.tags"
        :key="index"
        class="tag-row"
      >
        <el-form-item
          :label="$t('productDetail.tagKey')"
          :prop="`metadata.tags.${index}.tagKey`"
          :rules="tagKeyRules"
        >
          <el-input v-model="tag.tagKey" :placeholder="$t('productDetail.tagKeyPlaceholder')" />
        </el-form-item>
        <el-form-item
          :label="$t('productDetail.tagName')"
          :prop="`metadata.tags.${index}.tagName`"
          :rules="tagNameRules"
        >
          <el-input v-model="tag.tagName" :placeholder="$t('productDetail.tagNamePlaceholder')" />
        </el-form-item>
        <el-form-item
          :label="$t('productDetail.unit')"
          :prop="`metadata.tags.${index}.unit`"
          :rules="unitRules"
        >
          <el-select
            v-model="tag.unit"
            filterable
            :placeholder="$t('productDetail.unitPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="item in tagUnits"
              :key="item.unit"
              :label="`${item.en} (${item.unit})`"
              :value="item.unit"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('productDetail.required')">
          <el-radio-group v-model="tag.optional">
            <el-radio :value="true">{{ $t('common.yes') }}</el-radio>
            <el-radio :value="false">{{ $t('common.no') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-button
          class="tag-delete"
          type="danger"
          :icon="Delete"
          circle
          :title="$t('common.delete')"
          @click="removeTag(index)"
        />
      </div>
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
import { Delete, Plus } from '@element-plus/icons-vue'
import { deviceTypes } from '@/model/device/DeviceUnit'

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
    const tagUnits = deviceTypes.filter((item) => item.unit?.trim());

    const requiredRule = (message) => ({
      required: true,
      whitespace: true,
      message,
      trigger: "blur",
    });
    const tagKeyRules = [
      requiredRule(t('productDetail.tagKeyRequired')),
      {
        validator: (rule, value, callback) => {
          const duplicate = productDialog.value.product.metadata.tags
            .filter((item) => item.tagKey === value).length > 1;
          duplicate ? callback(t('productDetail.tagKeyDuplicate')) : callback();
        },
        trigger: "blur",
      },
    ];
    const tagNameRules = [requiredRule(t('productDetail.tagNameRequired'))];
    const unitRules = [requiredRule(t('productDetail.unitRequired'))];

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
    const addTag = () => {
      productDialog.value.product.metadata.tags.push({
        tagKey: "",
        tagName: "",
        tagValue: "",
        unit: "",
        optional: false,
      });
    };
    const removeTag = (index) => {
      productDialog.value.product.metadata.tags.splice(index, 1);
    };
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
    return {
      Delete,
      Plus,
      rules,
      tagKeyRules,
      tagNameRules,
      unitRules,
      tagUnits,
      createForm,
      productTypeList,
      productDialog,
      addTag,
      removeTag,
      submitClick,
    };
  },
});
</script>

<style scoped>
.tag-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.tag-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
  padding: 16px 48px 0 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.tag-delete {
  position: absolute;
  top: 16px;
  right: 0;
}

@media (max-width: 640px) {
  .tag-row {
    grid-template-columns: 1fr;
  }
}
</style>
