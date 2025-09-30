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
import { ref, watch, onMounted, getCurrentInstance } from 'vue';

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
  setup(props) {
    const notifyD = ref([]);
    const userList = ref([]);
    const notifyTemplateUserList = ref([]);
    const templateUserLoad = ref(false);
    // const notifyConfig = ref([]);
    // const notifyTemplate = ref([]);
    const notifyTemplateAndConfig = ref([]);
    const delMap = ref(new Map());

    // 监听notifyData变化，深拷贝赋值
    watch(
      () => props.notifyData,
      (val) => {
        notifyD.value = JSON.parse(
          JSON.stringify(
            val.map((item) => ({
              ...item.ruleMetaPo,
              configId: item.notifyConfigPo.id,
              handlerType: item.ruleMetaPo.handlerType.value,
            }))
          )
        );
      },
      { deep: true, immediate: true }
    );

    function addHandler() {
      notifyD.value.push({
        userId: "",
        templateId: "",
        configId: "",
        handlerType: "notify",
      });
    }

    function delFunc(index) {
      if (notifyD.value[index].id) {
        const str =
          notifyD.value[index].userId + "," + notifyD.value[index].templateId;
        delMap.value.set(str, notifyD.value[index].id);
      }
      notifyD.value.splice(index, 1);
    }

    // 下面两个函数未被页面调用，保留原样
    function getCurrentConfig(id, propsName) {
      const item = notifyConfig.value.find((item) => item.id == id);
      return item ? item.config[propsName] : "";
    }

    function getCurrentTemplate(id, propsName) {
      const item = notifyTemplate.value.find((item) => item.id == id);
      return item ? item.msgContent[propsName] : "";
    }

    function notifyTemplateChange(index, value) {
      const templateAndConfig = notifyTemplateAndConfig.value.find(
        (item) => item.templatePo.id == value
      );
      notifyD.value[index].templateId = value;
      notifyD.value[index].configId = templateAndConfig.configPo.id;
    }

    function getConfigAndTemplate() {
      const $http = getCurrentInstance().proxy.$http;
      $http
        .notifyTemplatePage({
          size: -1,
          current: 1,
        })
        .then((value) => {
          notifyTemplateAndConfig.value = value.data.records;
        });
    }

    function getnotifyTemplateUser() {
      templateUserLoad.value = true;
      const $http = getCurrentInstance().proxy.$http;
      $http
        .getNotifyTemplateUserList({ current: 1, size: -1 })
        .then((value) => {
          userList.value = value.data.records;
          notifyTemplateUserList.value = value.data.records.map((item) => ({
            id: item.sysUserPo.id,
            label: item.sysUserPo.username,
          }));
        })
        .finally(() => {
          templateUserLoad.value = false;
        });
    }

    onMounted(() => {
      getnotifyTemplateUser();
      getConfigAndTemplate();
    });

    return {
      notifyD,
      userList,
      notifyTemplateUserList,
      templateUserLoad,
      notifyTemplateAndConfig,
      delMap,
      addHandler,
      delFunc,
      getCurrentConfig,
      getCurrentTemplate,
      notifyTemplateChange,
      getConfigAndTemplate,
      getnotifyTemplateUser,
    };
  },
};
</script>
