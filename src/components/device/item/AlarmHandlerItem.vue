<template>
    <el-row class="border-dash">
        <el-col :span="5">
            <el-text style="width: 30%">类型</el-text>
            <el-radio-group v-model="data.handlerType.value" style="margin: 0 0 0 5px;width: 70%">
                <el-radio-button label="通知" value="notify" />
                <el-radio-button label="功能" value="function" />
            </el-radio-group>
        </el-col>
        <el-col :span="7">
            <el-text size="small" style="width: 20%" v-if="data.handlerType.value == 'notify'">通知配置:</el-text>
            <el-select style="margin: 0 0 0 5px;width: calc(80% - 5px)" placeholder="Select" v-model="selectNotifyConfig.id" @change="notifyConfigChange" v-if="data.handlerType.value == 'notify'">
                <el-option v-for="(item,index) in notifyConfig" :key="index" :label="item.configPo.name" :value="item.configPo.id"></el-option>
            </el-select>
            <el-text size="small" style="width: 20%" v-if="data.handlerType.value == 'function'">设备功能:</el-text>
            <el-select style="margin: 0 0 0 5px;width: calc(80% - 5px)" placeholder="Select" v-model="data.handlerData.functionId" @change="notifyFunctionChange" v-if="data.handlerType.value == 'function'">
                <el-option v-for="(item,index) in funcSelectData" :key="index" :label="item.name" :value="item.id"></el-option>
            </el-select>
        </el-col>
        <el-col :span="6">
            <el-text size="small" style="width: 20%" v-if="data.handlerType.value == 'notify'">通知模板:</el-text>
            <el-select style="margin: 0 0 0 5px;width: calc(80% - 5px)" placeholder="Select" v-model="data.notifyTemplateId" v-if="data.handlerType.value == 'notify'" @change="templateChange">
                <el-option v-for="(item,index) in notifyTemplate" :key="index" :label="item.templatePo.name" :value="item.templatePo.id"></el-option>
            </el-select>

            <el-text size="small" style="width: 20%" v-if="data.handlerType.value == 'function'">功能参数:</el-text>
            <el-popover placement="right" :width="400" trigger="click" v-if="data.handlerType.value == 'function'" @hide="popHide">
                <template #reference>
                    <el-input
                            v-model="data.handlerData.params"
                            disabled
                            style="margin: 0 0 0 5px;width: calc(80% - 5px)">
                        <template #append>
                            <el-button size="small" icon="Search" />
                        </template>
                    </el-input>
                </template>
                <v-ace-editor
                        ref="aceEditor"
                        v-model:value="functionParams"
                        lang="json"
                        :options="options"
                        theme="chrome"
                        style="height: 300px;width: 100%" />
            </el-popover>

        </el-col>
        <el-col :span="4">
            <div class="center-flex-contain">
                <el-button-group>
                    <el-button type="primary" icon="Plus" size="small" @click="addFunc"/>
                    <el-button type="primary" class="custom-class" icon="Delete" size="small" @click="delFunc(index)"/>
                </el-button-group>
            </div>
        </el-col>
    </el-row>
</template>

<script>
    import {ref, reactive, defineComponent, computed, onMounted, toRef,watch, getCurrentInstance} from "vue";
    import { Search } from '@element-plus/icons-vue'
    import { ElMessage } from 'element-plus'
    export default defineComponent({
        name: "AlarmHandlerItem",
        props:{
            deviceData:{
                type: Object,
                required: true,
                default: () => ({})
            },
            notifyPo:{
                type: Object,
                required: true,
                default: () => ({})
            }
        },
        setup(props,context){
            const {proxy} = getCurrentInstance()
            const options=reactive({
                useWorker:true,
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
                tabSize: 2,
                highlightActiveLine:true,
                highlightSelectedWord:true,
                tabSize:4,
                wrap:false,
                readonly:true,
                showPrintMargin: false,
                fontSize: 14,
                enableAutoIndent:true,
                showInvisibles:true
            })
            const aceEditor=ref(null)
            const jsonData=ref(JSON.stringify({ message: 'Hello Ace' }));
            const sourceDevice=toRef(props,'deviceData')
            const data=toRef(props,'notifyPo')
            const notifyConfig=reactive([])
            const notifyTemplate=reactive([])
            const selectNotifyConfig=ref({})
            const notifyFunctionChange=(value)=>{
                data.value.notifyTemplateId=null
                data.value.handlerData.deviceId=sourceDevice.value.deviceInstancePo.id
            }
            const templateChange=(value)=>{
                data.value.handlerData={}
            }


            const functionParams=computed({
                get:()=>{
                    console.log('get function params')
                    return JSON.stringify(data.value.handlerData.params)
                },
                set:(val)=>{
                    console.log("set function params")
                    try{
                        const obj=JSON.parse(val)
                        data.value.handlerData.params=obj
                    }catch (e) {
                        ElMessage.error('json语法错误,请检查')
                    }
                }
            })

            const notifyConfigChange=(value)=>{
                console.log('notifyConfigChange-->'+JSON.stringify(value))
                data.value.notifyTemplateId=null
                apiNotifyTemplate(value)
            }

            const functionChange=(value)=>{
                console.log('functionChange-->'+JSON.stringify(value))
            }


            const apiNotifyConfig=()=>{
                proxy.$http.notifyPage({size: -1}).then(value => {
                    notifyConfig.length=0
                    notifyConfig.push(...value.data.records)
                })
            }

            const apiTemplateInfo=(templateId)=>{
                proxy.$http.notifyTemplateInfo({terms: [{column: "t.id",value: templateId}]}).then(value=>{
                    selectNotifyConfig.value=value.data.configPo
                    apiNotifyTemplate(value.data.configPo.id)
                })
            }

            const apiNotifyTemplate=(configId)=>{
                proxy.$http.notifyTemplatePage({size:-1,terms:[{column:'t1.id',value:configId}]}).then(value=>{
                    notifyTemplate.length=0
                    notifyTemplate.push(...value.data.records)
                })
            }
            const isValidJSON=(dataStr)=>{
                try{
                    JSON.parse(dataStr)
                    return true
                }catch(e){
                    return false
                }
            }

            const popHide=()=>{
                const valid= isValidJSON(functionParams.value)
                console.log('popHide->'+functionParams.value+" <->"+JSON.stringify(data.value.handlerData.params))
            }

            const getNotifyData=()=>{
                return data.value;
            }

            onMounted(()=>{
                console.log(JSON.stringify(data.value))
                if(data.value.notifyTemplateId!=null){
                    apiTemplateInfo(data.value.notifyTemplateId)
                }
                apiNotifyConfig()
            })

            const funcSelectData=computed(()=>{
                return sourceDevice.value.deviceInstancePo.metadata.functions
            })

            const addFunc=()=>{
                console.log('addFunc')
            }
            const delFunc=(index)=>{
                console.log('delFunc:',index)
            }
            return {
                aceEditor,
                popHide,
                functionParams,
                selectNotifyConfig,
                jsonData,
                data,
                notifyConfig,
                notifyTemplate,
                funcSelectData,
                options,
                notifyFunctionChange,
                templateChange,
                notifyConfigChange,
                functionChange,
                getNotifyData,
                addFunc,
                delFunc
            }
        }
    })
</script>

<style scoped>
    .border-dash{
        width: 100%;
        padding: 5px 10px 5px 10px;
        box-sizing: content-box;
    }
</style>