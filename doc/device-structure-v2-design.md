# 设备 Tree / Node 结构编辑与统一保存设计

## 1. 文档目的

本文用于前端 v2 版本实现网关设备的结构编辑页面，覆盖 Tree、Node、子设备绑定/解绑、结构类型切换和统一保存。实现时应以本文的数据契约和交互时序为准，可重新组织组件和样式，不要求复制 v1 的组件代码。

核心原则：页面中的编辑、绑定和解绑均为本地草稿操作，只有设备详情右上角的“保存”按钮可以向后端提交数据。

## 2. 适用范围

- 只有产品类型为 `gateway` 的产品和设备可以设置结构类型。
- 网关产品：`tree` 时显示产品 Tree 编辑器；`node` 时不显示产品结构编辑器。
- 网关设备：`tree` 时显示设备 Tree 页面；`node` 时显示设备 Node 页面。
- 普通设备和子设备不显示结构类型选择及 Tree/Node 编辑页面。

## 3. Metadata 数据契约

### 3.1 Tree 结构

```json
{
  "struct": {
    "type": "tree",
    "tree": [
      {
        "id": "root",
        "name": "主节点",
        "children": [
          {
            "id": "branch-1",
            "name": "分支一",
            "children": []
          }
        ]
      }
    ]
  }
}
```

约束：

- `struct.type` 必须为 `tree`。
- `struct.tree` 必须为数组，空结构使用 `[]`。
- 每个节点至少包含 `id`、`name`、`children`。
- 节点 `id` 在整棵树中必须唯一。
- 子设备的 `treeNode` 保存 Tree 节点的 `id`。

### 3.2 Node 结构

Node 数据直接兼容 Vue Flow。

```json
{
  "struct": {
    "type": "node",
    "node": {
      "nodes": [
        {
          "id": "inverter-1",
          "type": "product",
          "position": { "x": 120, "y": 80 },
          "data": {
            "label": "主逆变器",
            "productName": "Hybrid_Inverter",
            "voltage": "220V"
          }
        }
      ],
      "edges": [
        {
          "id": "edge-1",
          "type": "default",
          "source": "inverter-1",
          "target": "load-1",
          "sourceHandle": "right",
          "targetHandle": "left"
        }
      ]
    }
  }
}
```

约束：

- `struct.type` 必须为 `node`。
- `struct.node.nodes` 和 `struct.node.edges` 必须为数组。
- Node 的 `id` 在当前画布内必须唯一；该值也是子设备的 `treeNode`。
- Node ID 同时被 Edge 的 `source`、`target` 引用，创建后不允许直接修改。
- `data.label` 是保留字段，表示节点名称。
- `data` 的其他内容由用户以 Key/Value 维护；Key 不能为空、不能重复，也不能使用 `label`。
- Node 四个方向各只有一个连接点，Handle ID 为 `top`、`right`、`bottom`、`left`。
- Vue Flow 使用 `ConnectionMode.Loose`，同一 Handle 可以作为连线起点或终点。
- Edge 的 `sourceHandle` 和 `targetHandle` 只能使用上述四个 Handle ID。

### 3.3 旧数据兼容

加载设备后应先规范化 metadata：

- 没有合法 `metadata.struct` 时，将旧的 `metadata.trees` 转为 `{ type: "tree", tree: metadata.trees }`。
- Tree 缺少数组时补 `tree: []`。
- Node 缺少对象或数组时补 `node: { nodes: [], edges: [] }`。
- Node 缺少 `data.label` 时使用 Node ID 作为显示名称。
- 规范化后删除旧字段 `metadata.trees`。

## 4. 页面总体设计

设备详情维护两份数据：

- `deviceData`：服务端返回的原始详情，用于产品类型、网关 ID 等稳定信息。
- `deviceDraft`：深拷贝后的可编辑设备草稿，所有 metadata 和基础信息编辑写入此对象。

子设备关联变更单独维护：

- `pendingChildBinding`：待提交的绑定/解绑数据，按设备 ID 去重，后一次操作覆盖前一次操作。
- `pendingChildRows`：本次从“添加子设备”弹窗选入、服务端当前列表中尚不存在的设备详情，用于保存前即时渲染。

结构组件根据 `deviceDraft.metadata.struct.type` 动态选择：

```text
tree -> DeviceTree
node -> DeviceNode
```

## 5. 结构类型切换

切换结构类型时立即替换本地 `struct`：

```text
tree -> node: { type: "node", node: { nodes: [], edges: [] } }
node -> tree: { type: "tree", tree: [] }
```

注意事项：

- 切换不会立即调用接口。
- 切换会清空原类型的结构草稿，切回时不会自动恢复。
- 已关联子设备不会自动解绑，`parentId` 和原 `treeNode` 保持不变。
- 新结构中不存在原 `treeNode` 时，子设备应显示在“未绑定节点”列表，等待用户重新分配。
- 点击右上角“保存”后，新的 `struct.type` 和对应结构才提交到后端。

## 6. Tree 页面设计

### 6.1 布局

- 左侧为自适应宽度的“结构分路”，占满页面纵向空间。
- 右侧为固定范围宽度的两块列表，上方“节点设备”，下方“未绑定节点”。
- 未选择节点时标题显示“节点设备”；选择后显示“节点设备: {节点名称}”。
- 小屏幕下改为“结构分路、节点设备、未绑定节点”纵向排列。

### 6.2 Tree 编辑

- 支持新增根节点、新增子节点、重命名和删除节点。
- 所有操作直接修改 `deviceDraft.metadata.struct.tree`，不调用接口。
- 删除节点后，原来指向已删除节点的设备因找不到有效节点 ID，自动出现在“未绑定节点”。

### 6.3 节点设备

- 选择 Tree 节点后，列出 `device.treeNode === selectedNodeId` 的所有子设备。
- 列表支持多选。
- 选中设备后，列表标题栏右侧显示“解绑”按钮。
- 点击“解绑”先弹出确认框，确认后写入解绑草稿并从当前列表移除。
- 确认解绑不调用接口、不显示操作成功提示。

解绑草稿：

```json
{
  "id": 101,
  "parentId": null,
  "treeNode": null
}
```

### 6.4 未绑定节点

满足以下任一条件的已关联子设备显示在此列表：

- `treeNode` 为空。
- `treeNode` 在当前 `struct.tree` 的全部节点 ID 中不存在。

列表支持多选。用户先选择 Tree 节点，再勾选设备并点击“绑定”，前端写入绑定草稿并刷新列表，不调用接口、不显示操作成功提示。

## 7. Node 页面设计

### 7.1 Vue Flow 画布

- 使用 `@vue-flow/core`、`@vue-flow/background`、`@vue-flow/controls`。
- 画布直接读取和修改 `struct.node.nodes/edges`。
- 节点支持拖动，位置写回 `position.x/y`。
- 节点四边各渲染一个 Handle，连接线必须准确落在对应连接点中心。
- 点击空白区域取消节点选择。

### 7.2 新增与编辑节点

- 未选择节点时，工具栏显示“新增节点”。
- 选择节点后，同一按钮改为“编辑节点”。
- 页面工具栏不额外显示节点名称输入框。
- 新增弹窗包含 Node ID、节点名称和可增删的 Key/Value 数据行。
- 编辑弹窗回填全部信息；Node ID 只读，名称和 Key/Value 可编辑。
- 弹窗确认只修改画布草稿，不调用接口。
- 节点卡片固定尺寸，显示名称及最多三条 Key/Value，超出部分显示剩余数量，长文本省略并提供完整 title。

### 7.3 连线

- 用户从任一方向 Handle 拖动到另一个节点的任一方向 Handle 创建 Edge。
- Edge 保存 `source`、`target`、`sourceHandle`、`targetHandle` 和 `type`。
- 删除节点时同时删除所有以该节点为 `source` 或 `target` 的 Edge。

### 7.4 节点设备与未绑定节点

- 点击 Node 后，节点设备列表显示所有 `device.treeNode === node.id` 的子设备；一个 Node ID 可以对应多台设备。
- 未绑定节点定义为 `treeNode` 为空，或在 `struct.node.nodes[].id` 中找不到对应节点。
- 从“添加设备”弹窗绑定、从未绑定列表批量绑定，都只更新本地草稿。
- 删除 Node 时，该 Node 下设备保留与网关的父子关系，将 `treeNode` 置空后移动到“未绑定节点”。
- Node 页面当前节点设备解绑入口可以按 v2 设计统一为批量确认操作；无论采用单条还是批量，均不得直接提交接口。

## 8. 子设备绑定草稿

### 8.1 绑定到节点

Tree 和 Node 使用同一数据格式：

```json
{
  "id": 101,
  "parentId": 84,
  "treeNode": "inverter-1"
}
```

- `id`：子设备 ID。
- `parentId`：当前网关设备 ID。
- `treeNode`：目标 Tree 节点 ID 或 Node ID。

### 8.2 添加子设备弹窗

- 弹窗只查询尚未绑定父设备的子设备，即产品类型为 children 且 `parent_id IS NULL`。
- 支持多选。
- 点击“确认”后把绑定项合并到 `pendingChildBinding`，把设备详情合并到 `pendingChildRows`，随后关闭弹窗。
- 弹窗“确认”不能调用保存接口，也不显示成功提示。

### 8.3 有效列表计算

页面展示列表由服务端子设备和本地草稿合并得到：

1. 深拷贝服务端当前网关的子设备。
2. 使用 `pendingChildBinding` 覆盖相同设备的 `parentId/treeNode`。
3. 排除草稿中 `parentId === null` 的设备。
4. 加入 `pendingChildRows` 中绑定到当前网关、但服务端列表尚不存在的设备。
5. 根据有效节点 ID 将结果分为“节点设备”和“未绑定节点”。

## 9. 统一保存设计

### 9.1 唯一提交入口

以下操作不得单独调用后端：

- Tree/Node 结构编辑。
- 结构类型切换。
- 添加子设备。
- 绑定到节点。
- 从节点解绑。
- Node 删除后迁移设备。

只有设备详情右上角“保存”按钮调用更新接口。

### 9.2 请求载荷

```json
{
  "device": {
    "id": 84,
    "name": "Station",
    "sn": "station-sn",
    "productId": 10,
    "orgId": 1,
    "gatewayId": 2,
    "parentId": null,
    "treeNode": null,
    "metadata": {
      "properties": [],
      "functions": [],
      "rules": [],
      "tags": [],
      "struct": {
        "type": "node",
        "node": {
          "nodes": [],
          "edges": []
        }
      }
    }
  },
  "ruleChange": [],
  "childBinding": [
    {
      "id": 101,
      "parentId": 84,
      "treeNode": "inverter-1"
    },
    {
      "id": 102,
      "parentId": null,
      "treeNode": null
    }
  ]
}
```

保存前需校验设备名称、SN、产品和采集网关等原有必填字段。请求前应深拷贝 payload，避免请求规范化逻辑污染页面草稿。

### 9.3 保存结果

- 提交期间右上角保存按钮显示 loading，防止重复提交。
- 成功后仅此处显示“操作成功”。
- 成功后清空 `pendingRuleChange`、`pendingChildBinding`、`pendingChildRows`，重新加载设备详情。
- 失败时保留全部草稿，方便修正后重试。
- 添加、绑定、解绑弹窗的确认动作均不显示成功提示。

## 10. 后端约束与联调说明

- 后端 `DeviceRuleReqVo` 要求 `device`、`ruleChange`、`childBinding` 均非空；没有变更时数组必须传 `[]`，不能省略或传 `null`。
- Tree/Node 的结构类型和内部字段必须匹配，否则无法正确反序列化或校验。
- 后端允许一个节点关联多台子设备。
- 切换结构类型时不要求前端自动解绑旧子设备；后端保留关联，前端通过“未绑定节点”提示重新分配。
- 保存过程会调用 register-app 的 Dubbo `DeviceApi` 清理缓存或广播下线。如果提示注册中心没有可用 Provider，应检查 register-app 和 Dubbo/Redis 注册中心，不应误判为前端 payload 错误。
- 不要通过直接修改数据库模拟设备在线状态；该操作不会同步 Redis 设备缓存，可能造成状态判断与数据库不一致。

## 11. 建议的 v2 组件拆分

```text
DeviceInstancePage
├── DeviceBaseForm
├── DeviceStructureSwitcher
└── DeviceStructurePanel
    ├── DeviceTreeEditor
    ├── DeviceNodeEditor
    ├── NodeDeviceList
    ├── UnassignedDeviceList
    └── ChildDevicePicker
```

建议抽取组合式状态模块 `useDeviceStructureDraft`，统一负责：

- metadata 结构规范化。
- 结构类型切换。
- 子设备服务端数据与草稿合并。
- 按设备 ID 对绑定变更执行 upsert。
- 有效节点 ID 集合和未绑定设备计算。
- 统一保存 payload 构建与草稿清理。

Tree 和 Node 组件只负责各自结构编辑和选择状态，不直接持有后端提交逻辑。

## 12. 验收清单

- 网关设备可在 Tree/Node 间切换，页面组件和 `metadata.struct` 同步变化。
- Tree 左侧自适应，右侧节点设备与未绑定设备上下排列。
- Tree 节点新增、重命名、删除不产生网络保存请求。
- Tree 节点设备和未绑定设备均可多选，并可批量解绑/绑定。
- Node 新增和编辑支持自定义 Key/Value，Node ID 唯一且编辑时只读。
- Node 每个方向只有一个连接点，Edge 准确连接到指定 Handle。
- 一个 Tree/Node 节点可显示多台子设备。
- 节点不存在或 `treeNode` 为空的设备进入未绑定列表。
- 删除 Node 后，节点内设备进入未绑定列表，关联 Edge 同时删除。
- 所有弹窗确认和局部操作均不调用更新接口、不显示成功提示。
- 右上角保存只发送一次完整请求，成功后清空草稿并刷新。
- 保存失败时草稿不丢失。
- 桌面和窄屏布局无重叠、无横向内容溢出。

## 13. v1 参考文件

- `src/views/device/DeviceInstance.vue`：草稿状态、动态结构组件、统一保存。
- `src/views/device/info/DeviceTree.vue`：Tree 编辑、批量绑定与解绑、左右布局。
- `src/views/device/info/DeviceNode.vue`：Vue Flow、节点/连线编辑、自定义 data。
- `src/components/device/DialogChildrenAdd.vue`：添加子设备但不直接提交。
- `src/util/deviceStruct.js`：metadata 规范化和结构类型切换。
- `src/views/device/info/DeviceDetail.vue`：设备结构类型选择。
- `src/views/product/tab/TabProductDetail.vue`：产品结构类型选择。
- `src/views/product/tab/TabProductTree.vue`：产品 Tree 编辑。
