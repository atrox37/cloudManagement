<script>
  import { ref } from 'vue'
  import LogicFlow from '@logicflow/core'
  import '@logicflow/core/dist/style/index.css'
  import NodeRedExtension from '@/components/nodeRed/index.js'
  import FlowSetting from '@/components/nodeRed/tools/FlowSetting.vue'

  import './style/style.css'
  export default {
    components:{FlowSetting},
    setup() {
      const windowInfo = ref({})
      const count = ref(0)
      const currentNode = ref({})
      return {
        windowInfo,
        count,
        currentNode
      }
    },
    mounted() {
      console.log("aaa")
      window.addEventListener('resize', this.resizeChart);
      const addView=document.createElement('span')
      addView.innerText='add'
      this.lf = new LogicFlow({
        container: this.$refs.container,
        grid: {
          visible: true,
          type: 'mesh',
          size: 10,
          config: {
            color: '#eeeeee'
          }
        },
        // adjustEdge: false,
        hoverOutline: false,
        edgeSelectedOutline: false,
        keyboard: {
          enabled: true,
        },
        // keyboard: true,
        plugins: [
          NodeRedExtension
        ]
      })
      this.lf.render({
        nodes: [],
        edges: []
      })
      this.lf.on('node-red:start', () => {
        // todo: 让流程跑起来
        console.log('我要开始执行流程了')
      })
      this.lf.on('vue-node:click', (data) => {
        this.lf.setProperties(data.id, {
          t: ++data.val
        })
      })
      this.lf.on('node:click', ({ data }) => {
        this.currentNode = data
      })
      this.lf.on('blank:click', ({ data }) => {
        this.currentNode = null
      })
      this.lf.on('edge:mouseenter',({data,e})=>{
        console.log('进入边')

      })
      this.lf.on('edge:mouseleave',({data,e})=>{
        console.log('离开边')
      })
    },
    methods: {
      resizeChart(){
        this.windowInfo.value = {
          width: window.innerWidth,
          hight: window.innerHeight
        }
        console.log(this.windowInfo.value);
        this.lf.resize(window.innerWidth,window.innerHeight)
      },
      saveFlow(){
        var data = this.lf.getGraphRawData();
        console.log(JSON.stringify(data))
      },
      addFetchNode(){
        console.log('addFetchNode->width:'+this.lf.graphModel.width+' height:'+this.lf.graphModel.height)

        this.lf.addNode({id:'12',type:'fetch-node',x:this.lf.graphModel.width/10,y:this.lf.graphModel.height/10,text:'aaa',zIndex:0,rotate:0,properties:{addr:'1231'}})
      },
      changeStyle (style) {
        this.lf.setProperties(this.currentNode.id, {
          style
        })
      }
    }
  }
</script>

<template>
  <div class="flow-chart">
    <div ref="container" class="container"></div>
    <FlowSetting @changeStyle="changeStyle" @addFetchNode="addFetchNode" @saveFlow="saveFlow" :nodeData="currentNode" class="setting-conatiner"></FlowSetting>
  </div>
</template>

<style scoped>
  .container {
    width: 100%;
    height: 100%;
  }
  .flow-chart {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .flow-chart /deep/ .lf-red-node, .flow-chart /deep/ .lf-element-text {
    cursor: move;
  }
  .flow-chart /deep/ svg {
    display: block;
  }
  .flow-chart-palette {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
  }
  .setting-conatiner {
    width: 10%;
    height: auto;
    position: absolute;
    top: 0;
    right: 0;
  }
</style>