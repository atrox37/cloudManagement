<template>
  <el-dialog v-model="templateData.state" :title="$t('notifyDialog.addTemplate')" width="500">
    <el-form :model="templateData" ref="templateForm" :rules="rules">
      <el-form-item :label="$t('notifyDialog.notifyName')" prop="name">
        <el-input v-model="templateData.data.name" />
      </el-form-item>
      <el-form-item :label="$t('notifyDialog.notifyConfig')" prop="configId">
        <el-select
            v-model="templateData.data.configId"
            placeholder="Select"
            size="large"
        >
          <el-option
              v-for="item in configData"
              :key="item.id"
              :label="item.name"
              :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="right-flex-contain">
        <el-button @click="submit" :loading="templateData.loading">{{ $t('notifyDialog.save') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
  import {defineComponent, ref, onMounted, getCurrentInstance, toRef,watch} from "vue"
  import { useI18n } from 'vue-i18n'
  export default defineComponent({
    name: 'NotifyTemplateDialog',
    emits:['save'],
    props:{
      data:{
        type: Object,
        required: false,
        default: () => ({state:false,loading:false,data:{name:'',configId:undefined,msgType:1,variables:{}}})
      },
      config:{
        type: Array,
        required: false,
        default: ()=> ([])
      }
    },
    setup(props,context) {
      const {proxy} = getCurrentInstance()
      const { t } = useI18n()
      const templateData=toRef(props,'data')
      const configData=toRef(props,'config')
      const templateForm=ref(null)
      const validateSelect=(rule, value, callback)=>{
        if(rule.field == 'name'){
          if(templateData.value.data.name == undefined || templateData.value.data.name==''){
            callback((t('notifyDialog.nameRequired')))
          }else{
            callback()
          }
        }else if(rule.field == 'configId'){
          if(templateData.value.data.configId == undefined){
            callback((t('notifyDialog.configRequired')))
          }else{
            callback()
          }
        }

      }
      const rules=ref({
        name:[{validator:validateSelect, trigger: 'blur' }],
        notifyId:[{validator:validateSelect, trigger: 'blur' }]
      })
      const submit=()=>{
        templateForm.value.validate((valid, fields) => {
          if (valid) {
            console.log('submitClick')
            context.emit('save',templateData.value.data)
          } else {
            console.log('error submit!', fields)
          }
        })
      }
      return {
        rules,
        templateForm,
        templateData,
        configData,
        submit}
    }
  })
</script>
