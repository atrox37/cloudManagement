<template>
    <el-table :data="notifyD" border>
        <el-table-column label="类型" >
            <template #default="scope">
                <el-radio-group v-model="scope.row.handlerType.value" style="margin: 0 0 0 5px;width: 70%">
                    <el-radio-button label="通知" value="notify" />
                    <el-radio-button label="功能" value="function" />
                </el-radio-group>
            </template>
        </el-table-column>
        <el-table-column label="通知配置" >
            <template #default="scope">
                <el-select placeholder="Select" v-if="scope.row.handlerType.value == 'notify'" v-model="scope.row.configId" @change="selectChangeNotify(scope)">
                    <el-option v-for="(item,index) in notifyConfig" :key="index" :label="item.name" :value="item.id"></el-option>
                </el-select>
                <el-select placeholder="Select" v-if="scope.row.handlerType.value == 'function'" v-model="scope.row.handlerData.functionId" @change="selectChangeFunc(scope)">
                    <el-option v-for="(item,index) in functions" :key="index" :label="item.name" :value="item.id"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="模板参数" >
            <template #default="scope">
                <el-select placeholder="Select" v-model="scope.row.notifyTemplateId" v-if="scope.row.handlerType.value == 'notify'">
                    <el-option v-for="(item,index) in scope.row.templates" :key="index" :label="item.name" :value="item.id"></el-option>
                </el-select>
                <el-popover placement="right" :width="400" :visible="popoverVisible" trigger="click" title="下发参数" v-if="scope.row.handlerType.value == 'function'">
                    <template #reference>
                        <el-input
                                v-model="scope.row.handlerData.params"
                                disabled
                                style="margin: 0;">
                            <template #append>
                                <el-button size="small" icon="Search" @click="popoverVisible=true" />
                            </template>
                        </el-input>
                    </template>
                    <el-table :data="scope.row.handlerData.paramObj">
                        <el-table-column prop="arg" label="参数标识"/>
                        <el-table-column prop="argName" label="参数名称"/>
                        <el-table-column label="值">
                            <template #default="scope">
                                <el-input v-model="scope.row.val"></el-input>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="right-flex-contain" style="margin-top: 5px">
                        <el-button size="small" type="primary" @click="parseFunJson(scope)">保存</el-button>
                        <el-button size="small">关闭</el-button>
                    </div>
                </el-popover>
            </template>
        </el-table-column>
        <el-table-column width="80" align="center">
            <template #header>
                <el-button type="primary" icon="Plus" size="small" @click="addFunc"/>
            </template>
            <template #default="scope">
                <el-button type="primary" class="custom-class" icon="Delete" size="small" @click="delFunc(scope.$index)"/>
            </template>
        </el-table-column>
    </el-table>
</template>

<script>
    import {ref, reactive, defineComponent, computed, onMounted, toRef,watch, getCurrentInstance} from "vue";
    import { Search } from '@element-plus/icons-vue'
    export default defineComponent({
        name: "AlarmNotify",
        props:{
            deviceData:{
                type: Object,
                required: true,
                default: () => ({})
            },
            notifyData:{
                type: Object,
                required: true,
                default: () => ([])
            }
        },
        setup(props,context){
            const {proxy} = getCurrentInstance()
            const aceOptions=ref({
                useWorker:true,
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
                tabSize: 2,
                highlightActiveLine:true,
                showPrintMargin: false,
                fontSize: 13,
                enableAutoIndent:true,
                showInvisibles:true
            })
            const popoverVisible=ref(false)
            const jsonData=ref(JSON.stringify({ message: 'Hello Ace' }))
            const sourceDevice=toRef(props,'deviceData')
            const notify=toRef(props,'notifyData')
            const notifyD=reactive([])
            const functions=reactive([])
            const notifyConfig=reactive([])
            const notifyTemplate=reactive([])
            const selectNotifyConfig=ref({})


            watch(notify,value => {
                console.log("notifyD")
                handlerNotify(value)
            })
            watch(sourceDevice,value=>{
                handlerDevice(value)
            })

            const resetData=(d)=>{
                console.log('reset data')
                handlerNotify(d)
            }

            const parseFunJson=(scope)=>{
                console.log('parseFunJson:{}',parseFunJson.valueOf())
                var paramObj={}
                for(var parseItem of notifyD[scope.$index].handlerData.paramObj){
                    paramObj[parseItem.arg]=parseItem.val
                }
                notifyD[scope.$index].handlerData.params=JSON.stringify(paramObj)
                popoverVisible.value=false
            }
            const paramFunJson=(json)=>{
                var r=[]
                if(json.handlerType.value=='function'){
                    let funId=json.handlerData.functionId
                    var parse = json.handlerData.params
                    for(let item in parse){
                        var argName=''
                        for(let funItem of sourceDevice.value.deviceInstancePo.metadata.functions){
                            if (funItem.id == funId){
                                for(let argsItem of funItem.inputs){
                                    if(argsItem.id==item){
                                        argName=argsItem.name
                                        break;
                                    }
                                }
                            }
                        }
                        r.push({arg:item,argName:argName,val:parse[item]})
                    }
                }

                return r
            }
            const handlerDevice=(value)=>{
                functions.push(...value.deviceInstancePo.metadata.functions)
                console.log("functionsD")
            }
            const handlerNotify=(value)=>{
                notifyD.length=0
                for (let nItem of value){
                    nItem.handlerData.paramObj=paramFunJson(nItem)
                    notifyD.push(nItem)
                }
                console.log("handlerNotify")
            }

            const apiNotifyConfig=()=> {
                proxy.$http.notifyPage({size: -1}).then(value => {
                    notifyConfig.length = 0
                    for(let item of value.data.records){
                        notifyConfig.push(item.configPo)
                    }
                    console.log('apiNotifyConfig')
                })
            }

            const apiNotifyTemplate=()=>{
                proxy.$http.notifyTemplatePage({size:-1}).then(value=>{
                    notifyTemplate.length=0
                    for(let item of value.data.records){
                        var exit=false;
                        for(let index in notifyTemplate){
                            if(notifyTemplate[index].configPo.id == item.configPo.id){
                                exit=true;
                                notifyTemplate[index].templates.push(item.templatePo)
                                break;
                            }
                        }
                        if(!exit){
                            notifyTemplate.push({configPo:item.configPo,templates:[item.templatePo]})
                        }

                    }
                    for(let item of value.data.records){
                        for(let index in notifyD){
                            if(notifyD[index].handlerType.value=='notify'&&notifyD[index].notifyTemplateId==item.templatePo.id){
                                notifyD[index].configId=item.configPo.id;
                                notifyD[index].templates=[]
                                break;
                            }
                        }
                    }
                    for(let item of value.data.records){
                        for(let index in notifyD){
                            if(notifyD[index].handlerType.value=='notify'&&notifyD[index].configId==item.configPo.id){
                                notifyD[index].templates.push(item.templatePo)
                            }
                        }
                    }
                    console.log('apiNotifyTemplate')
                })
            }

            const selectChangeNotify=(value)=>{
                console.log('selectChangeNotify,'+value.$index+'  '+notifyD[value.$index].configId)
                notifyD[value.$index].notifyTemplateId=-1
                for(let item of notifyTemplate){
                    if(item.configPo.id == notifyD[value.$index].configId){
                        notifyD[value.$index].templates.length=0
                        notifyD[value.$index].templates.push(...item.templates)
                    }
                }
            }
            const selectChangeFunc=(value)=>{
                console.log('selectChangeFunc')
            }

            const addFunc=()=>{
                console.log('addFunc')
            }
            const delFunc=(index)=>{
                console.log('delFunc:',index)
            }
            onMounted(()=>{
                console.log(JSON.stringify(sourceDevice.value))
                handlerDevice(sourceDevice.value)
                handlerNotify(notify.value)
                apiNotifyTemplate()
                apiNotifyConfig()
            })

            const funcSelectData=computed(()=>{
                return sourceDevice.value.deviceInstancePo.metadata.functions
            })


            return {
                functions,
                popoverVisible,
                selectNotifyConfig,
                jsonData,
                notifyD,
                notifyConfig,
                notifyTemplate,
                funcSelectData,
                aceOptions,
                parseFunJson,
                selectChangeNotify,
                selectChangeFunc,
                addFunc,
                delFunc,
                resetData
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