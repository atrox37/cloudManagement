import { createApp } from "vue";
import FetchNode from "@/components/nodeRed/nodes/FetchNode.js";
import FlowLink from "@/components/nodeRed/FlowLink.js";
import Palette from '@/components/nodeRed/tools/Palette.vue';

class NodeRedExtension {
  static pluginName = 'NodeRedExtension'
  constructor ({ lf }) {
    lf.register(FlowLink);
    lf.register(FetchNode);
    lf.setDefaultEdgeType('flow-link');
    this.app = createApp(Palette, {
      lf
    })
  }
  render(lf, domOverlay) {
    const node = document.createElement('div')
    node.className = 'node-red-palette'
    domOverlay.appendChild(node)
    this.app.mount(node)
  }
}
export default NodeRedExtension