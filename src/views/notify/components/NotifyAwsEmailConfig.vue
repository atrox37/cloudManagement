<template>
</template>
<script>
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";

export default defineComponent({
  name: "NotifyAwsEmailConfig",
  props:{
    data:{
      type: Object,
      required: true,
      default: {state:false,loading:false,data:{name:'',code:'email',config:{host:'',port:0,pass:'',from:''}}}
    }
  },
  emits:['save','close'],
  setup() {

    return {};
  }
});
</script>