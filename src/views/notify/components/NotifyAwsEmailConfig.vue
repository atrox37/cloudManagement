<template>
  <el-drawer v-model="drawable" title="AWS邮箱配置">
    <template #default>
      <el-form :inline="false" :model="config.data" ref="formRef" :rules="rules" label-position="left" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="config.data.name" placeholder="请输入名称" clearable/>
        </el-form-item>
        <el-form-item label="smtp地址" prop="host">
          <el-input v-model="config.data.config.host" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="smtp用户" prop="user">
          <el-input v-model="config.data.config.smtpUsername" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="smtp秘钥" prop="pass">
          <el-input v-model="config.data.config.smtpPassword" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="发送邮箱" prop="from">
          <el-input v-model="config.data.config.from" placeholder="请输入名称" clearable />
        </el-form-item>
      </el-form>

    </template>
    <template #footer>
      <el-divider/>
      <div style="flex: auto;margin-top: 10px">
        <el-button @click="closeClick">取消</el-button>
        <el-button type="primary" :loading="config.loading" @click="submitClick">保存</el-button>
      </div>
    </template>

  </el-drawer>
</template>
<script>
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";

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
          callback(('不能为空'))
        }else{
          callback()
        }
      }else if(rule.field == 'host'){
        if(config.value.data.config.host == undefined || config.value.data.config.host==''){
          callback(('地址不能为空'))
        }else{
          callback()
        }
      }else if(rule.field == 'user'){
        if(config.value.data.config.smtpUsername == undefined || config.value.data.config.smtpUsername==0){
          callback(('aws用户不能为空'))
        }else{
          callback()
        }
      }else if(rule.field == 'from'){
        if(config.value.data.config.from == undefined || config.value.data.config.from==''){
          callback(('发送邮箱不能为空'))
        }else{
          callback()
        }
      }else if(rule.field == 'pass'){
        if(config.value.data.config.smtpPassword == undefined || config.value.data.config.smtpPassword==''){
          callback(('aws秘钥不能为空'))
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