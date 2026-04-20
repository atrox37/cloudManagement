<template>
  <el-dialog v-model="deviceData.state.dialog" :title="$t('propertyControl.writeTitle')" :show-close="false" width="30%">
    <el-form :model="deviceData.meta" label-width="auto">
      <el-form-item :label="deviceData.meta.name" v-if="deviceData.meta.valueType.type=='string'">
        <el-input v-model="sendData.value" />
      </el-form-item>
      <el-form-item :label="deviceData.meta.name" v-if="deviceData.meta.valueType.type=='number'">
        <el-input-number v-model="sendData.value" />
      </el-form-item>
      <el-form-item :label="deviceData.meta.name" v-if="deviceData.meta.valueType.type=='enum'">
        <el-select v-model="sendData.value">
          <el-option v-for="(item,key) in deviceData.meta.valueType.extra.enumData" :key="key" :label="item.value" :value="item.key"></el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeClick">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="submitClick" :loading="deviceData.state.loading">{{ $t('propertyControl.writeTitle') }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
import {defineComponent, ref, onMounted, onActivated, getCurrentInstance, toRef, watch, reactive} from "vue"
import { useI18n } from "vue-i18n"

export default defineComponent({
  name: 'DialogPropertyControl',
  emits: ['close','submit'],
  props: {
    data:{
      type:Object,
      required: true,
      default: ()=>({state:{loading:false,dialog:false},meta:{}})
    }
  },
  setup(props, context) {
    const { t } = useI18n()
    const {proxy} = getCurrentInstance()
    const deviceData=toRef(props,'data')
    const sendData=reactive({id:deviceData.value.meta.id,value:''})

    const closeClick=()=>{
      console.log('closeClick')
      context.emit('close')
    }
    const submitClick=()=>{
      sendData.id=deviceData.value.meta.id
      console.log('submitClick:'+JSON.stringify(deviceData.value))
      context.emit('submit',sendData)
    }
    return {
      sendData,
      deviceData,
      closeClick,
      submitClick
    }
  }
})
</script>    