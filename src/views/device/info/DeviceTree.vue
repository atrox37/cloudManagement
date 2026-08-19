<template>
  <div class="structure-layout">
    <section class="tree-panel">
      <header class="panel-header">
        <el-text tag="b">{{ $t("treeNode.structurePath") }}</el-text>
        <el-button-group>
          <el-button :icon="Plus" circle :title="$t('treeNode.append')" @click="appendRoot" />
          <el-button :icon="UserFilled" circle :title="$t('struct.addDevice')" @click="addDevice" />
        </el-button-group>
      </header>
      <el-tree
        ref="treeRef"
        node-key="id"
        :data="trees"
        :props="treeProps"
        default-expand-all
        highlight-current
        :expand-on-click-node="false"
        @node-click="selectNode"
      >
        <template #default="{ node, data }">
          <div class="tree-row">
            <span>{{ node.label }}</span>
            <el-button-group>
              <el-button :icon="Edit" text circle :title="$t('treeNode.rename')" @click.stop="renameNode(data)" />
              <el-button :icon="Plus" text circle :title="$t('treeNode.append')" @click.stop="appendNode(data)" />
              <el-button :icon="Delete" text circle :title="$t('common.delete')" @click.stop="removeNode(node, data)" />
            </el-button-group>
          </div>
        </template>
      </el-tree>
    </section>

    <section class="device-panel">
      <header class="panel-header">
        <div class="panel-title">
          <el-text tag="b">{{ selectedNodeLabel }}</el-text>
          <el-tag size="small">{{ selectedRows.length }}</el-tag>
        </div>
        <el-button
          v-show="selectedSelection.length > 0"
          type="danger"
          plain
          :icon="Delete"
          @click="confirmUnbind"
        >
          {{ $t("struct.unbind") }}
        </el-button>
      </header>
      <el-table
        ref="selectedTableRef"
        :data="selectedRows"
        height="100%"
        v-loading="loading"
        stripe
        row-key="deviceInstancePo.id"
        @selection-change="handleSelectedSelection"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="deviceInstancePo.name" :label="$t('device.deviceName')" min-width="150" />
        <el-table-column prop="productPo.name" :label="$t('device.productName')" min-width="140" />
        <template #empty><el-empty :image-size="60" /></template>
      </el-table>
    </section>

    <aside class="unassigned-panel">
      <header class="panel-header">
        <div class="panel-title">
          <el-text tag="b">{{ $t("struct.unassigned") }}</el-text>
          <el-tag type="warning" size="small">{{ unassignedRows.length }}</el-tag>
        </div>
        <el-button
          v-show="unassignedSelection.length > 0"
          type="primary"
          :icon="Connection"
          :disabled="!selectedNodeId"
          @click="bindSelected"
        >
          {{ $t("struct.bind") }}
        </el-button>
      </header>
      <el-table
        ref="unassignedTableRef"
        :data="unassignedRows"
        height="100%"
        v-loading="loading"
        stripe
        row-key="deviceInstancePo.id"
        @selection-change="handleUnassignedSelection"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="deviceInstancePo.name" :label="$t('device.deviceName')" min-width="130" />
        <el-table-column prop="productPo.name" :label="$t('device.productName')" min-width="120" />
        <template #empty><el-empty :image-size="60" /></template>
      </el-table>
    </aside>
  </div>

  <el-dialog v-model="renameDialog.visible" :title="$t('treeNode.renameTitle')" width="420px">
    <el-form @submit.prevent>
      <el-form-item :label="$t('treeNode.nodeName')">
        <el-input v-model="renameDialog.name" @keyup.enter="saveRename" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="renameDialog.visible = false">{{ $t("common.cancel") }}</el-button>
      <el-button type="primary" @click="saveRename">{{ $t("common.save") }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { computed, defineComponent, getCurrentInstance, onMounted, reactive, ref, toRef } from "vue";
import { Connection, Delete, Edit, Plus, UserFilled } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "DeviceTree",
  props: {
    deviceData: { type: Object, required: true },
    deviceDraft: { type: Object, required: true },
    pendingBindings: { type: Array, default: () => [] },
    pendingRows: { type: Array, default: () => [] },
  },
  emits: ["addChildrenClick", "delChildrenClick", "assignChild"],
  setup(props, { emit }) {
    const { proxy } = getCurrentInstance();
    const { t } = useI18n();
    const draft = toRef(props, "deviceDraft");
    const treeRef = ref(null);
    const serverRows = ref([]);
    const loading = ref(false);
    const selectedNodeId = ref(null);
    const selectedNodeName = ref("");
    const selectedTableRef = ref(null);
    const selectedSelection = ref([]);
    const unassignedTableRef = ref(null);
    const unassignedSelection = ref([]);
    const renameDialog = reactive({ visible: false, node: null, name: "" });
    const treeProps = { children: "children", label: "name" };

    const trees = computed(() => draft.value.metadata.struct.tree);
    const gatewayId = computed(() => props.deviceData.deviceInstancePo.id);
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const createId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

    const effectiveRows = computed(() => {
      const bindings = new Map(props.pendingBindings.map((item) => [item.id, item]));
      const rows = serverRows.value
        .map(clone)
        .filter((row) => bindings.get(row.deviceInstancePo.id)?.parentId !== null)
        .map((row) => {
          const binding = bindings.get(row.deviceInstancePo.id);
          if (binding) Object.assign(row.deviceInstancePo, binding);
          return row;
        });
      for (const source of props.pendingRows) {
        const binding = bindings.get(source.deviceInstancePo.id);
        if (!binding || binding.parentId !== gatewayId.value) continue;
        if (rows.some((row) => row.deviceInstancePo.id === binding.id)) continue;
        const row = clone(source);
        Object.assign(row.deviceInstancePo, binding);
        rows.push(row);
      }
      return rows;
    });

    const collectIds = (items, ids = new Set()) => {
      for (const item of items || []) {
        if (!item) continue;
        ids.add(item.id);
        collectIds(item.children, ids);
      }
      return ids;
    };
    const validNodeIds = computed(() => collectIds(trees.value));
    const selectedRows = computed(() =>
      selectedNodeId.value
        ? effectiveRows.value.filter((row) => row.deviceInstancePo.treeNode === selectedNodeId.value)
        : []
    );
    const unassignedRows = computed(() =>
      effectiveRows.value.filter((row) => {
        const nodeId = row.deviceInstancePo.treeNode;
        return !nodeId || !validNodeIds.value.has(nodeId);
      })
    );
    const selectedNodeLabel = computed(() =>
      selectedNodeId.value ? `${t("struct.nodeDevices")}: ${selectedNodeName.value}` : t("struct.nodeDevices")
    );

    const initPage = () => {
      loading.value = true;
      proxy.$http.devicePage({
        size: -1,
        terms: [{ column: "t.parent_id", value: gatewayId.value }],
        sorts: [{ column: "t.create_time", order: "desc" }],
      }).then((value) => {
        serverRows.value = value.data.records || [];
      }).finally(() => {
        loading.value = false;
      });
    };
    const selectNode = (node) => {
      selectedSelection.value = [];
      selectedTableRef.value?.clearSelection();
      selectedNodeId.value = node.id;
      selectedNodeName.value = node.name;
    };
    const appendRoot = () => trees.value.push({ id: createId(), name: t("struct.newNode"), children: [] });
    const appendNode = (node) => {
      if (!Array.isArray(node.children)) node.children = [];
      node.children.push({ id: createId(), name: t("struct.newNode"), children: [] });
    };
    const removeNode = (node, data) => {
      const siblings = node.parent?.data?.children || trees.value;
      const index = siblings.findIndex((item) => item.id === data.id);
      if (index >= 0) siblings.splice(index, 1);
      if (selectedNodeId.value === data.id) {
        selectedNodeId.value = null;
        selectedNodeName.value = "";
      }
    };
    const renameNode = (node) => Object.assign(renameDialog, { visible: true, node, name: node.name });
    const saveRename = () => {
      if (!renameDialog.name?.trim()) return;
      renameDialog.node.name = renameDialog.name.trim();
      selectedNodeName.value = renameDialog.node.name;
      renameDialog.visible = false;
    };
    const addDevice = () => {
      if (!selectedNodeId.value) return ElMessage.error(t("treeNode.noNodeSelected"));
      emit("addChildrenClick", selectedNodeId.value);
    };
    const handleUnassignedSelection = (rows) => {
      unassignedSelection.value = rows;
    };
    const bindSelected = () => {
      if (!selectedNodeId.value) return ElMessage.error(t("treeNode.noNodeSelected"));
      for (const row of [...unassignedSelection.value]) {
        emit("assignChild", row, selectedNodeId.value);
      }
      unassignedSelection.value = [];
      unassignedTableRef.value?.clearSelection();
    };
    const handleSelectedSelection = (rows) => {
      selectedSelection.value = rows;
    };
    const confirmUnbind = async () => {
      if (selectedSelection.value.length === 0) return;
      try {
        await ElMessageBox.confirm(
          t("struct.unbindConfirm", { count: selectedSelection.value.length }),
          t("struct.unbindTitle"),
          {
            confirmButtonText: t("common.confirm"),
            cancelButtonText: t("common.cancel"),
            type: "warning",
          }
        );
      } catch {
        return;
      }
      for (const row of [...selectedSelection.value]) {
        emit("delChildrenClick", row);
      }
      selectedSelection.value = [];
      selectedTableRef.value?.clearSelection();
    };

    onMounted(initPage);

    return {
      Connection, Delete, Edit, Plus, UserFilled,
      treeRef, treeProps, trees, loading, renameDialog,
      selectedNodeId, selectedNodeLabel, selectedRows, unassignedRows,
      selectedTableRef, selectedSelection,
      unassignedTableRef, unassignedSelection,
      initPage, selectNode, appendRoot, appendNode, removeNode,
      renameNode, saveRename, addDevice, handleUnassignedSelection, bindSelected,
      handleSelectedSelection, confirmUnbind,
    };
  },
});
</script>

<style scoped>
.structure-layout {
  display: grid;
  grid-template-columns: minmax(520px, 1fr) minmax(300px, 380px);
  grid-template-rows: minmax(360px, 1fr) minmax(220px, 0.55fr);
  gap: 12px;
  height: 100%;
  min-height: 640px;
  padding: 8px;
  box-sizing: border-box;
}
.tree-panel, .device-panel, .unassigned-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}
.tree-panel { grid-row: 1 / 3; }
.panel-header {
  min-height: 48px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-light);
}
.panel-title { display: flex; align-items: center; gap: 8px; }
.tree-panel :deep(.el-tree) { flex: 1; overflow: auto; padding: 8px; }
.tree-row { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between; }
.device-panel :deep(.el-table), .unassigned-panel :deep(.el-table) { flex: 1; }
@media (max-width: 1100px) {
  .structure-layout { grid-template-columns: 1fr; grid-template-rows: 520px 280px 280px; }
  .tree-panel { grid-row: auto; }
}
</style>
