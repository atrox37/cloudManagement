<template>
  <el-table :data="notifyD" border>
    <el-table-column label="类型">
      <template #default="scope">
        <el-radio-group v-model="scope.row.handlerType">
          <el-radio-button label="通知" value="notify" />
        </el-radio-group>
      </template>
    </el-table-column>
    <el-table-column label="通知用户(通知)">
      <template #default="scope">
        <el-select
          placeholder="请选择用户"
          v-model="scope.row.userId"
        >
          <el-option
            v-for="item in notifyTemplateUserList"
            :key="item.id"
            :label="item.label"
            :value="item.id"
          ></el-option>
        </el-select>
      </template>
    </el-table-column>
    <el-table-column label="通知模板">
      <template #default="scope">
        <!-- <el-popover placement="top" title="通知模板" :width="350"> -->
        <!-- <template #default>
            <el-descriptions :column="1">
              <el-descriptions-item label="title">{{
                getCurrentTemplate(scope.row.notifyTemplatePo.id, "title")
              }}</el-descriptions-item>
              <el-descriptions-item label="content">{{
                getCurrentTemplate(scope.row.notifyTemplatePo.id, "content")
              }}</el-descriptions-item>
            </el-descriptions>
          </template> -->
        <!-- <template #reference> -->
        <el-select
          v-model="scope.row.templateId"
          @change="(value) => notifyTemplateChange(scope.$index, value)"
        >
          <el-option
            v-for="item in notifyTemplateAndConfig"
            :key="item.templatePo.id"
            :label="item.templatePo.name"
            :value="item.templatePo.id"
          ></el-option>
        </el-select>
        <!-- </template> -->
        <!-- </el-popover> -->
      </template>
    </el-table-column>
    <el-table-column label="通知配置">
      <template #default="scope">
        <el-select v-model="scope.row.configId" disabled>
          <el-option
            v-for="item in notifyTemplateAndConfig"
            :key="item.configPo.id"
            :label="item.configPo.name"
            :value="item.configPo.id"
          ></el-option>
        </el-select>
        <!-- <el-popover placement="top" title="通知配置" :width="350"> -->
        <!-- <template #default> -->
        <!-- <el-descriptions :column="1">
              <el-descriptions-item label="from">{{
                getCurrentConfig(scope.row.notifyConfigPo.id, "from")
              }}</el-descriptions-item>
              <el-descriptions-item label="host">{{
                getCurrentConfig(scope.row.notifyConfigPo.id, "host")
              }}</el-descriptions-item>
            </el-descriptions> -->
        <!-- </template>
          <template #reference>
            <el-select v-model="scope.row.notifyConfigPo.id" disabled>
              <el-option
                v-for="item in notifyConfig"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              ></el-option>
            </el-select>
          </template> -->
        <!-- </el-popover> -->
      </template>
    </el-table-column>
    <el-table-column width="80" align="center">
      <template #header>
        <el-button
          type="primary"
          icon="Plus"
          size="small"
          @click="addHandler"
        />
      </template>
      <template #default="scope">
        <el-button
          type="primary"
          class="custom-class"
          icon="Delete"
          size="small"
          @click="delFunc(scope.$index)"
        />
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  name: "AlarmHandler",
  props: {
    deviceData: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    rulePo: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    notifyData: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      notifyD: {}, // 深拷贝避免引用共享
      userList: [],
      notifyTemplateUserList: [],
      templateUserLoad: false,
      // notifyConfig: [],
      // notifyTemplate: [],
      notifyTemplateAndConfig: [],
      delMap: new Map(),
    };
  },
  watch: {
    notifyData: {
      handler(val) {
        this.notifyD = JSON.parse(
          JSON.stringify(
            val.map((item) => ({
              ...item.ruleMetaPo,
              configId: item.notifyConfigPo.id,
              handlerType: item.ruleMetaPo.handlerType.value,
            }))
          )
        ); // 深拷贝避免引用共享
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    addHandler() {
      this.notifyD.push({
        userId: "",
        templateId: "",
        configId: "",
        handlerType: "notify",
      });
    },
    delFunc(index) {
      // 删除处理逻辑
      // this.notifyD.splice(index, 1);
      if (this.notifyD[index].id) {
        const str =
          this.notifyD[index].userId + "," + this.notifyD[index].templateId;
        this.delMap.set(str, this.notifyD[index].id);
      }
      this.notifyD.splice(index, 1);
    },
    getCurrentConfig(id, props) {
      const item = this.notifyConfig.find((item) => item.id == id);
      return item ? item.config[props] : "";
    },
    getCurrentTemplate(id, props) {
      const item = this.notifyTemplate.find((item) => item.id == id);
      return item ? item.msgContent[props] : "";
    },
    notifyTemplateChange(index, value) {
      const templateAndConfig = this.notifyTemplateAndConfig.find(
        (item) => item.templatePo.id == value
      );
      // 使用深拷贝避免对象引用共享
      this.notifyD[index].templateId = value;
      this.notifyD[index].configId = templateAndConfig.configPo.id;
    },
    getConfigAndTemplate() {
      this.$http
        .notifyTemplatePage({
          size: -1,
          current: 1,
        })
        .then((value) => {
          // this.notifyConfig = value.data.records.map((item) => item.configPo);
          // this.notifyTemplate = value.data.records.map(
          //   (item) => item.templatePo
          // );
          this.notifyTemplateAndConfig = value.data.records;
        });
    },
    getnotifyTemplateUser() {
      this.templateUserLoad = true;
      this.$http
        .getNotifyTemplateUserList({ current: 1, size: -1 })
        .then((value) => {
          this.userList = value.data.records;
          this.notifyTemplateUserList = value.data.records.map((item) => ({
            id: item.sysUserPo.id,
            label: item.sysUserPo.username,
          }));
        })
        .finally(() => {
          this.templateUserLoad = false;
        });
    },
  },
  mounted() {
    this.getnotifyTemplateUser();
    this.getConfigAndTemplate();
  },
};
</script>
