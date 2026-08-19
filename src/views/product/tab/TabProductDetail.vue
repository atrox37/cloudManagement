<template>
  <div class="tab-pan-content">
    <el-descriptions v-if="editData != null" :column="3" border>
      <template #title>
        <span>{{ editData.name }}</span>
      </template>
      <template #extra>
      </template>
      <el-descriptions-item :label="$t('common.name')">
        <el-input v-model="editData.name" />
      </el-descriptions-item>
      <el-descriptions-item :label="$t('productDetail.type')">
        <el-tag v-if="editData.type === 'gateway'">{{ $t('product.gateway') }}</el-tag>
        <el-tag v-if="editData.type === 'children'">{{ $t('product.childDevice') }}</el-tag>
        <el-tag v-if="editData.type === 'device'">{{ $t('product.directDevice') }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('productDetail.productModel')">
        <el-input v-model="editData.sn" />
      </el-descriptions-item>
      <el-descriptions-item :label="$t('common.creator')">
        {{ productData.sysUserPo.username }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('common.org')">
        <el-tree-select
          v-model="editData.orgId"
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
      <el-descriptions-item :label="$t('common.updateTime')">
        {{ editData.updateTime }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="editData.type === 'gateway'"
        :label="$t('struct.type')"
      >
        <el-radio-group v-model="structType">
          <el-radio-button value="tree">{{ $t('struct.tree') }}</el-radio-button>
          <el-radio-button value="node">{{ $t('struct.node') }}</el-radio-button>
        </el-radio-group>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('productDetail.tags')">
        <el-space wrap>
          <el-tag
            v-for="(item, index) in editData.metadata.tags"
            :key="index"
            closable
            @close="tagClose(index)"
            @click="tagClick(index)"
          >
            {{ item.unit ? `${item.tagName} (${item.unit})` : item.tagName }}
          </el-tag>
          <el-button size="small" @click="addTag">+ New Tag</el-button>
        </el-space>
      </el-descriptions-item>
    </el-descriptions>
  </div>

  <el-dialog v-model="tagDialog.status" :title="$t('productDetail.tag')">
    <el-form ref="tagForm" :model="tagDialog.tag" label-width="80px" :rules="rules" status-icon>
      <el-form-item :label="$t('productDetail.tagKey')" prop="tagKey">
        <el-input v-model="tagDialog.tag.tagKey" :placeholder="$t('productDetail.tagKeyPlaceholder')" />
      </el-form-item>
      <el-form-item :label="$t('productDetail.tagName')" prop="tagName">
        <el-input v-model="tagDialog.tag.tagName" :placeholder="$t('productDetail.tagNamePlaceholder')" />
      </el-form-item>
      <el-form-item :label="$t('productDetail.unit')" prop="unit">
        <el-select
          v-model="tagDialog.tag.unit"
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
        <el-radio-group v-model="tagDialog.tag.optional">
          <el-radio :value="true" size="large">{{ $t('common.yes') }}</el-radio>
          <el-radio :value="false" size="large">{{ $t('common.no') }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="tagSave">{{ $t('common.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { computed, defineComponent, getCurrentInstance, onMounted, reactive, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import handlerDimensionTree from "@/util/dimension/DimensionTree";
import { deviceTypes } from "@/model/device/DeviceUnit";
import { changeMetadataStructType, ensureMetadataStruct } from "@/util/deviceStruct";

export default defineComponent({
  name: "TabProductDetail",
  props: {
    productData: {
      type: Object,
      required: false,
    },
    editData: {
      type: Object,
      required: true,
    },
    btnload: {
      type: Object,
      required: false,
      default: () => ({ load_edit: false, load_asyn: false }),
    },
  },
  emits: ["edgeAsyn"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const { t } = useI18n();
    const btnloadData = toRef(props, "btnload");
    const editData = toRef(props, "editData");
    const tagDialog = reactive({
      status: false,
      index: -1,
      tag: { tagKey: "", tagName: "", tagValue: "", unit: "", optional: false },
    });
    const dimensionTree = ref([]);
    const tagForm = ref(null);
    const tagUnits = deviceTypes.filter((item) => item.unit?.trim());

    const dimensionAllTree = computed(() => {
      const rootTree = [];
      rootTree.push(...dimensionTree.value);
      return rootTree;
    });

    const structType = computed({
      get: () => ensureMetadataStruct(editData.value.metadata)?.type || "tree",
      set: (value) => changeMetadataStructType(editData.value.metadata, value),
    });

    const validateSelect = (rule, value, callback) => {
      if (rule.field === "tagKey") {
        if (!tagDialog.tag.tagKey) {
          callback(t("productDetail.tagKeyRequired"));
          return;
        }
        const exists = editData.value.metadata.tags.some(
          (item, i) => i !== tagDialog.index && item.tagKey === tagDialog.tag.tagKey
        );
        if (exists) {
          callback(t("productDetail.tagKeyDuplicate"));
          return;
        }
      }
      if (rule.field === "tagName" && !tagDialog.tag.tagName) {
        callback(t("productDetail.tagNameRequired"));
        return;
      }
      if (rule.field === "unit" && !tagDialog.tag.unit?.trim()) {
        callback(t("productDetail.unitRequired"));
        return;
      }
      callback();
    };

    const requestDimensionApi = () => {
      proxy.$http.dimensionTree().then((value) => {
        const tree = {};
        dimensionTree.value.length = 0;
        handlerDimensionTree(value.data, tree);
        dimensionTree.value.push(tree);
      });
    };

    const rules = ref({
      tagKey: [{ validator: validateSelect, trigger: "blur" }],
      tagName: [{ validator: validateSelect, trigger: "blur" }],
      unit: [{ validator: validateSelect, trigger: "blur" }],
    });

    const edgeProductAsyn = () => {
      context.emit("edgeAsyn");
    };

    const addTag = () => {
      tagDialog.index = -1;
      tagDialog.tag = { tagKey: "", tagName: "", tagValue: "", unit: "", optional: false };
      tagDialog.status = true;
    };

    const tagClose = (index) => {
      editData.value.metadata.tags.splice(index, 1);
    };

    const tagClick = (index) => {
      tagDialog.index = index;
      tagDialog.tag = { ...editData.value.metadata.tags[index] };
      tagDialog.status = true;
    };

    const tagSave = () => {
      tagForm.value.validate((valid) => {
        if (valid) {
          tagDialog.status = false;
          if (tagDialog.index < 0) {
            editData.value.metadata.tags.push(tagDialog.tag);
          } else {
            editData.value.metadata.tags[tagDialog.index] = tagDialog.tag;
          }
        }
      });
    };

    onMounted(() => {
      requestDimensionApi();
    });

    return {
      btnloadData,
      dimensionAllTree,
      tagForm,
      tagUnits,
      structType,
      rules,
      tagDialog,
      editData,
      productData: toRef(props, "productData"),
      tagSave,
      tagClick,
      addTag,
      tagClose,
      edgeProductAsyn,
    };
  },
});
</script>

<style scoped>
@import url('style/index.scss');
</style>
