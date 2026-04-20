<template>
  <el-drawer v-model="drawable" :title="$t('awsEmailConfig.title')">
    <template #default>
      <el-form :inline="false" :model="config.data" ref="formRef" :rules="rules" label-position="left" label-width="120px">
        <el-form-item :label="$t('common.name')" prop="name">
          <el-input v-model="config.data.name" :placeholder="$t('awsEmailConfig.namePlaceholder')" clearable/>
        </el-form-item>
        <el-form-item :label="$t('awsEmailConfig.smtpAddress')" prop="host">
          <el-input v-model="config.data.config.host" :placeholder="$t('awsEmailConfig.namePlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="$t('awsEmailConfig.smtpUser')" prop="user">
          <el-input v-model="config.data.config.smtpUsername" :placeholder="$t('awsEmailConfig.namePlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="$t('awsEmailConfig.smtpSecret')" prop="pass">
          <el-input v-model="config.data.config.smtpPassword" :placeholder="$t('awsEmailConfig.namePlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="$t('awsEmailConfig.fromEmail')" prop="from">
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
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: "NotifyAwsEmailConfig",
  props:{
    data:{
      type: Object,
      required: true,
      default: {state:false,loading:false,data:{name:'',code:'aws-email',config:{type:'type',from:'',host:'',smtpUsername:0,smtpPassword:''}}}
    }
  },
  emits:['save','close'],
  setup(props,context) {
    const { t } = useI18n()
    const config=toRef(props,'data')
    const formRef=ref()
    const drawable=computed({
      get:()=>{
        return props.data.state && props.data.data.code=='aws-email'
      },
      set:(v)=>{
        props.data.state=v
      }
    })

    const validateSelect=(rule, value, callback)=>{
      if(rule.field == 'name'){
        if(config.value.data.name == undefined || config.value.data.name==''){
          callback(t('awsEmailConfig.nameRequired'))
        }else{
          callback()
        }
      }else if(rule.field == 'host'){
        if(config.value.data.config.host == undefined || config.value.data.config.host==''){
          callback(t('awsEmailConfig.hostRequired'))
        }else{
          callback()
        }
      }else if(rule.field == 'user'){
        if(config.value.data.config.smtpUsername == undefined || config.value.data.config.smtpUsername==0){
          callback(t('awsEmailConfig.userRequired'))
        }else{
          callback()
        }
      }else if(rule.field == 'from'){
        if(config.value.data.config.from == undefined || config.value.data.config.from==''){
          callback(t('awsEmailConfig.fromRequired'))
        }else{
          callback()
        }
      }else if(rule.field == 'pass'){
        if(config.value.data.config.smtpPassword == undefined || config.value.data.config.smtpPassword==''){
          callback(t('awsEmailConfig.passRequired'))
        }else{
          callback()
        }
      }

    }
    const rules=ref({
      name:[{validator:validateSelect, trigger: 'blur' }],
      host:[{validator:validateSelect, trigger: 'blur' }],
      from:[{validator:validateSelect, trigger: 'blur' }],
      user:[{validator:validateSelect, trigger: 'blur' }],
      pass:[{validator:validateSelect, trigger: 'blur' }]
    })

    const closeClick=()=>{
      context.emit('close')
    }
    const submitClick=()=>{
      formRef.value.validate((valid, fields) => {
        if (valid) {
          console.log('submitClick')
          context.emit('save',config.value.data)
        } else {
          console.log('error submit!', fields)
        }
      })
    }

    return {formRef,drawable,rules,config,submitClick,closeClick};
  }
});
</script>