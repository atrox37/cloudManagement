<template>
  <div class="tab-pan-content">
    <el-descriptions :column="3" border v-if="copyData!=null">
      <template #title>
        <span>{{ copyData.productPo.name }}</span>
      </template>
      <template #extra>
        <el-button type="primary" size="small" class="form-title" @click="editClick">
          <el-icon>
            <Edit />
          </el-icon>
        </el-button>
      </template>
      <el-descriptions-item label="名称">
        <el-input v-model="copyData.productPo.name"></el-input>
      </el-descriptions-item>
      <el-descriptions-item label="类型">
        <el-tag v-if="copyData.productPo.type == 'gateway'">网关</el-tag>
        <el-tag v-if="copyData.productPo.type == 'children'">子设备</el-tag>
        <el-tag v-if="copyData.productPo.type == 'device'">直联设备</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="产品型号">
        <el-input v-model="copyData.productPo.sn"></el-input>
      </el-descriptions-item>
      <el-descriptions-item label="创建人">{{ copyData.sysUserPo.username }}</el-descriptions-item>
      <el-descriptions-item label="所属机构">
        <el-tree-select
          style="width: 220px;"
          v-model="copyData.productPo.orgId"
          :data="dimensionAllTree"
          check-strictly
          :render-after-expand="false">
          <template #empty>
            <el-empty description="暂无数据"/>
          </template>
        </el-tree-select>
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ copyData.productPo.updateTime }}</el-descriptions-item>
      <el-descriptions-item label="标签">
        <el-space wrap>
          <el-tag closable v-for="(item,index) in copyData.productPo.metadata.tags" @close="tagClose(index)"
                  @click="tagClick(index)">{{ item.name }}
          </el-tag>
          <el-button size="small" @click="addTag">+ New Tag</el-button>
        </el-space>
      </el-descriptions-item>
    </el-descriptions>
  </div>
  <el-dialog v-model="tagDialog.status" title="标签">
    <el-form ref="tagForm" :model="tagDialog.tag" label-width="80px" :rules="rules" status-icon>
      <el-form-item label="标签key" prop="tagkey">
        <el-input v-model="tagDialog.tag.key" placeholder="请输入英文key" />
      </el-form-item>
      <el-form-item label="标签名" prop="tagname">
        <el-input v-model="tagDialog.tag.name" placeholder="请输入标签名" />
      </el-form-item>
      <el-form-item label="是否必填">
        <el-radio-group v-model="tagDialog.tag.optional">
          <el-radio :value="true" size="large">是</el-radio>
          <el-radio :value="false" size="large">否</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="tagSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script>
import {
  computed,
  defineComponent,
  ref,
  nextTick,
  onMounted,
  getCurrentInstance,
  onBeforeUnmount,
  toRef,
  watch, reactive
} from "vue";
import handlerDimensionTree from "@/util/dimension/DimensionTree";

export default defineComponent({
  name: "TabProductDetail",
  props: {
    productData: {
      type: Object,
      required: false
    }
  },
  emits: ["dialogClick","submit"],
  setup(props, context) {
    const {proxy} = getCurrentInstance()
    const tagDialog = reactive({ status: false, index: -1, tag: { key: "", name: "", value: "", optional: false } });
    const dimensionTree = ref([]);
    const dimensionAllTree = computed(() => {
      const rootTree=[]
      rootTree.push(...dimensionTree.value);
      return rootTree
    });
    const tagForm = ref(null);

    const data = toRef(props, "productData");
    let copyData = ref(null);
    computed(data.value, (value) => {
      initData();
    });
    const validateSelect = (rule, value, callback) => {
      console.log("validateSelect:" + rule.field);
      if (rule.field == "tagkey") {
        if (tagDialog.tag.key == undefined || tagDialog.tag.key == "") {
          callback(("标签key不能为空"));
        } else {
          var exit = false;
          for (var item of copyData.value.productPo.metadata.tags) {
            if (item.key == tagDialog.tag.key) {
              exit = true;
              break;
            }
          }
          if (exit) {
            callback(("标签key存在重复，请重新输入"));
          } else {
            callback();
          }
        }
      } else if (rule.field == "tagname") {
        if (tagDialog.tag.key == undefined || tagDialog.tag.key == "") {
          callback(("标签名不能为空"));
        } else {
          callback();
        }
      }
    };
    const requestDimensionApi = () => {
      proxy.$http.dimensionTree().then(value => {
        var tree = {};
        dimensionTree.value.length = 0;
        handlerDimensionTree(value.data, tree);
        dimensionTree.value.push(tree);
        console.log("requestDimensionApi");
      });
    };

    const rules = ref({
      tagkey: [{ validator: validateSelect, trigger: "blur" }],
      tagname: [{ validator: validateSelect, trigger: "blur" }]
    });
    const initData = () => {
      copyData.value = JSON.parse(JSON.stringify(data.value));
    };
    const editClick = () => {
      context.emit("submit",copyData.value.productPo);
    };
    const addTag = () => {
      console.log("addTag");
      tagDialog.index = -1;
      tagDialog.tag = { key: "", name: "", value: "", optional: false };
      tagDialog.status = true;
    };
    const tagClose = (index) => {
      console.log(index);
      copyData.value.productPo.metadata.tags.splice(index, 1);
    };
    const tagClick = (index) => {
      console.log(index);
      tagDialog.index = index;
      tagDialog.tag = copyData.value.productPo.metadata.tags[index];
      tagDialog.status = true;
    };


    const tagSave = () => {
      console.log("tagSave");
      tagForm.value.validate((valid, fields) => {
        if (valid) {
          console.log("submit!:");
          tagDialog.status = false;
          if (tagDialog.index < 0) copyData.value.productPo.metadata.tags.push(tagDialog.tag);
          if (tagDialog.index >= 0) copyData.value.productPo.metadata.tags[index] = tagDialog.tag;
        } else {
          console.log("error submit!", fields);
        }
      });
    };

    onMounted(() => {
      initData();
      requestDimensionApi()
    });
    return { dimensionAllTree, tagForm, rules, tagDialog, copyData, editClick, tagSave, tagClick, addTag, tagClose };
  }
});
</script>

<style scoped>
@import url('style/index.scss');
</style>