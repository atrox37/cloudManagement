<template>
  <el-dialog
    v-model="dialogVisible"
    title="模板详情"
    width="800"
    :close-on-click-modal="false"
  >
    <!-- 主表单 -->
    <el-form :model="templateData" ref="templateForm" label-width="140px">
      <el-form-item label="模板名称" prop="templatePo.name" required>
        <el-input
          v-model="templateData.templatePo.name"
          placeholder="请输入模板名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="通知配置" prop="configPo.code" required>
        <template #label>
          <el-space wrap>
            <el-text>通知配置</el-text>
            <el-tag>{{ templateData.configPo.codeName }}</el-tag>
          </el-space>
        </template>
        <template #default>
          <el-select
            v-model="templateData.templatePo.notifyId"
            class="tiny-template-input"
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
        v-if="templateData.configPo?.code == 'email'"
        label="内容标题"
        prop="templatePo.msgContent.title"
        required
      >
        <el-input
          v-model="templateData.templatePo.msgContent.title"
          placeholder="请输入标题，支持使用 {$变量名} 格式定义变量"
          @blur="handleContentBlur"
        />
      </el-form-item>
      <el-form-item
        v-if="templateData.configPo?.code == 'email'"
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
        />
      </el-form-item>
    </el-form>
    <!-- 测试表单 -->
    <div
      v-if="showTestForm && templateData.configPo?.code == 'email'"
      class="test-form-container"
    >
      <div class="form-section-title">测试表单</div>
      <!-- <el-divider content-position="left">测试表单</el-divider> -->
      <el-form :model="testForm" ref="testFormRef" label-width="100px">
        <!-- 基本信息 -->
        <div class="form-section">
          <h4>基本信息</h4>
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
        </div>

        <!-- 模板信息 -->
        <div
          class="form-section template-variables-section"
          v-if="templateVariablesList.length > 0"
        >
          <h4>模板变量 (来自标题和内容)</h4>
          <div class="template-variables-container" :key="templateVariablesKey">
            <el-form-item
              v-for="variable in templateVariablesList"
              :key="variable"
              :label="variable"
            >
              <el-input
                v-model="testForm.variables[variable]"
                :placeholder="`请输入${variable}`"
              />
            </el-form-item>
          </div>
        </div>
      </el-form>

      <!-- 测试表单操作按钮 -->
      <div class="test-form-actions">
        <el-button
          @click="handleTestSubmit"
          type="primary"
          :disabled="templateData.loading"
          :loading="testForm.loading"
          >提交测试</el-button
        >
        <el-button
          @click="initTestForm"
          :disabled="testForm.loading || templateData.loading"
          >重置</el-button
        >
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-right">
          <el-button @click="handleCancel">取消</el-button>
          <el-button
            type="primary"
            @click="handleSave"
            :disabled="getTempleteLoading"
            :loading="templateData.loading"
            >保存模板</el-button
          >
        </div>
        <el-button
          v-if="templateData.configPo?.code == 'email'"
          @click="handleTest"
          >{{ showTestForm ? "取消测试" : "测试" }}</el-button
        >
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
    const testFormRef = ref();
    const showTestForm = ref(false);
    const templateVariablesKey = ref(0);
    const templateVariablesList = ref([]);
    const templateId = ref(null);
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
      configPo: { code: "", codeName: "" },
      templatePo: { name: "", msgContent: "" },
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
    // const rules = {
    //   "templatePo.name": [
    //     { required: true, message: "请输入模板名称", trigger: "blur" },
    //   ],
    //   "configPo.code": [
    //     { required: true, message: "请选择通知配置", trigger: "change" },
    //   ],
    //   "templatePo.msgContent.title": [
    //     { required: true, message: "请输入标题", trigger: "blur" },
    //   ],
    //   "templatePo.msgContent.content": [
    //     { required: true, message: "请输入内容", trigger: "blur" },
    //   ],
    // };
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
      showTestForm.value = !showTestForm.value;
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
      if (!testFormRef.value) return;

      testFormRef.value.validate((valid) => {
        if (valid) {
          // console.log("测试表单数据:", testForm);
          // sendTemplateApi();
          if (hasUnsavedChanges()) {
            ElMessageBox.confirm(
              "检测到模板信息已修改，是否先保存模板再进行测试？",
              "提示",
              {
                confirmButtonText: "保存",
                cancelButtonText: "取消",
                type: "warning",
              }
            )
              .then(() => {
                // 用户选择先保存
                handleSave().then(() => {
                  sendTemplateApi();
                });
              })
              .catch(() => {});
          } else {
            sendTemplateApi();
          }
        }
      });
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
      testForm.loading = true;
      const params = {
        userId: testForm.recipient,
        notifyPo: { id: templateData.templatePo.notifyId },
        templatePo: {
          variables: testForm.variables,
          msgContent: templateData.templatePo.msgContent,
          msgType: 0,
        },
      };
      testForm.loading = true;
      proxy.$http
        .notifyTemplateTest(params)
        .then((value) => {
          testForm.loading = false;
          console.log("sendTemplateApi");
          var s = 0,
            f = 0;
          for (var item of value.data.data) {
            if (item.result) {
              s++;
            } else {
              f++;
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
        });
    };
    const initTestForm = () => {
      testForm.recipient = "";
      for (let key in testForm.variables) {
        testForm.variables[key] = "";
      }
      testForm.loading = false;
    };

    // 处理标题或内容失去焦点事件
    const handleContentBlur = () => {
      const newVars = templateVariables.value;

      // 更新变量列表
      templateVariablesList.value = [...newVars];

      // 保存当前已填写的变量值
      const currentValues = { ...testForm.variables };

      // 清空现有变量
      Object.keys(testForm.variables).forEach((key) => {
        delete testForm.variables[key];
      });

      // 添加新变量
      newVars.forEach((variable) => {
        testForm.variables[variable] = currentValues[variable] || "";
      });

      // 强制更新模板信息区域
      templateVariablesKey.value++;

      console.log("手动更新后的测试表单变量:", testForm.variables);
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
      showTestForm.value = false;
      dialogVisible.value = false;

      //   showTestForm.value = false;
      //   showContentEditor.value = false;
      //   props.state = false;
      //   emit("cancel");
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
      templateData.templatePo.notifyId = "";
      templateData.configPo.code = "";
      templateData.configPo.codeName = "";
      templateData.templatePo.msgContent.title = "";
      templateData.templatePo.msgContent.content = "";
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
            proxy.$http.notifyTemplateUpdate(templateData.templatePo).then(
              (value) => {
                console.log("saveTemplateApi success");

                // 更新原始数据
                originalData.templateName = templateData.templateName;
                originalData.configPo = templateData.configPo;
                originalData.title = templateData.templatePo.msgContent.title;
                originalData.content =
                  templateData.templatePo.msgContent.content;
                templateData.loading = false;
                resolve();
              },
              (error) => {
                console.log("saveTemplateApi error");
                templateData.loading = false;
                reject();
              }
            );
          } else {
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
            initTestForm();
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
      testFormRef,
      showTestForm,
      showContentEditor,
      templateId,
      templateVariablesKey,
      templateVariablesList,
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
      initTestForm,
    };
  },
});
</script>

<style scoped lang="scss">
.test-form-container {
  //margin-top: 20px;
  //padding: 20px;
  background-color: #f5f7fa;
  //border-radius: 4px;
  padding: 0 10px;
}
.form-section-title {
  padding: 10px 0;
  border-bottom: 1px solid #e5e5e5;
  color: #606266;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
}

.form-section {
  // margin-bottom: 20px;

  h4 {
    margin: 0 0 15px 0;
    color: #606266;
    font-size: 14px;
    font-weight: 500;
  }
}

.template-variables-section {
  .template-variables-container {
    max-height: 200px;
    overflow-y: auto;
    // padding-right: 10px;

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
}

.test-form-actions {
  padding-bottom: 10px;
  text-align: center;

  .el-button {
    margin: 0 10px;
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
