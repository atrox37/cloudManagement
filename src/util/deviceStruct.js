export const STRUCT_TREE = "tree";
export const STRUCT_NODE = "node";

const createStruct = (type) => {
  if (type === STRUCT_NODE) {
    return { type: STRUCT_NODE, node: { nodes: [], edges: [] } };
  }
  return { type: STRUCT_TREE, tree: [] };
};

export const ensureMetadataStruct = (metadata, fallbackType = STRUCT_TREE) => {
  if (!metadata) return null;

  if (!metadata.struct || ![STRUCT_TREE, STRUCT_NODE].includes(metadata.struct.type)) {
    const legacyTrees = Array.isArray(metadata.trees) ? metadata.trees : [];
    metadata.struct = { type: fallbackType, tree: legacyTrees };
  }

  if (metadata.struct.type === STRUCT_TREE) {
    metadata.struct.tree = Array.isArray(metadata.struct.tree)
      ? metadata.struct.tree
      : [];
  } else {
    metadata.struct.node = metadata.struct.node || {};
    metadata.struct.node.nodes = Array.isArray(metadata.struct.node.nodes)
      ? metadata.struct.node.nodes
      : [];
    metadata.struct.node.edges = Array.isArray(metadata.struct.node.edges)
      ? metadata.struct.node.edges
      : [];
    metadata.struct.node.nodes.forEach((node) => {
      if (!node) return;
      node.data = node.data || {};
      if (!node.data.label) node.data.label = node.id || "Node";
    });
  }

  delete metadata.trees;
  return metadata.struct;
};

export const changeMetadataStructType = (metadata, type) => {
  if (!metadata || ![STRUCT_TREE, STRUCT_NODE].includes(type)) return;
  const current = ensureMetadataStruct(metadata);
  if (current?.type !== type) metadata.struct = createStruct(type);
};
