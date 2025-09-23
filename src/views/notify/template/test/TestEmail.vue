<template>
    <el-dialog v-model="testData.state" :title="titleP" width="30%">
        <el-divider content-position="left">基本信息</el-divider>
          <el-form ref="formRef" :rules="rules" :model="testData" label-position="right">
            <el-form-item label="名称" label-width="80px" prop="name">
              <el-input v-model="testData.name"/>
            </el-form-item>
            <el-form-item label="邮箱" label-width="80px" prop="to">
              <el-input v-model="testData.receiver"/>
            </el-form-item>
          </el-form>
        <el-divider content-position="left">模板信息</el-divider>
        <el-form  :model="testData" label-position="right">
            <el-form-item v-for="(item,index) in testData.sendData" :key="index" :label="item.name" label-width="80px">
                <el-input v-model="item.value"/>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="right-flex-contain">
                <el-button type="primary" @click="testClick" :loading="testData.loading">{{submitStr}}</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script>
    import {defineComponent, watch, ref, getCurrentInstance, onMounted, toRef, computed} from "vue"

    export default defineComponent({
        name: "TestEmail",
        props: {
            title:{
                type: String,
                required: true
            },
            submitLabel:{
                type: String,
                required: true
            },
            data: {
                type: Object,
                required: true,
                default: () => ({id:undefined,name:'',templateId:undefined,state: false, sendData: [], receiver: "",loading:false})
            }
        },
        emits: ['click'],
        setup(props, context) {
            const titleP = toRef(props, 'title')
            const submitStr=toRef(props,'submitLabel')
            const testData = toRef(props, 'data')
            const formRef = ref()
            const validateSelect=(rule, value, callback)=>{
              console.log('validateSelect')
                if(rule.field == 'to'){
                    if(testData.value.receiver == undefined || testData.value.receiver==''){
                        callback(('邮箱不能为空'))
                    }else{
                        callback()
                    }
                }else if(rule.field == 'name'){
                  if(testData.value.name == undefined || testData.value.name==''){
                    callback(('名称不能为空'))
                  }else{
                    callback()
                  }
                }

            }
            const rules=ref({
                to:[{validator:validateSelect, trigger: 'blur' }],
              name:[{validator:validateSelect, trigger: 'blur' }]
            })
            const testClick = () => {
                formRef.value.validate((valid, fields) => {
                    var repo={notifyPo:{},templatePo:{},receiverPo:{variables:{},receiver:testData.value.receiver}}
                    if(testData.value.id!=undefined)repo.receiverPo.id=testData.value.id
                    if(testData.value.name!=undefined)repo.receiverPo.name=testData.value.name
                    if(testData.value.templateId!=undefined)repo.receiverPo.templateId=testData.value.templateId
                    if (valid) {
                        for(var item of testData.value.sendData){
                            repo.receiverPo.variables[item.name]=item.value
                        }
                        context.emit('click', repo)
                    } else {
                        console.log('error submit!', fields)
                    }
                })

            }

            return {
                submitStr,
                titleP,
                rules,
                formRef,
                testData,
                testClick
            }
        }
    })
</script>

<style scoped>

</style>