<template>
    <el-drawer v-model="drawerState">
        <template #header>
            <h4>{{title}}</h4>
        </template>
        <template #default>
            <el-form :inline="false" :model="selectData" :rules="rules" ref="formRef" :label-position="right" label-width="80px">
                <el-form-item label="名称" prop="name">
                    <el-input v-model="selectData.name" placeholder="请输入名称" clearable />
                </el-form-item>
                <el-form-item label="支持协议" v-if="supports.length>0">
                    <el-tag type="success" v-for="(item,index) in supports" :key="index">{{item.name}}</el-tag>
                </el-form-item>
                <el-form-item label="存储目标" prop="configuration.type">
                  <el-radio-group :disabled="disbale" v-model="selectData.configuration.type">
                    <el-radio-button label="S3" value="s3" />
                    <el-radio-button label="Minio" value="minio" />
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="包名" prop="configuration.provider">
                    <input type="file" id="fileId" ref="fileInput" accept=".jar" style="display: none;"/>
                    <el-input v-model="selectData.configuration.provider" placeholder="请输入包名" clearable />
                </el-form-item>
                <el-form-item label="上传" prop="configuration.location">
                    <el-input v-model="selectData.configuration.location" disabled>
                        <template #append>
                            <el-button :icon="btnStatus.icon" :loading="btnStatus.loading" @click="uploadClick">
                            </el-button>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="selectData.description" placeholder="请输入描述消息" clearable />
                </el-form-item>
            </el-form>
        </template>
        <template #footer>
            <el-divider/>
            <div style="flex: auto;margin-top: 10px">
                <el-button @click="closeClick">取消</el-button>
                <el-button type="primary" @click="submitClick">保存</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script>
    import {defineComponent,computed,ref,reactive,toRef,getCurrentInstance,onMounted,watch} from "vue"
    import {protocolType} from "@/model/protocol/ProtocolType";

    import {useRouter} from "vue-router";
    export default defineComponent({
        name: "ProtocolAdd",
        props:{
            status:{
                type: Boolean,
                required: true,
                default: false
            },
            uploadStatus:{
                type: Object,
                required: true
            },
            data:{
                type: Object,
                required: true
            }
        },
        emits:['save','upload','close'],
        setup(props,context){
            const rules = reactive({
                name: [
                    { required: true, message: '协议名称不能为空', trigger: 'blur' }
                ],
                'configuration.provider':[
                    { required: true, message: '包名不能为空', trigger: 'blur' }
                ],
                'configuration.location':[
                    { required: true, message: '协议包必须上传', trigger: 'blur' }
                ],
                'configuration.type':[
                  { required: true, message: '存储目标必须选择', trigger: 'blur' }
                ]
            })
            const type=ref(protocolType)
            const formRef=ref(null)
            const fileInput=ref(null)
            const btnStatus=toRef(props,'uploadStatus')
            const drawerState=toRef(props,'status')
            const selectData=toRef(props,'data')
            const title=computed(()=>{
                if(selectData.value.id==null){
                    return "新增"
                }else{
                    return "编辑"
                }
            })
          const disbale=computed(()=>{
            if(selectData.value.id==null){
              return false
            }else{
              return true
            }
          })

            const supports=reactive([])
            const handlerSupport=(v)=>{
                supports.length=0
                if(selectData.value.support != undefined){
                    for(var i of type.value){
                        for(var j of selectData.value.support){
                            if(i.type == j){
                                supports.push(i)
                                break
                            }
                        }
                    }
                }
            }
            watch(selectData,(v)=>{
                handlerSupport(v)
            })



            const submitClick=()=>{
                console.log('submitClick')
                formRef.value.validate().then(data=>{
                    console.log('close validate')
                    context.emit('save')
                }).catch(error=>{
                    console.log('close error')
                })

            }
            const closeClick=()=>{
                console.log('close')
                formRef.value.resetFields()
                context.emit('close')
            }
            const uploadClick=()=>{
              fileInput.value.click()
            }
            watch(fileInput,(value => {
                value.addEventListener('change',function(){
                    console.log('changeFile')
                    if(this.files.length>0){
                        context.emit('upload',selectData.value.id==undefined?{file:this.files[0],provider:selectData.value.configuration.provider,bucketType:selectData.value.configuration.type}:{id:selectData.value.id,file:this.files[0],provider:selectData.value.configuration.provider,bucketType:selectData.value.configuration.type})
                    }

                    fileInput.value.value=null
                })
            }))
            return {supports,rules,formRef,btnStatus,fileInput,title,disbale,drawerState,selectData,submitClick,closeClick,uploadClick}
        }
    })
</script>