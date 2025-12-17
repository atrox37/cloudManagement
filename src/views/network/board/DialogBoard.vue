<template>
  <el-dialog v-model="data.status" :title="title">
    <el-form :model="data.data" label-width="50" :rules="rules" ref="formRef">
      <el-form-item label="名称" prop="name">
        <el-input v-model="data.data.name" placeholder="Please input" />
      </el-form-item>
      <el-form-item label="主题" prop="topic">
        <el-input v-model="data.data.topic" placeholder="Please input" />
      </el-form-item>
      <el-form-item label="报文" prop="data">
        <el-input v-model="data.data.data" placeholder="Please input" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="right-flex-contain">
        <el-button type="primary" @click="save">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";

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
    const data=toRef(props,'board')
    const formRef=ref(null)
    const title=computed(()=>data.value.index<0?'新增':'修改')

    const validateSelect = (rule, value, callback) => {
      if (rule.field == "name") {
        if (
          data.value.data.name == undefined ||
          data.value.data.name == ""
        ) {
          callback("名称不能为空");
        } else {
          callback();
        }
      }else if (rule.field == "topic") {
        if (
          data.value.data.topic == undefined ||
          data.value.data.topic == ""
        ) {
          callback("主题不能为空");
        } else {
          callback();
        }
      }else if (rule.field == "data") {
        if (
          data.value.data.data == undefined ||
          data.value.data.data == ""
        ) {
          callback("报文不能为空");
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