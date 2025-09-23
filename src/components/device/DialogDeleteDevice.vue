<template>
  <el-dialog v-model="data.status" title="警告" :close-on-click-modal="false" :close-on-press-escape="false">
    <el-text size="large">确定是否需要删除该设备</el-text>
    <template #footer>
      <div class="right-flex-contain">
        <el-space wrap>
          <el-button @click="cancelClick">取消</el-button>
          <el-button type="primary" @click="submitClick" :loading="data.loading">提交</el-button>
        </el-space>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import {onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed} from "vue"

export default defineComponent({
  name: "DialogDeleteDevice",
  props:{
    data:{
      type: Object,
      required: false,
      default: () => ({status:false,loading:false,device:{}})
    }
  },
  emits:["cancel","submit"],
  setup(props,context) {
    let data = toRef(props,'data');
    const submitClick=()=>{
      context.emit('submit',data.value.device)
    }

    const cancelClick=()=>{
      context.emit('cancel')
    }

    return {
      data,
      submitClick,
      cancelClick
    }
  }
})
</script>