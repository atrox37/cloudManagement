<template>
  <el-dialog v-model="testData.state" :title="titleP" width="30%">
    <el-divider content-position="left">{{ $t('testEmail.basicInfo') }}</el-divider>
    <el-form ref="formRef" :rules="rules" :model="testData" label-position="right">
      <el-form-item :label="$t('testEmail.name')" label-width="80px" prop="name">
        <el-input v-model="testData.name" />
      </el-form-item>
      <el-form-item :label="$t('testEmail.recipient')" label-width="80px" prop="to">
        <el-select v-model="testData.userId" placeholder="Select">
          <el-option v-for="(item,index) in account" :key="index" :label="item.sysUserPo.username" :value="item.sysUserPo.id"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <el-divider content-position="left">{{ $t('testEmail.templateInfo') }}</el-divider>
    <el-form :model="testData" label-position="right">
      <el-form-item v-for="(item,index) in testData.sendData" :key="index" :label="item.name" label-width="80px">
        <el-input v-model="item.value" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="right-flex-contain">
        <el-button type="primary" @click="testClick" :loading="testData.loading">{{ submitStr }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { defineComponent, watch, ref, getCurrentInstance, onMounted, toRef, computed } from "vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "TestEmail",
  props: {
    title: {
      type: String,
      required: true
    },
    submitLabel: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      required: true,
      default: () => ({
        id: undefined,
        name: "",
        templateId: undefined,
        state: false,
        sendData: [],
        receiver: "",
        loading: false
      })
    },
    user: {
      type: Array,
      required: true,
      default:()=>{[]}
    }
  },
  emits: ["click"],
  setup(props, context) {
    const { t } = useI18n();
    const titleP = toRef(props, "title");
    const submitStr = toRef(props, "submitLabel");
    const testData = toRef(props, "data");
    const account=toRef(props,'user')
    const formRef = ref();
    const validateSelect = (rule, value, callback) => {
      console.log("validateSelect");
      if (rule.field == "to") {
        if (testData.value.userId == undefined || testData.value.userId == "") {
          callback(t('testEmail.userRequired'));
        } else {
          callback();
        }
      } else if (rule.field == "name") {
        if (testData.value.name == undefined || testData.value.name == "") {
          callback(t('testEmail.nameRequired'));
        } else {
          callback();
        }
      }

    };
    const rules = ref({
      to: [{ validator: validateSelect, trigger: "blur" }],
      name: [{ validator: validateSelect, trigger: "blur" }]
    });
    const testClick = () => {
      formRef.value.validate((valid, fields) => {
        var repo = { notifyPo: {}, templatePo: {variables: {}}, receiverPo: { userId: testData.value.userId,state:1 } };
        if (testData.value.id != undefined) repo.receiverPo.id = testData.value.id;
        if (testData.value.name != undefined) repo.receiverPo.name = testData.value.name;
        if (testData.value.templateId != undefined) repo.receiverPo.templateId = testData.value.templateId;
        if (valid) {
          for (var item of testData.value.sendData) {
            repo.templatePo.variables[item.name] = item.value;
          }
          context.emit("click", repo);
        } else {
          console.log("error submit!", fields);
        }
      });

    };

    return {
      account,
      submitStr,
      titleP,
      rules,
      formRef,
      testData,
      testClick
    };
  }
});
</script>

<style scoped>

</style>