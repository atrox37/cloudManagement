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
        </el-space>
      </header>

      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        class="product-flow"
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
            <Handle id="top" type="source" :position="FlowPosition.Top" class="flow-handle" />
            <Handle id="right" type="source" :position="FlowPosition.Right" class="flow-handle" />
            <Handle id="bottom" type="source" :position="FlowPosition.Bottom" class="flow-handle" />
            <Handle id="left" type="source" :position="FlowPosition.Left" class="flow-handle" />

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
        <div v-for="(item, index) in nodeDialog.form.data" :key="index" class="data-editor__row">
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
      <el-button type="primary" @click="confirmNode">{{ $t("common.confirm") }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { computed, defineComponent, reactive, ref, toRef } from "vue";
import { Cpu, Delete, Edit, Plus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";
import { ConnectionMode, Handle, Position as FlowPosition, VueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";

const HANDLES = new Set(["top", "right", "bottom", "left"]);

export default defineComponent({
  name: "TabProductNode",
  components: { VueFlow, Background, Controls, Handle, Cpu },
  props: {
    productData: { type: Object, required: true },
  },
  setup(props) {
    const { t } = useI18n();
    const product = toRef(props, "productData");
    const nodeFormRef = ref(null);
    const selectedNodeId = ref(null);
    const graph = computed(() => product.value.metadata.struct.node);
    const nodes = computed({
      get: () => graph.value.nodes,
      set: (value) => { graph.value.nodes = value; },
    });
    const edges = computed({
      get: () => graph.value.edges,
      set: (value) => { graph.value.edges = value; },
    });
    const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value));
    const createForm = () => ({ id: "", label: "", data: [{ key: "", value: "" }] });
    const nodeDialog = reactive({ visible: false, mode: "add", form: createForm() });

    const formatValue = (value) => {
      if (typeof value === "string") return value;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    };
    const nodeDataEntries = (data) => Object.entries(data || {})
      .filter(([key, value]) => key !== "label" && value !== null && value !== "")
      .map(([key, value]) => ({ key, displayValue: formatValue(value) }));
    const nodeRules = computed(() => ({
      id: [{
        validator: (_rule, value, callback) => {
          const id = value?.trim();
          if (!id) callback(new Error(t("struct.nodeIdRequired")));
          else if (nodeDialog.mode === "add" && nodes.value.some((node) => node.id === id)) {
            callback(new Error(t("struct.nodeIdExists")));
          } else callback();
        },
        trigger: "blur",
      }],
      label: [{ required: true, whitespace: true, message: t("struct.nodeNameRequired"), trigger: "blur" }],
    }));

    const openNodeDialog = () => {
      nodeDialog.mode = selectedNode.value ? "edit" : "add";
      nodeDialog.form = selectedNode.value
        ? {
            id: selectedNode.value.id,
            label: selectedNode.value.data?.label || selectedNode.value.id,
            data: Object.entries(selectedNode.value.data || {})
              .filter(([key]) => key !== "label")
              .map(([key, value]) => ({ key, value: value ?? "" })),
          }
        : createForm();
      nodeDialog.visible = true;
    };
    const addDataField = () => nodeDialog.form.data.push({ key: "", value: "" });
    const removeDataField = (index) => nodeDialog.form.data.splice(index, 1);
    const confirmNode = async () => {
      try {
        await nodeFormRef.value.validate();
      } catch {
        return;
      }
      const dataRows = nodeDialog.form.data.filter((item) => item.key?.trim() || item.value !== "");
      if (dataRows.some((item) => !item.key?.trim())) return ElMessage.error(t("struct.dataKeyRequired"));
      const keys = dataRows.map((item) => item.key.trim());
      if (keys.includes("label")) return ElMessage.error(t("struct.dataKeyReserved"));
      if (new Set(keys).size !== keys.length) return ElMessage.error(t("struct.dataKeyDuplicate"));

      const data = {
        label: nodeDialog.form.label.trim(),
        ...Object.fromEntries(dataRows.map((item) => [item.key.trim(), item.value])),
      };
      if (nodeDialog.mode === "edit") {
        nodes.value = nodes.value.map((node) =>
          node.id === selectedNodeId.value ? { ...node, data } : node
        );
      } else {
        const index = nodes.value.length;
        nodes.value = [...nodes.value, {
          id: nodeDialog.form.id.trim(),
          type: "product",
          position: { x: 80 + (index % 4) * 260, y: 80 + Math.floor(index / 4) * 170 },
          data,
        }];
      }
      selectedNodeId.value = nodeDialog.form.id.trim();
      nodeDialog.visible = false;
    };
    const deleteNode = async () => {
      if (!selectedNodeId.value) return;
      const node = selectedNode.value;
      try {
        await ElMessageBox.confirm(
          t("struct.deleteProductNodeConfirm", { name: node.data?.label || node.id }),
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
      const id = selectedNodeId.value;
      nodes.value = nodes.value.filter((item) => item.id !== id);
      edges.value = edges.value.filter((edge) => edge.source !== id && edge.target !== id);
      selectedNodeId.value = null;
    };
    const connectNode = (connection) => {
      if (!HANDLES.has(connection.sourceHandle) || !HANDLES.has(connection.targetHandle)) return;
      edges.value = [...edges.value, {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: "default",
      }];
    };
    const selectNode = ({ node }) => { selectedNodeId.value = node.id; };
    const clearSelection = () => { selectedNodeId.value = null; };

    return {
      Cpu, Delete, Edit, Plus, ConnectionMode, FlowPosition,
      nodes, edges, selectedNodeId, nodeDialog, nodeFormRef, nodeRules,
      nodeDataEntries, openNodeDialog, addDataField, removeDataField,
      confirmNode, deleteNode, connectNode, selectNode, clearSelection,
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
.node-layout { height: 100%; min-height: 640px; padding: 8px; box-sizing: border-box; }
.flow-panel {
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}
.flow-toolbar {
  min-height: 48px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
}
.product-flow { flex: 1; background: #fafbfc; }
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
.product-node__header { display: flex; align-items: center; gap: 8px; color: var(--el-text-color-primary); }
.product-node__header strong,
.product-node__data-key,
.product-node__data-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-node__header strong { flex: 1; }
.product-node__data { margin-top: 8px; display: grid; gap: 4px; }
.product-node__data-row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 8px;
  font-size: 12px;
}
.product-node__data-key { color: var(--el-text-color-secondary); }
.product-node__data-value { color: var(--el-text-color-primary); text-align: right; }
.product-node__more { color: var(--el-text-color-placeholder); font-size: 11px; text-align: right; }
.data-editor { display: grid; gap: 10px; max-height: 260px; overflow-y: auto; padding-right: 2px; }
.data-editor__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) 32px;
  gap: 8px;
  align-items: center;
}
.flow-handle { width: 2px; height: 2px; min-width: 2px; min-height: 2px; border: 0; background: transparent; }
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
</style>
