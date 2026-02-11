<template>
  <div class="tab-pan-content">
    <el-descriptions :column="3" border>
      <template #title>
        <span>{{ data.deviceInstancePo.name }}</span>
      </template>
      <template #extra>
        <el-button type="primary" @click="editClick" style="margin-top: 5px" >保存</el-button>
      </template>
      <el-descriptions-item label="设备名称">
        <el-input v-model="data.deviceInstancePo.name"></el-input>
      </el-descriptions-item>
      <el-descriptions-item label="设备SN">
        <el-input v-model="data.deviceInstancePo.sn"></el-input>
      </el-descriptions-item>
      <el-descriptions-item label="所属机构">
        <el-tree-select
          style="width: 220px;"
          v-model="data.deviceInstancePo.orgId"
          :data="dimensionAllTree"
          check-strictly
          :render-after-expand="false">
          <template #empty>
            <el-empty description="暂无数据"/>
          </template>
        </el-tree-select>
      </el-descriptions-item>
      <el-descriptions-item label="产品名称">{{ data.productPo.name }}</el-descriptions-item>
      <el-descriptions-item label="产品类型">
        <el-tag>{{ type }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="所属人">{{ data.sysUserPo.username }}</el-descriptions-item>
      <el-descriptions-item label="网关设备" v-if="data.productPo.type=='children'">{{ parentName }}</el-descriptions-item>
      <el-descriptions-item label="采集网关">{{ data.gatewayPo.name }}</el-descriptions-item>
      <el-descriptions-item label="采集方式">
        <el-tag size="small">{{ data.networkConfigPo.type }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ data.deviceInstancePo.createTime }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ data.deviceInstancePo.updateTime }}</el-descriptions-item>
    </el-descriptions>
    <el-descriptions v-if="data.deviceInstancePo.metadata.tags.length>0" border title="设备标签" style="margin-top: 30px">
      <el-descriptions-item v-for="(item,index) in data.deviceInstancePo.metadata.tags" :key="index" :label="item.tagName">
        <el-input v-model="item.tagValue"></el-input>
      </el-descriptions-item>
    </el-descriptions>
  </div>

</template>

<script>
import { defineComponent, toRef, ref, watch, onMounted, computed, reactive, getCurrentInstance } from "vue";
import { productType } from "@/model/product/ProductType";
import handlerDimensionTree from "@/util/dimension/DimensionTree";

export default defineComponent({
  name: "DeviceDetail",
  props: {
    deviceData: {
      type: Object,
      required: false
    },
    parentData:{
      type: Object,
      required: false
    }
  },
  emits: ["tagSave","detailSave"],
  setup(props, context) {
    const {proxy} = getCurrentInstance()
    const pt = toRef(productType);
    const data = toRef(props, "deviceData");
    const parent=toRef(props,'parentData');
    const networkConfiguration = ref(data.value.networkConfigPo);
    const dimensionTree = ref([]);
    const dimensionAllTree = computed(() => {
      const rootTree=[]
      rootTree.push(...dimensionTree.value);
      return rootTree
    });
    const parentName = computed(()=>{
      if(parent.value == null){
        return "无"
      }else {
        return parent.value.deviceInstancePo.name
      }
    })
    watch(data, (o, n) => {
      console.info("detail");
    });
    const type = computed(() => {
      var v = "";
      for (var i of pt.value) {
        if (i.type == data.value.productPo.type) {
          v = i.name;
          break;
        }
      }
      return v;
    });
    const requestDimensionApi = () => {
      proxy.$http.dimensionTree().then(value => {
        var tree = {};
        dimensionTree.value.length = 0;
        handlerDimensionTree(value.data, tree);
        dimensionTree.value.push(tree);
        console.log("requestDimensionApi");
      });
    };
    onMounted(() => {
      requestDimensionApi()
      console.info("deviceDetail");
    });
    const editClick = () => {
      console.log('editClick:'+JSON.stringify(data.value.deviceInstancePo.metadata.tags))
      context.emit("detailSave",data.value.deviceInstancePo);
    };
    return {
      dimensionAllTree,
      type,
      data,
      networkConfiguration,
      editClick,
      parent,
      parentName
    };
  }
});
</script>

<style scoped>
@import url('../style/tab-content.css');

.form-title {
  margin: 10px;
}

.el-descriptions {
  background: #FFFFFF;
}
</style>
