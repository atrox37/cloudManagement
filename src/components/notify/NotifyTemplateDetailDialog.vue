<template>
  <el-dialog
    v-model="dialogVisible"
    title="模板详情"
    width="800"
    :close-on-click-modal="false"
  >
    <!-- 主表单 -->
    <el-form :model="templateData" ref="templateForm" label-width="160px" :rules="rules">
      <!-- 基本信息模块 -->
      <div class="form-section-module">
        <div class="module-title">基本信息</div>
        <el-form-item label="模板名称" prop="templatePo.name" required>
          <el-input
            v-model="templateData.templatePo.name"
            placeholder="请输入模板名称"
            clearable
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="通知配置" prop="configPo.id" required>
          <template #label>
            <el-space wrap>
              <el-text>通知配置</el-text>
              <el-tag>{{ templateData.configPo.codeName }}</el-tag>
            </el-space>
          </template>
          <template #default>
            <el-select
              @change="handleConfigChange"
              v-model="templateData.configPo.id"
              class="form-input"
            >
              <el-option
                v-for="(item, index) in configs"
                :key="index"
                :label="item.name"
                :value="item.id"
              >
              </el-option>
            </el-select>
          </template>
        </el-form-item>

        <el-form-item
          label="内容标题"
          prop="templatePo.msgContent.title"
          required
        >
          <el-input
            v-model="templateData.templatePo.msgContent.title"
            placeholder="请输入标题，支持使用 {$变量名} 格式定义变量"
            @blur="handleContentBlur"
            class="form-input"
          />
        </el-form-item>
        <el-form-item
          label="内容正文"
          prop="templatePo.msgContent.content"
          required
        >
          <el-input
            v-model="templateData.templatePo.msgContent.content"
            type="textarea"
            :rows="4"
            placeholder="请输入内容正文，使用 {$变量名} 格式定义变量"
            @blur="handleContentBlur"
            class="form-input"
          />
        </el-form-item>
      </div>
      
      <!-- 模板变量默认数据模块 -->
      <div
        v-if="templateVariablesList.length > 0"
        class="form-section-module"
      >
        <div class="module-title">模板变量默认值</div>
        <div class="template-variables-container" :key="templateVariablesKey">
          <el-form-item
            v-for="variable in templateVariablesList"
            :key="variable"
            :label="variable"
          >
            <el-input
              v-model="templateVariablesData[variable]"
              :placeholder="`请输入${variable}`"
              class="form-input"
            />
          </el-form-item>
        </div>
      </div>
      <!-- 模板点位默认数据模块 -->
      <div
        v-if="templateDeviceList.length > 0"
        class="form-section-module"
      >
        <div class="module-title">模板点位默认值</div>
        <div class="template-variables-container">
          <el-form-item
            v-for="variable in templateDeviceList"
            :key="variable"
            :label="variable"
          >
            <el-input
              v-model="templateVariablesData[variable]"
              :placeholder="`请输入${variable}`"
              class="form-input"
            />
          </el-form-item>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-right">
          <el-button @click="handleCancel">取消</el-button>
          <el-button
            @click="handleTest"
            >测试</el-button
          >
          <el-button
            type="primary"
            @click="handleSave"
            :disabled="getTempleteLoading"
            :loading="templateData.loading"
            >保存模板</el-button
          >
        </div>
      </div>
    </template>
  </el-dialog>

  <!-- 模板内容编辑器抽屉 -->
  <el-drawer
    v-model="showContentEditor"
    size="25%"
    title="模板内容"
    @close="closeContentEditor"
  >
    <template #default>
      <div class="content-editor">
        <el-input
          v-model="templateData.msgContent"
          type="textarea"
          :rows="15"
          placeholder="请输入模板内容"
        />
      </div>
    </template>
  </el-drawer>

  <!-- 选择收件人弹框 -->
  <el-dialog
    v-model="showRecipientDialog"
    title="选择收件人"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form label-width="100px">
      <el-form-item label="收件人" required>
        <el-select
          v-model="testForm.recipient"
          placeholder="请选择收件人"
          style="width: 100%"
        >
          <el-option
            v-for="user in accountUser"
            :key="user.id"
            :label="user.sysUserPo.username"
            :value="user.sysUserPo.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showRecipientDialog = false">取消</el-button>
      <el-button
        type="primary"
        @click="handleTestSubmit"
        :loading="testForm.loading"
        :disabled="!testForm.recipient"
        >发送测试</el-button
      >
    </template>
  </el-dialog>
</template>

<script>
import {
  defineComponent,
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  nextTick,
  getCurrentInstance,
  onMounted,
  toRef,
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { notifyType } from "@/model/notify/NotifyType";
export default defineComponent({
  name: "NotifyTemplateDetailDialog",
  emits: ["save", "cancel"],
  setup(props, { emit }) {
    const { proxy } = getCurrentInstance();
    const dialogVisible = ref(false);
    const templateForm = ref();
    const showRecipientDialog = ref(false);
    const templateVariablesKey = ref(0);
    const templateVariablesList = ref([]);
    const templateDeviceList = ref([]);
    const templateId = ref(null);
    // 模板变量数据
    const templateVariablesData = reactive({});
    const nType = notifyType;
    const getTempleteLoading = ref(false);
    // 添加原始数据用于比较是否有修改
    const originalData = reactive({
      templateName: "",
      code: "",
      title: "",
      content: "",
    });

    // 添加用户列表数据
    const accountUser = reactive([]);

    // 添加通知配置数据
    const configs = reactive([]);

    // 添加内容编辑器状态
    const showContentEditor = ref(false);

    // 模板数据
    const templateData = reactive({
      configPo: { id: "", code: "", codeName: "" },
      templatePo: { name: "", msgContent: { title: "", content: "", type: "" } },
      msgContent: { title: "", content: "" },
      loading: false,
    });

    // 测试表单数据
    const testForm = reactive({
      recipient: "",
      variables: reactive({}),
      loading: false,
    });

    // // 表单验证规则
    const rules = {
      "templatePo.name": [
        { required: true, message: "请输入模板名称", trigger: "blur" }
      ],
      "configPo.id": [
        { required: true, message: "请选择通知配置", trigger: "change" },
      ],
      "templatePo.msgContent.title": [
        { required: true, message: "请输入标题", trigger: "blur" },
      ],
      "templatePo.msgContent.content": [
        { required: true, message: "请输入内容", trigger: "blur" },
      ],
    };
    // 解析标题和内容中的变量
    const templateVariables = computed(() => {
      const variables = [];
      const regex = /\{\$([^}]+)\}/g;

      // 解析标题中的变量
      if (templateData.templatePo.msgContent.title) {
        let match;
        while (
          (match = regex.exec(templateData.templatePo.msgContent.title)) !==
          null
        ) {
          const variableName = match[1].trim();
          if (variableName && !variables.includes(variableName)) {
            variables.push(variableName);
          }
        }
      }

      // 解析内容中的变量
      if (templateData.templatePo.msgContent.content) {
        let match;
        while (
          (match = regex.exec(templateData.templatePo.msgContent.content)) !==
          null
        ) {
          const variableName = match[1].trim();
          if (variableName && !variables.includes(variableName)) {
            variables.push(variableName);
          }
        }
      }

      return variables;
    });
    const handleConfigChange = () => {
      templateData.configPo.codeName = configs.find(item => item.id == templateData.configPo.id).code;
    }
    // 解析标题和内容中的变量
    const templateDevice = computed(() => {
      const variables = [];
      const regex = /\{\#([^}]+)\}/g;

      // 解析标题中的变量
      if (templateData.templatePo.msgContent.title) {
        let match;
        while (
          (match = regex.exec(templateData.templatePo.msgContent.title)) !==
          null
          ) {
          const variableName = match[1].trim();
          if (variableName && !variables.includes(variableName)) {
            variables.push(variableName);
          }
        }
      }

      // 解析内容中的变量
      if (templateData.templatePo.msgContent.content) {
        let match;
        while (
          (match = regex.exec(templateData.templatePo.msgContent.content)) !==
          null
          ) {
          const variableName = match[1].trim();
          if (variableName && !variables.includes(variableName)) {
            variables.push(variableName);
          }
        }
      }

      return variables;
    });

    // 初始化时更新一次变量列表
    watch(
      templateVariables,
      (newVars) => {
        templateVariablesList.value = [...newVars];
      },
      { immediate: true }
    );

    // 监听内容输入，实时更新变量
    watch(
      () => templateData.content,
      (newContent, oldContent) => {
        console.log("内容变化:", newContent);
        // 当内容变化时，templateVariables会自动更新
      }
    );

    // 检查是否有未保存的修改
    const hasUnsavedChanges = () => {
      return (
        templateData.templatePo.name !== originalData.templateName ||
        templateData.configPo.code !== originalData.configPo.code ||
        templateData.templatePo.msgContent.title !== originalData.title ||
        templateData.templatePo.msgContent.content !== originalData.content
      );
    };

    // 处理测试按钮点击
    const handleTest = () => {
      // 先进行表单验证
      if (!templateForm.value) {
        return;
      }
      
      templateForm.value.validate((valid) => {
        if (valid) {
          // 表单验证通过，重置收件人并打开选择收件人弹框
          testForm.recipient = "";
          showRecipientDialog.value = true;
        } else {
          // 表单验证失败，显示提示
          ElMessage({
            message: "请先完善表单信息",
            type: "warning",
          });
        }
      });
    };

    // 获取用户列表API
    const accountApi = () => {
      proxy.$http.sysUserPage({ current: 1, size: -1 }).then(
        (v) => {
          accountUser.length = 0;
          accountUser.push(...v.data.records);
          console.log("accountApi success");
        },
        (e) => {
          console.log("accountApi error");
        }
      );
    };

    // 处理测试提交
    const handleTestSubmit = () => {
      if (!testForm.recipient) {
        ElMessage({
          message: "请选择收件人",
          type: "warning",
        });
        return;
      }
      // 直接发送测试，不需要判断数据是否修改
      sendTemplateApi();
    };
    const supportConfigApi = () => {
      proxy.$http.notifyPage({ size: -1 }).then((value) => {
        configs.length = 0;
        for (var item of value.data.records) {
          configs.push(item.configPo);
        }
      });
    };
    // 发送测试API
    const sendTemplateApi = () => {
      console.info('send test')
      testForm.loading = true;
      const params = {
        userId: testForm.recipient,
        configPo: {
           id: templateData.templatePo.configId,
        },
        templatePo: {
          type: templateData.configPo.code, // 使用 configPo.code 作为 type
          msgContent: templateData.templatePo.msgContent,
          variables: { ...templateVariablesData },
          msgType: templateData.templatePo.msgType || 1, // 使用模板的 msgType，默认为 1
        },
      };
      proxy.$http
        .notifyTemplateTest(params)
        .then((value) => {
          testForm.loading = false;
          showRecipientDialog.value = false;
          console.log("sendTemplateApi", value);
          var s = 0,
            f = 0;
          // 根据新的响应结构处理数据：value.data.data 是数组
          if (value.data && value.data.data && Array.isArray(value.data.data)) {
            for (var item of value.data.data) {
              if (item.result) {
                s++;
              } else {
                f++;
              }
            }
          }
          var str = "操作成功,成功:" + s + ",失败:" + f;
          ElMessage({
            message: str,
            type: "success",
          });
        })
        .catch((error) => {
          testForm.loading = false;
          ElMessage({
            message: "测试发送失败",
            type: "error",
          });
        });
    };

    // 处理标题或内容失去焦点事件
    const handleContentBlur = () => {
      const newVars = []
      newVars.push(...templateVariables.value);
      newVars.push(...templateDevice.value);
      templateDeviceList.value = [...templateDevice.value]
      // 更新变量列表
      templateVariablesList.value = [...newVars];

      // 保存当前已填写的变量值
      const currentValues = { ...templateVariablesData };

      // 清空现有变量
      Object.keys(templateVariablesData).forEach((key) => {
        delete templateVariablesData[key];
      });

      // 添加新变量，保留已有值或设为空字符串
      newVars.forEach((variable) => {
        templateVariablesData[variable] = currentValues[variable] || "";
      });

      // 强制更新模板信息区域
      templateVariablesKey.value++;

      console.log("手动更新后的模板变量数据:", templateVariablesData);
      console.log("手动更新后的设备变量数据:", JSON.stringify(templateDeviceList.value));
    };

    // 打开内容编辑器
    const openContentEditor = () => {
      showContentEditor.value = true;
    };

    // 关闭内容编辑器
    const closeContentEditor = () => {
      showContentEditor.value = false;
    };

    // 处理取消
    const handleCancel = () => {
      showRecipientDialog.value = false;
      dialogVisible.value = false;
    };
    const handleOpen = (id) => {
      templateId.value = id;
      requestInfoApi();
      dialogVisible.value = true;
      initTemplateData();
      setTimeout(() => {
        templateForm.value.clearValidate();
      }, 100);
    };
    const initTemplateData = () => {
      templateData.templatePo.name = "";
      templateData.templatePo.configId = "";
      templateData.configPo.code = "";
      templateData.configPo.codeName = "";
      // 确保 msgContent 是对象
      if (!templateData.templatePo.msgContent || typeof templateData.templatePo.msgContent === 'string') {
        templateData.templatePo.msgContent = { title: "", content: "", type: "" };
      } else {
        templateData.templatePo.msgContent.title = "";
        templateData.templatePo.msgContent.content = "";
      }
    };
    // 处理保存
    const handleSave = () => {
      return new Promise((resolve, reject) => {
        if (!templateForm.value) {
          reject("表单引用不存在");
          return;
        }

        templateForm.value.validate((valid) => {
          templateData.loading = true;
          if (valid) {
            // 在保存前，将模板变量默认值赋值给 templatePo.variables
            // 确保 variables 对象存在
            if (!templateData.templatePo.variables) {
              templateData.templatePo.variables = {};
            }
            
            // 获取当前的变量列表（从标题和内容解析的变量）
            const currentVariables = [];
            currentVariables.push(...templateVariables.value)
            currentVariables.push(...templateDevice.value)
            // 更新 variables：新增的添加，删除的移除，保留已有的值
            const newVariables = {};
            currentVariables.forEach((variable) => {
              // 如果 templateVariablesData 中有值，使用该值；否则使用原有的值或空字符串
              if (templateVariablesData.hasOwnProperty(variable)) {
                newVariables[variable] = templateVariablesData[variable];
              } else if (templateData.templatePo.variables.hasOwnProperty(variable)) {
                // 保留原有的值
                newVariables[variable] = templateData.templatePo.variables[variable];
              } else {
                // 新增的变量，使用空字符串
                newVariables[variable] = '';
              }
            });
            
            // 赋值给 templatePo.variables
            templateData.templatePo.variables = newVariables;
            templateData.templatePo.configId = templateData.configPo.id;
            proxy.$http.notifyTemplateUpdate(templateData.templatePo).then(
              (value) => {
                console.log("saveTemplateApi success", value);
                
                // 检查响应状态码（兼容不同的响应结构）
                const responseCode = value?.code || value?.data?.code;
                if (responseCode === 200) {
                  // 显示成功提示
                  ElMessage({
                    message: "保存成功",
                    type: "success",
                  });
                  // 关闭弹框
                  dialogVisible.value = false;
                  // 触发 save 事件，通知父组件刷新表格
                  emit("save");
                } else {
                  // 如果状态码不是200，也显示提示
                  ElMessage({
                    message: value?.msg || value?.data?.msg || "保存失败",
                    type: "warning",
                  });
                }
                
                templateData.loading = false;
                resolve();
              },
              (error) => {
                console.log("saveTemplateApi error", error);
                templateData.loading = false;
                ElMessage({
                  message: "保存失败",
                  type: "error",
                });
                reject();
              }
            );
          } else {
            templateData.loading = false;
            reject("表单验证失败");
          }
        });
      });
    };
    // 获取模板信息API
    const requestInfoApi = () => {
      if (templateId.value != undefined) {
        const param = { terms: [{ column: "t.id", value: templateId.value }] };
        getTempleteLoading.value = true;
        proxy.$http
          .notifyTemplateInfo(param)
          .then((value) => {
            //notifyConfig.value=value.data.configPo
            //templateData.value=value.data.templatePo
            templateData.msgContent = value.data.templatePo.msgContent;
            templateData.templatePo = value.data.templatePo;
            templateData.configPo = value.data.configPo;
            originalData.templateName = templateData.templatePo.name;
            originalData.configPo = templateData.configPo;
            originalData.title = templateData.templatePo.msgContent.title;
            originalData.content = templateData.templatePo.msgContent.content;
            for (let item of nType) {
              if (item.type == value.data.configPo.code) {
                templateData.configPo.codeName = item.name;
                break;
              }
            }
            
            // 先更新变量列表（从标题和内容解析）
            handleContentBlur();
            
            // 然后初始化模板变量数据，从响应数据中的variables获取初始值
            if (value.data.templatePo.variables) {
              // 设置初始值（保留handleContentBlur中已设置的变量）
              Object.keys(value.data.templatePo.variables).forEach((key) => {
                if (templateVariablesData.hasOwnProperty(key)) {
                  templateVariablesData[key] = value.data.templatePo.variables[key];
                }
              });
            }
            
            getTempleteLoading.value = false;
            console.log("requestInfoApi");
          })
          .catch((error) => {
            console.log("requestInfoApi error");
            getTempleteLoading.value = false;
          });
      }
    };

    // 初始化数据
    const initData = () => {
      accountApi();
      supportConfigApi();
    };

    // // 加载测试数据
    // const loadTestData = () => {
    //   // 获取用户列表
    //   accountApi();
    // };
    // 组件挂载时初始化数据
    onMounted(() => {
      initData();
    });

    return {
      dialogVisible,
      templateData,
      testForm,
      templateForm,
      showRecipientDialog,
      showContentEditor,
      templateId,
      templateVariablesKey,
      templateVariablesList,
      templateVariablesData,
      templateDeviceList,
      accountUser,
      configs,
      templateVariables,
      getTempleteLoading,
      handleTest,
      handleTestSubmit,
      handleContentBlur,
      initData,
      accountApi,
      sendTemplateApi,
      hasUnsavedChanges,
      openContentEditor,
      closeContentEditor,
      handleCancel,
      handleSave,
      handleOpen,
      handleConfigChange,
    };
  },
});
</script>

<style scoped lang="scss">
// 模块样式
.form-section-module {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .module-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e4e7ed;
  }
}

// 统一输入框宽度
.form-input {
  width: 100%;
}

// 模板变量容器样式
.template-variables-container {
  max-height: 200px;
  overflow-y: auto;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row-reverse;

  .footer-right {
    display: flex;
    gap: 10px;
  }
}

.content-editor {
  padding: 20px;
}

:deep(.el-dialog__body) {
  overflow-y: hidden;
}
</style>
