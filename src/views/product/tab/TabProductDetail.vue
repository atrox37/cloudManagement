<template>
  <div class="tab-pan-content">
    <el-descriptions v-if="copyData != null" :column="3" border>
      <template #title>
        <span>{{ copyData.productPo.name }}</span>
      </template>
      <template #extra>
        <el-space wrap>
          <el-button type="warning" plain :loading="btnload.load_asyn" @click="edgeProductAsyn">
            {{ $t('productDetail.edgeSync') }}
          </el-button>
          <el-button type="info" plain :loading="btnload.load_edit" @click="editClick">
            {{ $t('common.save') }}
          </el-button>
        </el-space>
      </template>
      <el-descriptions-item :label="$t('common.name')">
        <el-input v-model="copyData.productPo.name" />
      </el-descriptions-item>
      <el-descriptions-item :label="$t('productDetail.type')">
        <el-tag v-if="copyData.productPo.type === 'gateway'">{{ $t('product.gateway') }}</el-tag>
        <el-tag v-if="copyData.productPo.type === 'children'">{{ $t('product.childDevice') }}</el-tag>
        <el-tag v-if="copyData.productPo.type === 'device'">{{ $t('product.directDevice') }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('productDetail.productModel')">
        <el-input v-model="copyData.productPo.sn" />
      </el-descriptions-item>
      <el-descriptions-item :label="$t('common.creator')">
        {{ copyData.sysUserPo.username }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('common.org')">
        <el-tree-select
          v-model="copyData.productPo.orgId"
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
        {{ copyData.productPo.updateTime }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('productDetail.tags')">
        <el-space wrap>
          <el-tag
            v-for="(item, index) in copyData.productPo.metadata.tags"
            :key="index"
            closable
            @close="tagClose(index)"
            @click="tagClick(index)"
          >
            {{ item.tagName }}
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

export default defineComponent({
  name: "TabProductDetail",
  props: {
    productData: {
      type: Object,
      required: false,
    },
    btnload: {
      type: Object,
      required: true,
      default: () => ({ load_edit: false, load_asyn: false }),
    },
  },
  emits: ["dialogClick", "submit", "edgeAsyn"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const { t } = useI18n();
    const btnloadData = toRef(props, "btnload");
    const tagDialog = reactive({
      status: false,
      index: -1,
      tag: { tagKey: "", tagName: "", tagValue: "", optional: false },
    });
    const dimensionTree = ref([]);
    const tagForm = ref(null);
    const data = toRef(props, "productData");
    const copyData = ref(null);

    const dimensionAllTree = computed(() => {
      const rootTree = [];
      rootTree.push(...dimensionTree.value);
      return rootTree;
    });

    const validateSelect = (rule, value, callback) => {
      console.log("validateSelect:" + rule.field);
      if (rule.field === "tagKey") {
        if (!tagDialog.tag.tagKey) {
          callback(t("productDetail.tagKeyRequired"));
          return;
        }

        const exists = copyData.value.productPo.metadata.tags.some(
          (item) => item !== copyData.value.productPo.metadata.tags[tagDialog.index] && item.tagKey === tagDialog.tag.tagKey
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

      callback();
    };

    const requestDimensionApi = () => {
      proxy.$http.dimensionTree().then((value) => {
        const tree = {};
        dimensionTree.value.length = 0;
        handlerDimensionTree(value.data, tree);
        dimensionTree.value.push(tree);
        console.log("requestDimensionApi");
      });
    };

    const rules = ref({
      tagKey: [{ validator: validateSelect, trigger: "blur" }],
      tagName: [{ validator: validateSelect, trigger: "blur" }],
    });

    const initData = () => {
      copyData.value = JSON.parse(JSON.stringify(data.value));
    };

    const editClick = () => {
      context.emit("submit", copyData.value.productPo);
    };

    const edgeProductAsyn = () => {
      context.emit("edgeAsyn");
    };

    const addTag = () => {
      console.log("addTag");
      tagDialog.index = -1;
      tagDialog.tag = { tagKey: "", tagName: "", tagValue: "", optional: false };
      tagDialog.status = true;
    };

    const tagClose = (index) => {
      console.log(index);
      copyData.value.productPo.metadata.tags.splice(index, 1);
    };

    const tagClick = (index) => {
      console.log(index);
      tagDialog.index = index;
      tagDialog.tag = { ...copyData.value.productPo.metadata.tags[index] };
      tagDialog.status = true;
    };

    const tagSave = () => {
      console.log("tagSave");
      tagForm.value.validate((valid, fields) => {
        if (valid) {
          console.log("submit!:");
          tagDialog.status = false;
          if (tagDialog.index < 0) {
            copyData.value.productPo.metadata.tags.push(tagDialog.tag);
          } else {
            copyData.value.productPo.metadata.tags[tagDialog.index] = tagDialog.tag;
          }
        } else {
          console.log("error submit!", fields);
        }
      });
    };

    onMounted(() => {
      initData();
      requestDimensionApi();
    });

    return {
      btnloadData,
      dimensionAllTree,
      tagForm,
      rules,
      tagDialog,
      copyData,
      editClick,
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
