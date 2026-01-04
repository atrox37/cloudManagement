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
    <el-table-column label="通知配置" width="100">
      <template #default="scope">
        <el-popover
          v-model:visible="popoverVisibleMap[scope.$index]"
          placement="right"
          :width="500"
          trigger="click"
          @show="() => openVariablesPopover(scope.$index)"
        >
          <template #reference>
            <el-button
              type="primary"
              size="small"
              :disabled="!scope.row.templateId"
            >
              修改
            </el-button>
          </template>
          <div class="variables-popover-content">
            <div class="popover-title">编辑模板变量</div>
            <el-form label-width="120px" size="small">
              <el-form-item
                v-for="variable in getTemplateVariablesList(scope.$index)"
                :key="variable"
                :label="variable"
              >
                <el-input
                  v-model="getCurrentVariables(scope.$index)[variable]"
                  :placeholder="`请输入${variable}`"
                  size="small"
                />
              </el-form-item>
            </el-form>
            <div class="popover-footer">
              <el-button size="small" @click="closeVariablesPopover(scope.$index)">取消</el-button>
              <el-button type="primary" size="small" @click="saveVariables(scope.$index)">确定</el-button>
            </div>
          </div>
        </el-popover>
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
    
    // 变量编辑 Popover 相关
    const popoverVisibleMap = ref({}); // 存储每个索引的 Popover 显示状态
    const currentVariablesMap = ref({}); // 存储每个索引的变量数据
    const templateVariablesMap = ref({}); // 存储每个索引的变量列表
    const templateDataMap = ref(new Map()); // 存储模板数据，key为templateId

    // 监听notifyData变化，深拷贝赋值
    watch(
      () => props.notifyData,
      (val) => {
        notifyD.value = JSON.parse(
          JSON.stringify(
            val.map((item) => {
              // 保存模板数据到map中
              if (item.notifyTemplatePo) {
                templateDataMap.value.set(item.notifyTemplatePo.id, item.notifyTemplatePo);
              }
              
              return {
                ...item.ruleMetaPo,
                configId: item.notifyConfigPo.id,
                handlerType: item.ruleMetaPo.handlerType?.value || item.ruleMetaPo.handlerType || "notify",
                // 保存模板ID，用于获取默认变量
                _templateId: item.notifyTemplatePo?.id,
              };
            })
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
        handlerData: {
          type: "notify",
          variables: {}
        },
        _templateId: null,
      });
    }
    function clearNotifyD() {
      notifyD.value.length = 0;
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

    // 解析模板变量（从msgContent的title和content中提取）
    function parseTemplateVariables(template) {
      const variables = [];
      const regex = /\{\$([^}]+)\}/g;
      
      if (template?.msgContent) {
        // 解析标题中的变量
        if (template.msgContent.title) {
          let match;
          while ((match = regex.exec(template.msgContent.title)) !== null) {
            const variableName = match[1].trim();
            if (variableName && !variables.includes(variableName)) {
              variables.push(variableName);
            }
          }
        }
        
        // 解析内容中的变量
        if (template.msgContent.content) {
          let match;
          while ((match = regex.exec(template.msgContent.content)) !== null) {
            const variableName = match[1].trim();
            if (variableName && !variables.includes(variableName)) {
              variables.push(variableName);
            }
          }
        }
      }
      
      return variables;
    }

    function notifyTemplateChange(index, value) {
      const templateAndConfig = notifyTemplateAndConfig.value.find(
        (item) => item.templatePo.id == value
      );
      notifyD.value[index].templateId = value;
      notifyD.value[index].configId = templateAndConfig.configPo.id;
      notifyD.value[index]._templateId = value;
      
      // 当选择模板时，如果是新增记录（没有handlerData或variables为空），初始化变量为模板的默认值
      const template = templateAndConfig.templatePo;
      if (template && template.variables) {
        // 初始化handlerData
        if (!notifyD.value[index].handlerData) {
          notifyD.value[index].handlerData = {
            type: "notify",
            variables: JSON.parse(JSON.stringify(template.variables))
          };
        } else if (!notifyD.value[index].handlerData.variables || Object.keys(notifyD.value[index].handlerData.variables).length === 0) {
          // 如果handlerData存在但variables为空，使用模板的默认值
          notifyD.value[index].handlerData.variables = JSON.parse(JSON.stringify(template.variables));
        }
        // 如果已经有variables值，保留用户编辑的值
      }
    }
    
    // 打开变量编辑 Popover
    function openVariablesPopover(index) {
      const row = notifyD.value[index];
      if (!row.templateId) {
        return;
      }
      
      // 获取模板数据
      const template = notifyTemplateAndConfig.value.find(
        (item) => item.templatePo.id === row.templateId
      )?.templatePo;
      
      if (!template) {
        return;
      }
      
      // 解析模板变量列表
      const variablesList = parseTemplateVariables(template);
      templateVariablesMap.value[index] = variablesList;
      
      // 初始化当前变量值
      // 优先使用handlerData.variables，如果为空则使用模板的默认值
      const defaultVariables = template.variables || {};
      // 确保 handlerData 存在
      if (!row.handlerData) {
        row.handlerData = {
          type: "notify",
          variables: {}
        };
      }
      const customVariables = row.handlerData.variables || {};
      
      // 初始化变量数据
      currentVariablesMap.value[index] = {};
      variablesList.forEach((variable) => {
        // 如果自定义变量中有值，使用自定义值；否则使用模板默认值
        currentVariablesMap.value[index][variable] = customVariables[variable] !== undefined && customVariables[variable] !== null && customVariables[variable] !== ''
          ? customVariables[variable]
          : (defaultVariables[variable] || '');
      });
    }
    
    // 关闭变量编辑 Popover
    function closeVariablesPopover(index) {
      popoverVisibleMap.value[index] = false;
    }
    
    // 保存变量
    function saveVariables(index) {
      const row = notifyD.value[index];
      
      // 确保handlerData存在
      if (!row.handlerData) {
        row.handlerData = {
          type: "notify",
          variables: {}
        };
      }
      
      // 保存变量值
      row.handlerData.variables = JSON.parse(JSON.stringify(currentVariablesMap.value[index] || {}));
      
      popoverVisibleMap.value[index] = false;
    }
    
    // 获取模板变量列表（用于模板中）
    function getTemplateVariablesList(index) {
      return templateVariablesMap.value[index] || [];
    }
    
    // 获取当前变量数据（用于模板中）
    function getCurrentVariables(index) {
      if (!currentVariablesMap.value[index]) {
        currentVariablesMap.value[index] = {};
      }
      return currentVariablesMap.value[index];
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
      clearNotifyD,
      getConfigAndTemplate,
      getnotifyTemplateUser,
      popoverVisibleMap,
      currentVariablesMap,
      templateVariablesMap,
      openVariablesPopover,
      closeVariablesPopover,
      saveVariables,
      getTemplateVariablesList,
      getCurrentVariables,
    };
  },
};
</script>

<style scoped lang="scss">
.variables-popover-content {
  padding: 10px;
  
  .popover-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .popover-footer {
    margin-top: 16px;
    text-align: right;
    
    .el-button {
      margin-left: 8px;
    }
  }
  
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
