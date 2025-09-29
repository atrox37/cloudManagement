<template>
    <el-drawer v-model="drawable" title="邮箱配置" >
        <template #default>
            <el-form :inline="false" :model="emailData.data" ref="formRef" :rules="rules" label-position="left" label-width="80px">
                <el-form-item label="名称" prop="name">
                    <el-input v-model="emailData.data.name" placeholder="请输入名称" clearable/>
                </el-form-item>
                <el-form-item label="smtp地址" prop="host">
                    <el-input v-model="emailData.data.config.host" placeholder="请输入名称" clearable />
                </el-form-item>
                <el-form-item label="smtp端口" prop="port">
                    <el-input-number v-model="emailData.data.config.port" placeholder="请输入名称" clearable />
                </el-form-item>
                <el-form-item label="发送邮箱" prop="from">
                    <el-input v-model="emailData.data.config.from" placeholder="请输入名称" clearable />
                </el-form-item>
                <el-form-item label="密码" prop="pass">
                    <el-input v-model="emailData.data.config.pass" placeholder="请输入名称" clearable />
                </el-form-item>
            </el-form>

        </template>
        <template #footer>
            <el-divider/>
            <div style="flex: auto;margin-top: 10px">
                <el-button @click="closeClick">取消</el-button>
                <el-button type="primary" :loading="emailData.loading" @click="submitClick">保存</el-button>
            </div>
        </template>

    </el-drawer>
    
</template>

<script>
    import {defineComponent, reactive, ref, getCurrentInstance, onMounted, toRef,computed} from "vue"
    import {useRouter} from "vue-router";
    export default defineComponent({
        name: "NotifyEmailConfig",
        props:{
            data:{
                type: Object,
                required: true,
                default: {state:false,loading:false,data:{name:'',code:'email',config:{host:'',port:0,pass:'',from:''}}}
            }
        },
        emits:['save','close'],
        setup(props,context){
            const emailData=toRef(props,'data')
            const drawable=computed({
              get:()=>{
                return props.data.state && props.data.data.code=='email'
              },
              set:(v)=>{
                props.data.state=v
                //emailData.value.state=v
              }
            })
            const formRef=ref()
            /*const drawable=computed({
                get(){
                    if(emailData.value.data.config==undefined){
                        return false
                    }else{
                        if(formRef.value!=undefined){
                            formRef.value.clearValidate()
                        }
                        return emailData.value.data.config.type=='email'&&emailData.value.state
                    }
                },
                set(newValue){
                    emailData.value.state=newValue
                }
            })*/
            const validateSelect=(rule, value, callback)=>{
                if(rule.field == 'name'){
                    if(emailData.value.data.name == undefined || emailData.value.data.name==''){
                        callback(('用户名不能为空'))
                    }else{
                        callback()
                    }
                }else if(rule.field == 'host'){
                    if(emailData.value.data.config.host == undefined || emailData.value.data.config.host==''){
                        callback(('地址不能为空'))
                    }else{
                        callback()
                    }
                }else if(rule.field == 'port'){
                    if(emailData.value.data.config.port == undefined || emailData.value.data.config.port==0){
                        callback(('端口不能为0'))
                    }else{
                        callback()
                    }
                }else if(rule.field == 'from'){
                    if(emailData.value.data.config.from == undefined || emailData.value.data.config.from==''){
                        callback(('发送邮箱不能为空'))
                    }else{
                        callback()
                    }
                }else if(rule.field == 'pass'){
                    if(emailData.value.data.config.pass == undefined || emailData.value.data.config.pass==''){
                        callback(('邮箱密码不能为空'))
                    }else{
                        callback()
                    }
                }

            }
            const rules=ref({
                name:[{validator:validateSelect, trigger: 'blur' }],
                host:[{validator:validateSelect, trigger: 'blur' }],
                port:[{validator:validateSelect, trigger: 'blur' }],
                from:[{validator:validateSelect, trigger: 'blur' }],
                pass:[{validator:validateSelect, trigger: 'blur' }]
            })
            const closeClick=()=>{
                context.emit('close')
            }
            const submitClick=()=>{
                formRef.value.validate((valid, fields) => {
                    if (valid) {
                        console.log('submitClick')
                        context.emit('save',emailData.value.data)
                    } else {
                        console.log('error submit!', fields)
                    }
                })
            }
            return {
                rules,
                drawable,
                formRef,
                emailData,
                closeClick,
                submitClick
            }
        }
    })
</script>

<style scoped>

</style>