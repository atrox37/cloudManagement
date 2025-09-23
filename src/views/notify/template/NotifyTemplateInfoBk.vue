<template>
    <div v-if="!loading" style="width: 100%;height:100%;padding: 0;margin: 0px">
        <MenuContainerHeader :label="titleLabel" @backFunc="backClick">
        </MenuContainerHeader>
        <div class="tab-container">
            <el-row>
                <el-col :span="12"><div class="center-flex-contain title_label">通知基本信息</div></el-col>
                <el-col :span="12"><div class="center-flex-contain title_label">模板数据模型</div></el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-descriptions title="" column="2" border>
                        <el-descriptions-item v-for="(item,index) in selectConfig" :label="item.label">{{item.value}}</el-descriptions-item>
                    </el-descriptions>
                </el-col>
                <el-col :span="12">
                    <el-form :model="contentModel" label-width="auto" label-position="right">
                        <el-form-item v-for="(item,index) in contentModel" :key="index" :label="item.name">
                            <el-input v-model="templateContentData[item.name]" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="info" @click="onSend">测试</el-button>
                            <el-button type="primary" @click="onSubmit">保存</el-button>
                        </el-form-item>
                    </el-form>
                </el-col>

            </el-row>
        </div>
    </div>
    <Loading :loading="loading"></Loading>
    <el-dialog v-model="showSend" title="模板测试" width="30%">
        <el-divider content-position="left">模板信息</el-divider>
        <el-form :model="sendData" label-position="right">
            <el-form-item v-for="(item,index) in sendData" :key="index" :label="item.name" label-width="80px">
                <el-input v-model="item.value"/>
            </el-form-item>
        </el-form>
        <el-divider content-position="left">接受人</el-divider>
        <el-form :model="sendReceiver" label-position="right">
            <el-form-item :label="notifyConfig.code.msgName" label-width="80px">
                <el-input v-model="sendReceiver.to"/>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="right-flex-contain">
                <el-button @click="showSend = false">关闭</el-button>
                <el-button type="primary" @click="showSend = false">发送</el-button>
            </div>
        </template>
    </el-dialog>
</template>
<script>
    import MenuContainerHeader from '@/components/menuContain/MenuContainerHeader.vue';
    import Loading from '@/components/load/Loading.vue';
    import {defineComponent,reactive,ref,getCurrentInstance,onMounted,watch} from "vue"
    import {useRoute, useRouter} from "vue-router";
    import { ElMessage } from 'element-plus'
    export default defineComponent({
        name: "NotifyTemplateInfoBk",
        components:{MenuContainerHeader,Loading},
        setup(){
            const {proxy} = getCurrentInstance()
            const route = useRoute()
            const router=useRouter()
            const showSend=ref(false)
            const loading = ref(true)
            const configs=reactive([])
            const titleLabel=ref('模板详情')
            let contentModel=reactive([])
            let notifyConfig=ref()
            const selectConfig = reactive([])
            let templateData=ref()
            let templateContentData=ref({})

            let sendData=reactive([])
            let sendReceiver=reactive({to:""})

            let queryData;
            const supportConfigApi=()=>{
                proxy.$http.notifyPage({size:-1}).then(value => {
                    configs.length=0
                    for(var item of value.data.records){
                        configs.push(item.configPo)
                    }
                    requestContentModel()
                })
            }
            const apiMsgContent=()=>{
                sendData.length=0
                var msgContent=''
                for(var key in templateContentData.value){
                    msgContent=msgContent.concat('',templateContentData.value[key])
                }
                proxy.$http.notifyTemplateContent({content:msgContent}).then(value=>{
                    for(var item of value.data){
                        sendData.push({name:item,value:''})
                    }
                    showSend.value=true
                })
            }
            const requestInfo=()=>{
                const param={terms: [{column: "t.id",value: queryData.templateId}]}
                proxy.$http.notifyTemplateInfo(param).then(value => {
                    console.log('requestInfo')
                    notifyConfig.value=value.data.configPo
                    templateData.value=value.data.templatePo
                    loading.value=false
                    templateContentData.value=JSON.parse(templateData.value.msgContent)
                    console.log('requestInfo')
                    for(let item of configs){
                        if(item.code == value.data.configPo.code.code){
                            selectConfig.length=0
                            selectConfig.push(...item.config)
                            break;
                        }
                    }
                    for(let item in selectConfig){
                        selectConfig[item].value=notifyConfig.value.config[selectConfig[item].name]
                    }
                    console.log('requestInfo config')
                })
            }
            const requestContentModel=()=>{
                proxy.$http.notifyContentModel({code:queryData.code}).then(value => {
                    console.log('notifyContentModel')
                    contentModel.length=0
                    contentModel.push(...value.data)
                    requestInfo()
                })
            }
            const backClick=()=>{
                router.go(-1)
            }
            const handleClick=(tab, event)=>{
                console.log('item click')
            }
            const onSend=()=>{
                console.log('onSend')

                apiMsgContent()
            }
            const onSubmit=()=>{
                console.log('submit')
                apiMsgContent()
            }

            onMounted(()=>{
                queryData=route.query
                console.log('onMounted')
                supportConfigApi()

            })
            return {selectConfig,sendReceiver,sendData,showSend,loading,titleLabel,contentModel,notifyConfig,templateData,templateContentData,onSend,onSubmit,backClick,handleClick}
        }
    })
</script>

<style scoped>
    .title_label{
        color: var(--el-color-info);
        padding: 5px 0 15px 0;
        box-sizing: border-box;
    }
    .tab-container{
        width: calc(100% - 20px);
        height: calc(100% - 80px);
        padding: 0px;
        margin: 0 10px 10px 10px;
        box-sizing: border-box;
        background: white;
    }
</style>