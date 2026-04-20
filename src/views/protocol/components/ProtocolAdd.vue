<template>
    <el-drawer v-model="drawerState">
        <template #header>
            <h4>{{title}}</h4>
        </template>
        <template #default>
            <el-form :inline="false" :model="selectData" :rules="rules" ref="formRef" :label-position="right" label-width="100px">
                <el-form-item :label="$t('common.name')" prop="name">
                    <el-input v-model="selectData.name" :placeholder="$t('protocolAdd.namePlaceholder')" clearable />
                </el-form-item>
                <el-form-item :label="$t('protocolAdd.supportProtocol')" v-if="supports.length>0">
                    <el-tag type="success" v-for="(item,index) in supports" :key="index">{{item.name}}</el-tag>
                </el-form-item>
                <el-form-item :label="$t('protocolAdd.storageTarget')" prop="configuration.type">
                  <el-radio-group :disabled="disbale" v-model="selectData.configuration.type">
                    <el-radio-button label="S3" value="s3" />
                    <el-radio-button label="Minio" value="minio" />
                  </el-radio-group>
                </el-form-item>
                <el-form-item :label="$t('protocolAdd.packageName')" prop="configuration.provider">
                    <input type="file" id="fileId" ref="fileInput" accept=".jar" style="display: none;"/>
                    <el-input v-model="selectData.configuration.provider" :placeholder="$t('protocolAdd.packagePlaceholder')" clearable />
                </el-form-item>
                <el-form-item :label="$t('protocolAdd.upload')" prop="configuration.location">
                    <el-input v-model="selectData.configuration.location" disabled>
                        <template #append>
                            <el-button :icon="btnStatus.icon" :loading="btnStatus.loading" @click="uploadClick">
                            </el-button>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item :label="$t('protocolAdd.description')">
                    <el-input v-model="selectData.description" :placeholder="$t('protocolAdd.descriptionPlaceholder')" clearable />
                </el-form-item>
            </el-form>
        </template>
        <template #footer>
            <el-divider/>
            <div style="flex: auto;margin-top: 10px">
                <el-button @click="closeClick">{{ $t('common.cancel') }}</el-button>
                <el-button type="primary" @click="submitClick">{{ $t('common.save') }}</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script>
    import {defineComponent,computed,ref,reactive,toRef,getCurrentInstance,onMounted,watch} from "vue"
    import {protocolType} from "@/model/protocol/ProtocolType";
    import {useRouter} from "vue-router";
    import { useI18n } from 'vue-i18n';

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
            const { t } = useI18n()
            const rules = computed(() => ({
                name: [
                    { required: true, message: t('protocolAdd.nameRequired'), trigger: 'blur' }
                ],
                'configuration.provider':[
                    { required: true, message: t('protocolAdd.packageRequired'), trigger: 'blur' }
                ],
                'configuration.location':[
                    { required: true, message: t('protocolAdd.locationRequired'), trigger: 'blur' }
                ],
                'configuration.type':[
                  { required: true, message: t('protocolAdd.storageTarget'), trigger: 'blur' }
                ]
            }))
            const type=ref(protocolType)
            const formRef=ref(null)
            const fileInput=ref(null)
            const btnStatus=toRef(props,'uploadStatus')
            const drawerState=toRef(props,'status')
            const selectData=toRef(props,'data')
            const title=computed(()=>{
                if(selectData.value.id==null){
                    return t('common.add')
                }else{
                    return t('common.edit')
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
