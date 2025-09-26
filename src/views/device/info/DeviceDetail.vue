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
      <el-descriptions-item label="采集网关">{{ data.gatewayPo.name }}</el-descriptions-item>
      <el-descriptions-item label="采集方式">
        <el-tag size="small">{{ data.networkConfigPo.type }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ data.deviceInstancePo.createTime }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ data.deviceInstancePo.updateTime }}</el-descriptions-item>
    </el-descriptions>
    <el-descriptions v-if="copyTags.length>0" border title="设备标签" style="margin-top: 30px">
      <template #extra>
        <el-button style="margin-top: 5px" @click="saveClick">保存</el-button>
      </template>
      <el-descriptions-item v-for="(item,index) in copyTags" :label="item.tagName">
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
    deviceTags: {
      type: Array,
      requestd: false,
      default: () => {
        [];
      }
    }
  },
  emits: ["tagSave","detailSave"],
  setup(props, context) {
    const {proxy} = getCurrentInstance()
    const pt = toRef(productType);
    const data = toRef(props, "deviceData");
    const tags = props.deviceTags;
    const copyTags=reactive([])
    const networkConfiguration = ref(data.value.networkConfigPo);
    const dimensionTree = ref([]);
    const dimensionAllTree = computed(() => {
      const rootTree=[]
      rootTree.push(...dimensionTree.value);
      return rootTree
    });
    watch(data, (o, n) => {
      console.info("detail");
    });
    watch(tags, value => {
      copyTags.length=0
      copyTags.push(...JSON.parse(JSON.stringify(value)))
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
    const saveClick=()=>{
      context.emit("tagSave",copyTags);
    }
    onMounted(() => {
      copyTags.length=0
      copyTags.push(...JSON.parse(JSON.stringify(tags)))
      requestDimensionApi()
      console.info("deviceDetail");
    });
    const editClick = () => {
      context.emit("detailSave",data.value.deviceInstancePo);
    };
    return {
      dimensionAllTree,
      copyTags,
      type,
      data,
      networkConfiguration,
      editClick,
      saveClick
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
