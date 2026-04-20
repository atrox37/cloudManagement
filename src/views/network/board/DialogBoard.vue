<template>
  <el-dialog v-model="data.status" :title="title">
    <el-form :model="data.data" label-width="80" :rules="rules" ref="formRef">
      <el-form-item :label="$t('common.name')" prop="name">
        <el-input v-model="data.data.name" placeholder="Please input" />
      </el-form-item>
      <el-form-item :label="$t('dialogBoard.topic')" prop="topic">
        <el-input v-model="data.data.topic" placeholder="Please input" />
      </el-form-item>
      <el-form-item :label="$t('dialogBoard.message')" prop="data">
        <el-input v-model="data.data.data" placeholder="Please input" />
      </el-form-item>
      <el-form-item :label="$t('dialogBoard.target')">
        <template #default="scope">
          <el-checkbox-group v-model="data.data.cluster">
            <el-checkbox :label="$t('dialogBoard.gateway')" value="gateway" />
            <el-checkbox :label="$t('dialogBoard.device')" value="device" />
          </el-checkbox-group>
        </template>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="right-flex-contain">
        <el-button type="primary" @click="save">{{ $t('dialogBoard.confirmBtn') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: "DialogBoard",
  props:{
    board:{
      type: Object,
      required: false,
      default: () => ({status:false,index:-1,data:{name:'',topic:'',data:''}})
    }
  },
  emits:['submit'],
  setup(props, context) {
    const { t } = useI18n()
    const data=toRef(props,'board')
    const formRef=ref(null)
    const title=computed(()=>data.value.index<0 ? t('dialogBoard.addTitle') : t('dialogBoard.editTitle'))

    const validateSelect = (rule, value, callback) => {
      if (rule.field == "name") {
        if (
          data.value.data.name == undefined ||
          data.value.data.name == ""
        ) {
          callback(t('dialogBoard.nameRequired'));
        } else {
          callback();
        }
      }else if (rule.field == "topic") {
        if (
          data.value.data.topic == undefined ||
          data.value.data.topic == ""
        ) {
          callback(t('dialogBoard.topicRequired'));
        } else {
          callback();
        }
      }else if (rule.field == "data") {
        if (
          data.value.data.data == undefined ||
          data.value.data.data == ""
        ) {
          callback(t('dialogBoard.messageRequired'));
        } else {
          callback();
        }
      }
    };
    const rules = ref({
      name: [{ validator: validateSelect, trigger: "blur" }],
      topic: [{ validator: validateSelect, trigger: "blur" }],
      data: [{ validator: validateSelect, trigger: "blur" }]
    });


    const save=()=>{
      console.log('save')
      formRef.value.validate((valid, fields) => {
        if (valid) {
          context.emit("submit",data.value.index,data.value.data)
        } else {
          console.log("error submit!", fields);
        }
      });
    }
    return {
      title,
      formRef,
      rules,
      data,
      save
    };
  }
});
</script>
