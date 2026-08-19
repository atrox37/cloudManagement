<template>
  <div class="node-layout">
    <section class="flow-panel">
      <header class="flow-toolbar">
        <el-space>
          <el-button :icon="selectedNodeId ? Edit : Plus" @click="openNodeDialog">
            {{ $t(selectedNodeId ? "struct.editNode" : "struct.addNode") }}
          </el-button>
          <el-button :icon="Delete" :disabled="!selectedNodeId" @click="deleteNode">
            {{ $t("struct.deleteNode") }}
          </el-button>
          <el-button :icon="UserFilled" :disabled="!selectedNodeId" @click="addDevice">
            {{ $t("struct.addDevice") }}
          </el-button>
        </el-space>
      </header>
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        class="device-flow"
        fit-view-on-init
        :min-zoom="0.2"
        :max-zoom="2"
        :connection-mode="ConnectionMode.Loose"
        @connect="connectNode"
        @node-click="selectNode"
        @pane-click="clearSelection"
      >
        <template #node-product="{ data, selected }">
          <div class="product-node" :class="{ 'is-selected': selected }">
            <Handle
              id="top"
              type="source"
              :position="FlowPosition.Top"
              class="flow-handle"
            />
            <Handle
              id="right"
              type="source"
              :position="FlowPosition.Right"
              class="flow-handle"
            />
            <Handle
              id="bottom"
              type="source"
              :position="FlowPosition.Bottom"
              class="flow-handle"
            />
            <Handle
              id="left"
              type="source"
              :position="FlowPosition.Left"
              class="flow-handle"
            />

            <div class="product-node__header">
              <el-icon><Cpu /></el-icon>
              <strong>{{ data.label }}</strong>
            </div>
            <div class="product-node__data">
              <div
                v-for="item in nodeDataEntries(data).slice(0, 3)"
                :key="item.key"
                class="product-node__data-row"
              >
                <span class="product-node__data-key" :title="item.key">{{ item.key }}</span>
                <span class="product-node__data-value" :title="item.displayValue">
                  {{ item.displayValue }}
                </span>
              </div>
              <div v-if="nodeDataEntries(data).length > 3" class="product-node__more">
                +{{ nodeDataEntries(data).length - 3 }}
              </div>
            </div>
          </div>
        </template>
        <Background pattern-color="#d7dce3" :gap="18" />
        <Controls />
      </VueFlow>
    </section>

    <section class="node-devices">
      <header class="panel-header">
        <div class="panel-title">
          <el-text tag="b">{{ $t("struct.nodeDevices") }}</el-text>
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
        <el-table-column prop="productPo.name" :label="$t('device.productName')" min-width="130" />
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

  <el-dialog
    v-model="nodeDialog.visible"
    :title="$t(nodeDialog.mode === 'edit' ? 'struct.editNodeTitle' : 'struct.addNodeTitle')"
    width="500px"
    destroy-on-close
  >
    <el-form
      ref="nodeFormRef"
      :model="nodeDialog.form"
      :rules="nodeRules"
      label-width="100px"
      @submit.prevent
    >
      <el-form-item :label="$t('struct.nodeId')" prop="id">
        <el-input v-model="nodeDialog.form.id" :disabled="nodeDialog.mode === 'edit'" />
      </el-form-item>
      <el-form-item :label="$t('treeNode.nodeName')" prop="label">
        <el-input v-model="nodeDialog.form.label" />
      </el-form-item>
      <el-divider content-position="left">{{ $t("struct.customData") }}</el-divider>
      <div class="data-editor">
        <div
          v-for="(item, index) in nodeDialog.form.data"
          :key="index"
          class="data-editor__row"
        >
          <el-input v-model="item.key" :placeholder="$t('struct.dataKey')" />
          <el-input v-model="item.value" :placeholder="$t('struct.dataValue')" />
          <el-button
            :icon="Delete"
            text
            circle
            :title="$t('common.delete')"
            @click="removeDataField(index)"
          />
        </div>
        <el-button :icon="Plus" @click="addDataField">{{ $t("struct.addData") }}</el-button>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="nodeDialog.visible = false">{{ $t("common.cancel") }}</el-button>
      <el-button type="primary" @click="confirmAddNode">{{ $t("common.confirm") }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { computed, defineComponent, getCurrentInstance, onMounted, reactive, ref, toRef } from "vue";
import { Connection, Cpu, Delete, Edit, Plus, UserFilled } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";
import {
  ConnectionMode,
  Handle,
  Position as FlowPosition,
  VueFlow,
} from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";

const SOURCE_HANDLES = new Set([
  "top",
  "right",
  "bottom",
  "left",
]);
const TARGET_HANDLES = new Set([
  "top",
  "right",
  "bottom",
  "left",
]);

export default defineComponent({
  name: "DeviceNode",
  components: { VueFlow, Background, Controls, Handle, Cpu },
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
    const serverRows = ref([]);
    const loading = ref(false);
    const selectedNodeId = ref(null);
    const selectedTableRef = ref(null);
    const selectedSelection = ref([]);
    const unassignedTableRef = ref(null);
    const unassignedSelection = ref([]);
    const nodeFormRef = ref(null);
    const createNodeForm = () => ({
      id: "",
      label: "",
      data: [{ key: "", value: "" }],
    });
    const nodeDialog = reactive({ visible: false, mode: "add", form: createNodeForm() });
    const gatewayId = computed(() => props.deviceData.deviceInstancePo.id);
    const graph = computed(() => draft.value.metadata.struct.node);
    const nodes = computed({ get: () => graph.value.nodes, set: (value) => { graph.value.nodes = value; } });
    const edges = computed({ get: () => graph.value.edges, set: (value) => { graph.value.edges = value; } });
    const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value));
    const clone = (value) => JSON.parse(JSON.stringify(value));

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

    const validNodeIds = computed(() => new Set(nodes.value.map((node) => node.id)));
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
    const formatNodeValue = (value) => {
      if (typeof value === "string") return value;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    };
    const nodeDataEntries = (data) => Object.entries(data || {})
      .filter(([key, value]) => key !== "label" && value !== null && value !== "")
      .map(([key, value]) => ({ key, displayValue: formatNodeValue(value) }));
    const nodeRules = computed(() => ({
      id: [
        {
          validator: (_rule, value, callback) => {
            if (!value?.trim()) {
              callback(new Error(t("struct.nodeIdRequired")));
            } else if (
              nodeDialog.mode === "add" &&
              nodes.value.some((node) => node.id === value.trim())
            ) {
              callback(new Error(t("struct.nodeIdExists")));
            } else {
              callback();
            }
          },
          trigger: "blur",
        },
      ],
      label: [{
        validator: (_rule, value, callback) => {
          value?.trim()
            ? callback()
            : callback(new Error(t("struct.nodeNameRequired")));
        },
        trigger: "blur",
      }],
    }));

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
    const openNodeDialog = () => {
      nodeDialog.mode = selectedNode.value ? "edit" : "add";
      const form = selectedNode.value
        ? {
            id: selectedNode.value.id,
            label: selectedNode.value.data?.label || selectedNode.value.id,
            data: Object.entries(selectedNode.value.data || {})
              .filter(([key]) => key !== "label")
              .map(([key, value]) => ({ key, value: value ?? "" })),
          }
        : createNodeForm();
      Object.assign(nodeDialog.form, form);
      nodeDialog.visible = true;
    };
    const addDataField = () => nodeDialog.form.data.push({ key: "", value: "" });
    const removeDataField = (index) => nodeDialog.form.data.splice(index, 1);
    const confirmAddNode = async () => {
      if (!nodeFormRef.value) return;
      try {
        await nodeFormRef.value.validate();
      } catch {
        return;
      }
      const dataRows = nodeDialog.form.data.filter((item) => item.key?.trim() || item.value !== "");
      if (dataRows.some((item) => !item.key?.trim())) {
        return ElMessage.error(t("struct.dataKeyRequired"));
      }
      const dataKeys = dataRows.map((item) => item.key.trim());
      if (dataKeys.includes("label")) {
        return ElMessage.error(t("struct.dataKeyReserved"));
      }
      if (new Set(dataKeys).size !== dataKeys.length) {
        return ElMessage.error(t("struct.dataKeyDuplicate"));
      }
      const customData = Object.fromEntries(
        dataRows.map((item) => [item.key.trim(), item.value])
      );
      const nodeData = {
        label: nodeDialog.form.label.trim(),
        ...customData,
      };
      if (nodeDialog.mode === "edit") {
        nodes.value = nodes.value.map((node) =>
          node.id === selectedNodeId.value ? { ...node, data: nodeData } : node
        );
      } else {
        const index = nodes.value.length;
        nodes.value = [...nodes.value, {
          id: nodeDialog.form.id.trim(),
          type: "product",
          position: { x: 80 + (index % 4) * 260, y: 80 + Math.floor(index / 4) * 170 },
          data: nodeData,
        }];
      }
      selectedNodeId.value = nodeDialog.form.id.trim();
      nodeDialog.visible = false;
    };
    const deleteNode = async () => {
      if (!selectedNodeId.value) return;
      const id = selectedNodeId.value;
      try {
        await ElMessageBox.confirm(
          t("struct.deleteNodeConfirm", { count: selectedRows.value.length }),
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
      for (const row of [...selectedRows.value]) {
        emit("assignChild", row, null);
      }
      nodes.value = nodes.value.filter((node) => node.id !== id);
      edges.value = edges.value.filter((edge) => edge.source !== id && edge.target !== id);
      unassignedSelection.value = [];
      selectedNodeId.value = null;
    };
    const connectNode = (connection) => {
      if (
        !SOURCE_HANDLES.has(connection.sourceHandle) ||
        !TARGET_HANDLES.has(connection.targetHandle)
      ) return;
      edges.value = [...edges.value, {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: "default",
      }];
    };
    const clearSelectedRows = () => {
      selectedSelection.value = [];
      selectedTableRef.value?.clearSelection();
    };
    const selectNode = ({ node }) => {
      clearSelectedRows();
      selectedNodeId.value = node.id;
    };
    const clearSelection = () => {
      clearSelectedRows();
      selectedNodeId.value = null;
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
      clearSelectedRows();
    };

    onMounted(initPage);

    return {
      Connection, Cpu, Delete, Edit, Plus, UserFilled, ConnectionMode, FlowPosition,
      nodes, edges, loading, selectedNodeId, selectedNode, selectedRows,
      selectedTableRef, selectedSelection,
      unassignedRows, unassignedSelection, unassignedTableRef,
      nodeDataEntries, nodeDialog, nodeFormRef, nodeRules,
      initPage, openNodeDialog, addDataField, removeDataField, confirmAddNode, deleteNode,
      connectNode, selectNode, clearSelection, addDevice,
      handleUnassignedSelection, bindSelected, handleSelectedSelection, confirmUnbind,
    };
  },
});
</script>

<style>
@import "@vue-flow/core/dist/style.css";
@import "@vue-flow/core/dist/theme-default.css";
@import "@vue-flow/controls/dist/style.css";
</style>

<style scoped>
.node-layout {
  display: grid;
  grid-template-columns: minmax(520px, 1fr) minmax(300px, 380px);
  grid-template-rows: minmax(360px, 1fr) minmax(220px, 0.55fr);
  gap: 12px;
  height: 100%;
  min-height: 640px;
  padding: 8px;
  box-sizing: border-box;
}
.flow-panel, .node-devices, .unassigned-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}
.flow-panel { grid-row: 1 / 3; }
.flow-toolbar, .panel-header {
  min-height: 48px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-light);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.device-flow { flex: 1; background: #fafbfc; }
.product-node {
  width: 220px;
  height: 132px;
  padding: 12px 14px;
  box-sizing: border-box;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}
.product-node.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
}
.product-node__header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);
}
.product-node__header strong,
.product-node__data-key,
.product-node__data-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-node__header strong { flex: 1; }
.product-node__data {
  margin-top: 8px;
  display: grid;
  gap: 4px;
}
.product-node__data-row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 8px;
  font-size: 12px;
}
.product-node__data-key {
  color: var(--el-text-color-secondary);
}
.product-node__data-value {
  color: var(--el-text-color-primary);
  text-align: right;
}
.product-node__more {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  text-align: right;
}
.data-editor {
  display: grid;
  gap: 10px;
  max-height: 260px;
  overflow-y: auto;
  padding-right: 2px;
}
.data-editor__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) 32px;
  gap: 8px;
  align-items: center;
}
.flow-handle {
  width: 2px;
  height: 2px;
  min-width: 2px;
  min-height: 2px;
  border: 0;
  background: transparent;
}
.flow-handle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border: 2px solid var(--el-bg-color);
  border-radius: 50%;
  background: var(--el-color-primary);
  transform: translate(-50%, -50%);
}
.node-devices :deep(.el-table), .unassigned-panel :deep(.el-table) { flex: 1; }
@media (max-width: 1100px) {
  .node-layout { grid-template-columns: 1fr; grid-template-rows: 520px 280px 280px; }
  .flow-panel { grid-row: auto; }
}
</style>
