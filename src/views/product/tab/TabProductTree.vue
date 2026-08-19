<template>
  <div class="tree-layout">
    <section class="tree-panel">
      <header class="panel-header">
        <el-text tag="b">{{ $t("treeNode.structurePath") }}</el-text>
        <el-button :icon="Plus" @click="openAddDialog(null)">
          {{ $t("struct.addNode") }}
        </el-button>
      </header>

      <el-tree
        v-if="trees.length"
        :data="trees"
        :props="treeProps"
        node-key="id"
        default-expand-all
        highlight-current
        :expand-on-click-node="false"
      >
        <template #default="{ data }">
          <div class="tree-row">
            <div class="tree-row__identity">
              <span>{{ data.name }}</span>
              <el-tag size="small" effect="plain">{{ data.id }}</el-tag>
            </div>
            <el-button-group>
              <el-button
                :icon="Edit"
                text
                circle
                :title="$t('struct.editNode')"
                @click.stop="openEditDialog(data)"
              />
              <el-button
                :icon="Plus"
                text
                circle
                :title="$t('treeNode.append')"
                @click.stop="openAddDialog(data.id)"
              />
              <el-button
                :icon="Delete"
                text
                circle
                type="danger"
                :title="$t('common.delete')"
                @click.stop="removeNode(data)"
              />
            </el-button-group>
          </div>
        </template>
      </el-tree>
      <el-empty v-else :description="$t('common.noData')" />
    </section>
  </div>

  <el-dialog
    v-model="nodeDialog.visible"
    :title="$t(nodeDialog.mode === 'edit' ? 'struct.editNodeTitle' : 'struct.addNodeTitle')"
    width="480px"
    destroy-on-close
  >
    <el-form ref="nodeFormRef" :model="nodeDialog.form" :rules="nodeRules" label-width="100px" @submit.prevent>
      <el-form-item :label="$t('struct.nodeId')" prop="id">
        <el-input v-model="nodeDialog.form.id" :disabled="nodeDialog.mode === 'edit'" />
      </el-form-item>
      <el-form-item :label="$t('treeNode.nodeName')" prop="name">
        <el-input v-model="nodeDialog.form.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="nodeDialog.visible = false">{{ $t("common.cancel") }}</el-button>
      <el-button type="primary" @click="confirmNode">{{ $t("common.confirm") }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { computed, defineComponent, reactive, ref, toRef } from "vue";
import { Delete, Edit, Plus } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "TabProductTree",
  props: {
    productData: { type: Object, required: true },
  },
  setup(props) {
    const { t } = useI18n();
    const product = toRef(props, "productData");
    const nodeFormRef = ref(null);
    const trees = computed(() => product.value.metadata.struct.tree);
    const treeProps = { children: "children", label: "name" };
    const nodeDialog = reactive({
      visible: false,
      mode: "add",
      parentId: null,
      form: { id: "", name: "" },
    });

    const flattenNodes = (items, result = []) => {
      for (const item of items || []) {
        result.push(item);
        flattenNodes(item.children, result);
      }
      return result;
    };
    const findNode = (id) => flattenNodes(trees.value).find((item) => item.id === id);
    const nodeRules = computed(() => ({
      id: [{
        validator: (_rule, value, callback) => {
          const id = value?.trim();
          if (!id) callback(new Error(t("struct.nodeIdRequired")));
          else if (nodeDialog.mode === "add" && findNode(id)) callback(new Error(t("struct.nodeIdExists")));
          else callback();
        },
        trigger: "blur",
      }],
      name: [{ required: true, whitespace: true, message: t("struct.nodeNameRequired"), trigger: "blur" }],
    }));

    const openAddDialog = (parentId) => {
      nodeDialog.mode = "add";
      nodeDialog.parentId = parentId;
      nodeDialog.form = { id: "", name: "" };
      nodeDialog.visible = true;
    };
    const openEditDialog = (node) => {
      nodeDialog.mode = "edit";
      nodeDialog.parentId = null;
      nodeDialog.form = { id: node.id, name: node.name };
      nodeDialog.visible = true;
    };
    const confirmNode = async () => {
      try {
        await nodeFormRef.value.validate();
      } catch {
        return;
      }
      const id = nodeDialog.form.id.trim();
      const name = nodeDialog.form.name.trim();
      if (nodeDialog.mode === "edit") {
        findNode(id).name = name;
      } else {
        const newNode = { id, name, children: [] };
        if (nodeDialog.parentId) {
          const parent = findNode(nodeDialog.parentId);
          if (!Array.isArray(parent.children)) parent.children = [];
          parent.children.push(newNode);
        } else {
          trees.value.push(newNode);
        }
      }
      nodeDialog.visible = false;
    };
    const removeFrom = (items, id) => {
      const index = items.findIndex((item) => item.id === id);
      if (index >= 0) {
        items.splice(index, 1);
        return true;
      }
      return items.some((item) => removeFrom(item.children || [], id));
    };
    const removeNode = async (node) => {
      try {
        await ElMessageBox.confirm(
          t("struct.deleteProductNodeConfirm", { name: node.name }),
          t("struct.deleteNodeTitle"),
          {
            confirmButtonText: t("common.confirm"),
            cancelButtonText: t("common.cancel"),
            type: "warning",
          }
        );
      } catch {
        return;
      }
      removeFrom(trees.value, node.id);
    };

    return {
      Delete, Edit, Plus, trees, treeProps, nodeDialog, nodeFormRef, nodeRules,
      openAddDialog, openEditDialog, confirmNode, removeNode,
    };
  },
});
</script>

<style scoped>
.tree-layout { height: 100%; min-height: 640px; padding: 8px; box-sizing: border-box; }
.tree-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}
.panel-header {
  min-height: 48px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-light);
}
.tree-panel :deep(.el-tree) { flex: 1; padding: 8px; overflow: auto; }
.tree-panel > :deep(.el-empty) { flex: 1; }
.tree-row {
  width: 100%;
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.tree-row__identity { min-width: 0; display: flex; align-items: center; gap: 10px; }
:deep(.el-tree-node__content) { height: auto; padding-right: 8px; }
</style>
