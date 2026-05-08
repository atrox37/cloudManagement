<template>
  <el-drawer v-model="drawable" :title="$t('awsEmailConfig.title')">
    <template #default>
      <el-form :inline="false" :model="config.data" ref="formRef" :rules="rules" label-position="left" label-width="120px">
        <el-form-item :label="$t('common.name')" prop="name" required>
          <el-input v-model="config.data.name" :placeholder="$t('awsEmailConfig.namePlaceholder')" clearable/>
        </el-form-item>
        <el-form-item :label="$t('awsEmailConfig.smtpAddress')" prop="config.host" required>
          <el-input v-model="config.data.config.host" :placeholder="$t('awsEmailConfig.namePlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="$t('awsEmailConfig.smtpUser')" prop="config.smtpUsername" required>
          <el-input v-model="config.data.config.smtpUsername" :placeholder="$t('awsEmailConfig.namePlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="$t('awsEmailConfig.smtpSecret')" prop="config.smtpPassword" required>
          <el-input v-model="config.data.config.smtpPassword" :placeholder="$t('awsEmailConfig.namePlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="$t('awsEmailConfig.fromEmail')" prop="config.from" required>
          <el-input v-model="config.data.config.from" :placeholder="$t('awsEmailConfig.namePlaceholder')" clearable />
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <el-divider/>
      <div style="flex: auto;margin-top: 10px">
        <el-button @click="closeClick">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="config.loading" @click="submitClick">{{ $t('common.save') }}</el-button>
      </div>
    </template>
  </el-drawer>
</template>
<script>
import { defineComponent, ref, toRef, computed } from "vue";
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: "NotifyAwsEmailConfig",
  props:{
    data:{
      type: Object,
      required: true,
      default: () => ({state:false,loading:false,data:{name:'',code:'aws-email',config:{type:'aws-email',from:'',host:'',smtpUsername:'',smtpPassword:''}}})
    }
  },
  emits:['save','close'],
  setup(props,context) {
    const { t } = useI18n()
    const config=toRef(props,'data')
    const formRef=ref()

    const drawable=computed({
      get:()=> props.data.state && props.data.data.code=='aws-email',
      set:(v)=>{ props.data.state=v }
    })

    const requiredRule = (msg) => [{
      required: true,
      message: msg,
      trigger: 'blur'
    }]

    const rules=ref({
      name: requiredRule(t('awsEmailConfig.nameRequired')),
      'config.host': requiredRule(t('awsEmailConfig.hostRequired')),
      'config.smtpUsername': requiredRule(t('awsEmailConfig.userRequired')),
      'config.smtpPassword': requiredRule(t('awsEmailConfig.passRequired')),
      'config.from': requiredRule(t('awsEmailConfig.fromRequired')),
    })

    const closeClick=()=>{
      context.emit('close')
    }

    const submitClick=()=>{
      formRef.value.validate((valid) => {
        if (valid) {
          context.emit('save', config.value.data)
        }
      })
    }

    return {formRef, drawable, rules, config, submitClick, closeClick};
  }
});
</script>
