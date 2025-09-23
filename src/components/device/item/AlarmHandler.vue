<template>
    <el-table :data="notifyD" border>
        <el-table-column label="类型" >
            <template #default="scope">
                <el-radio-group v-model="scope.row.ruleMetaPo.handlerType.value">
                    <el-radio-button label="通知" value="notify" />
                    <el-radio-button label="功能" value="function" />
                </el-radio-group>
            </template>
        </el-table-column>
        <el-table-column label="通知(功能)配置" >
            <template #default="scope">
                <el-select placeholder="Select" v-if="scope.row.ruleMetaPo.handlerType.value == 'notify'" v-model="scope.row.notifyConfigPo.id" @change="(value)=>selectChangeNotifyConfig(scope.$index,value)">
                    <el-option v-for="(item,index) in notifyConfig" :key="index" :label="item.configPo.name" :value="item.configPo.id"></el-option>
                </el-select>
                <el-select placeholder="Select" v-if="scope.row.ruleMetaPo.handlerType.value == 'function'" v-model="scope.row.ruleMetaPo.handlerData.functionId" @change="(value)=>selectChangeFunc(scope.$index,value)">
                    <el-option v-for="(item,index) in functions" :key="index" :label="item.name" :value="item.id"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="发送对象(参数)" >
            <template #default="scope">
                <el-popover
                        placement="right"
                        title="通知模板"
                        v-if="scope.row.ruleMetaPo.handlerType.value == 'notify'"
                        :width="350"
                        trigger="click"
                        @show="showPopTemplate(scope.$index)">
                    <template #default>
                        <el-row :gutter="5">
                            <el-col :span="12">
                                模板
                            </el-col>
                            <el-col :span="12">
                                用户
                            </el-col>
                        </el-row>
                        <el-row :gutter="5">
                            <el-col :span="12">
                                <!--@change="(value)=>notifyTemplateChange(scope.$index,value)"-->
                                <el-select placeholder="Select" :teleported="false" v-model="scope.row.notifyTemplatePo.id" @change="(value)=>notifyTemplateChange(scope.$index,value)">
                                    <el-option v-for="(item,index) in scope.row.templates" :key="index" :label="item.name" :value="item.id"></el-option>
                                </el-select>
                            </el-col>
                            <el-col :span="12">
                                <el-select placeholder="Select" v-model="scope.row.notifyTemplateUserPo.id" :suffix-icon="templateUserIcon" :disabled="templateUserLoad" @change="(value)=>notifyTemplateUserChange(scope.$index,value)">
                                    <el-option v-for="(item,index) in scope.row.templatesUser" :key="index" :label="item.name" :value="item.id"></el-option>
                                </el-select>
                            </el-col>
                        </el-row>
                    </template>
                    <template #reference>
                        <el-input
                                placeholder="Select"
                                v-model="scope.row.notifyTemplateUserPo.name"
                                disabled>
                            <template #append>
                                <el-button size="small" icon="Search"/>
                            </template>
                        </el-input>
                    </template>
                </el-popover>

                <!--<el-select placeholder="Select" v-model="scope.row.notifyTemplatePo.id" v-if="scope.row.ruleMetaPo.handlerType.value == 'notify'">
                    <el-option v-for="(item,index) in scope.row.templates" :key="index" :label="item.templatePo.name" :value="item.templatePo.id"></el-option>
                </el-select>-->
                <el-popover
                        placement="right"
                        title="下发参数"
                        v-if="scope.row.ruleMetaPo.handlerType.value == 'function'"
                        :width="300"
                        trigger="click">
                    <template #reference>
                        <el-input
                                v-model="scope.row.ruleMetaPo.handlerData.params"
                                disabled>
                            <template #append>
                                <el-button size="small" icon="Search" />
                            </template>
                        </el-input>
                    </template>
                    <v-ace-editor
                            :value=JSON.stringify(scope.row.ruleMetaPo.handlerData.params)
                            lang="json"
                            @blur="editHide($event,scope.row,scope.$index)"
                            :options="options"
                            theme="chrome"
                            style="height: 300px;width: 100%" />
                </el-popover>
            </template>
        </el-table-column>
        <el-table-column width="80" align="center">
            <template #header>
                <el-button type="primary" icon="Plus" size="small" @click="addHandler"/>
            </template>
            <template #default="scope">
                <el-button type="primary" class="custom-class" icon="Delete" size="small" @click="delFunc(scope.$index)"/>
            </template>
        </el-table-column>
    </el-table>
</template>
<script>
    import {defineComponent,toRef, reactive, ref,watch, getCurrentInstance, onMounted, computed } from "vue"
    import {useRouter} from "vue-router";
    import { ElMessage } from 'element-plus';

    export default defineComponent({
        name: "AlarmHandler",
        props:{
            deviceData:{
                type: Object,
                required: true,
                default: () => ({})
            },
            rulePo: {
                type: Object,
                required: true,
                default: ()=>({})
            },
            notifyData:{
                type: Object,
                required: true,
                default: () => ([])
            },
            notifyConfig:{
                type:Object,
                required: true,
                default: () => ([])
            }
        },
        setup(props,context) {
            const {proxy} = getCurrentInstance()
            const notifyD=toRef(props,'notifyData')
            const sourceDevice=toRef(props,'deviceData')
            const ruleDataPo=toRef(props,'rulePo')


            const popoverVisible=ref(false)
            const notifyConfig=toRef(props,'notifyConfig')
            const functions=reactive([])
            const delRuleMate=reactive([])

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


            const templateUserLoad=ref(false)
            const templateUserIcon=computed(()=>templateUserLoad.value?'Loading':'ArrowDown')

            watch(notifyD,value=>{
                console.log('change notifyD')
                initFun()
            })

            const apiNotifyConfig=()=>{
                proxy.$http.notifyPage({size: -1}).then(value => {
                    notifyConfig.length=0
                    notifyConfig.push(...value.data.records)
                    console.log('apiNotifyConfig')
                })
            }
            const apiNotifyTemplate=(index,func)=>{
                apiNotifyIdTemplate(index,notifyD.value[index].notifyConfigPo.id,func)
            }
            const apiNotifyIdTemplate=(index,notifyId,func)=>{
                proxy.$http.notifyTemplatePage({size:-1,terms:[{column:'t1.id',value:notifyId}]}).then(value=>{
                    notifyD.value[index].templates=JSON.parse(JSON.stringify(value.data.records.map(item=>item.templatePo)))
                    func(value.data.records)
                })
            }
            const apiNotifyTemplateUser=(index,func)=>{
                apiNotifyTemplateIdUser(index,notifyD.value[index].notifyTemplatePo.id,func);
            }
            const apiNotifyTemplateIdUser=(index,templateId,func)=>{
                proxy.$http.notifyTemplateUserPage({size:-1,terms:[{column:'t.template_id',value:templateId}]}).then(value=>{
                    notifyD.value[index].templatesUser=JSON.parse(JSON.stringify(value.data.records.map(item=>item.templateUserPo)))
                    func(value.data.records)
                })
            }

            const showPopTemplate=(row)=>{
                console.log('showPopTemplate')
                templateUserLoad.value=true
                apiNotifyTemplateUser(row,(data)=>{
                    console.log('showPopTemplate success')
                    templateUserLoad.value=false
                })
            }
            const notifyTemplateChange=(index,value)=>{
                console.log('notifyTemplateChange')
                for(var item of notifyD.value[index].templates){
                    if(item.id==value){
                        notifyD.value[index].notifyTemplatePo=JSON.parse(JSON.stringify(item))
                        break
                    }
                }
                console.log(index+'<---->notifyTemplateChange:'+JSON.stringify(value))
                templateUserLoad.value=true
                apiNotifyTemplateIdUser(index,notifyD.value[index].notifyTemplatePo.id,()=>{
                    templateUserLoad.value=false
                    if(notifyD.value[index].templatesUser!=null&&notifyD.value[index].templatesUser.length>0){
                        notifyD.value[index].notifyTemplateUserPo=JSON.parse(JSON.stringify(notifyD.value[index].templatesUser[0]))
                        notifyD.value[index].ruleMetaPo.notifyTemplateUser=JSON.parse(JSON.stringify(notifyD.value[index].templatesUser[0])).id
                    }else{
                        notifyD.value[index].notifyTemplateUserPo={}
                    }

                })
            }
            const notifyTemplateUserChange=(index,value)=>{
                for(var item of notifyD.value[index].templatesUser){
                    if(item.id==value){
                        notifyD.value[index].notifyTemplateUserPo=JSON.parse(JSON.stringify(item))
                        notifyD.value[index].ruleMetaPo.notifyTemplateUser=JSON.parse(JSON.stringify(item)).id
                        break
                    }
                }
            }


            const initFunction=()=>{
                functions.length=0
                functions.push(...sourceDevice.value.deviceInstancePo.metadata.functions)
            }

            const initNotifyTemplate=()=>{
                console.log('initNotifyTemplate:'+JSON.stringify(notifyD.value))
                for(const index in notifyD.value){
                    if(notifyD.value[index].ruleMetaPo.handlerType.value=='notify'){
                        notifyD.value[index].configId=notifyD.value[index].notifyConfigPo.id
                        apiNotifyTemplate(index,(data)=>{console.log('无回调')})
                    }
                }
            }

            const selectChangeNotifyConfig=(index,value)=>{
                apiNotifyIdTemplate(index,value,(data)=>{
                    if(data==null||data.length==0){
                        notifyD.value[index].notifyTemplatePo={}
                    }else{
                        notifyD.value[index].notifyTemplatePo=data[0].templatePo
                        apiNotifyTemplateIdUser(index,data[0].templatePo.id,()=>{
                            templateUserLoad.value=false
                            if(notifyD.value[index].templatesUser!=null&&notifyD.value[index].templatesUser.length>0){
                                notifyD.value[index].notifyTemplateUserPo=JSON.parse(JSON.stringify(notifyD.value[index].templatesUser[0]))
                                notifyD.value[index].ruleMetaPo.notifyTemplateUser=JSON.parse(JSON.stringify(notifyD.value[index].templatesUser[0])).id
                            }else{
                                notifyD.value[index].notifyTemplateUserPo={}
                            }

                        })
                    }

                })
            }
            const selectChangeFunc=(index,value)=>{
                console.log('selectChangeFunc')
                for(var item of functions){
                    if(item.id==value){
                        var paramData={}
                        for(var p of item.inputs){
                            if(p.valueType.type=='number'){
                                paramData[p.id]=0
                            }else{
                                paramData[p.id]=''
                            }
                        }
                        notifyD.value[index].ruleMetaPo.handlerData.params=paramData
                        break
                    }
                }

            }

            const addNotify=()=>{
                console.log('addNotify')
                const initNotifyDItem={notifyTemplatePo:{},notifyTemplateUserPo:{},notifyConfigPo:{},ruleMetaPo:{},templates:[]}
                if(notifyConfig.value.length>0){
                    initNotifyDItem.notifyConfigPo=JSON.parse(JSON.stringify(notifyConfig.value[0].configPo))
                    initNotifyDItem.ruleMetaPo={ruleId:ruleDataPo.value.id,notifyTemplateUser:1,handlerData:{deviceId:null,functionId:null,params:null},handlerType:{name:'通知',value:'notify'}}
                    notifyD.value.push(initNotifyDItem)
                    apiNotifyTemplate(notifyD.value.length-1,(data)=>{
                        console.log('addNotify apiNotifyTemplate')
                        notifyD.value[notifyD.value.length-1].notifyTemplatePo=notifyD.value[notifyD.value.length-1].templates[0]
                        apiNotifyTemplateUser(notifyD.value.length-1,(data1)=>{
                            notifyD.value[notifyD.value.length-1].notifyTemplateUserPo=notifyD.value[notifyD.value.length-1].templatesUser[0]
                            notifyD.value[notifyD.value.length-1].ruleMetaPo.notifyTemplateUser=notifyD.value[notifyD.value.length-1].templatesUser[0].id
                            console.log('addNotify apiNotifyTemplateUser:'+JSON.stringify(notifyD.value[notifyD.value.length-1]))
                        })
                    })
                }
            }

            const addFunc=()=>{
                console.log('addFunc')
                if(functions.length>0){
                    const initFunctionItem={notifyTemplateUserPo:null,notifyTemplatePo:null,notifyConfigPo:null}
                    initFunctionItem.ruleMetaPo={ruleId:ruleDataPo.value.id,notifyTemplateUser:null,handlerData:{},handlerType:{name:'功能',value:'function'}}
                    var paramData={}
                    for(var p of functions[0].inputs){
                        if(p.valueType.type=='number'){
                            paramData[p.id]=0
                        }else{
                            paramData[p.id]=''
                        }
                    }
                    initFunctionItem.ruleMetaPo.handlerData.params=paramData
                    initFunctionItem.ruleMetaPo.handlerData.functionId=functions[0].id
                    initFunctionItem.ruleMetaPo.handlerData.deviceId=sourceDevice.value.deviceInstancePo.id
                    notifyD.value.push(initFunctionItem)
                }else{
                    ElMessage({
                        showClose: true,
                        message: '暂无可选的功能列表',
                        type: 'error',
                    })
                }

            }

            const cleanCache=()=>{
                delRuleMate.length=0
                console.log('cleanCache')
            }
            const getDelRuleMate=()=>{
                return delRuleMate
            }

            const addHandler=()=>{
                addNotify()
            }

            const delFunc=(index)=>{
                if(notifyD.value[index].ruleMetaPo.id!=null){
                    delRuleMate.push(notifyD.value[index].ruleMetaPo.id)
                }
                notifyD.value.splice(index,1)
            }
            const editHide=(event,row,index)=>{
                console.log('editHide:'+event.target.value)
                try{
                    var parseObj=JSON.parse(event.target.value)
                    notifyD.value[index].ruleMetaPo.handlerData.params=parseObj
                }catch (e) {
                    for(var item of functions){
                        if(item.id==notifyD.value[index].ruleMetaPo.handlerData.functionId){
                            var paramData={}
                            for(var p of item.inputs){
                                if(p.valueType.type=='number'){
                                    paramData[p.id]=0
                                }else{
                                    paramData[p.id]=''
                                }
                            }
                            notifyD.value[index].ruleMetaPo.handlerData.params=paramData
                            break
                        }
                    }
                    ElMessage({
                        showClose: true,
                        message: 'json格式错误,请重新编辑',
                        type: 'error',
                    })
                }
            }
            const getNotifyD=()=>{
                return notifyD.value;
            }

            const initFun=()=>{
                //apiNotifyConfig()
                initNotifyTemplate()
            }

            onMounted(()=>{
                initFunction()
                initNotifyTemplate()
            })

            return {
                options,
                functions,
                notifyConfig,
                popoverVisible,
                sourceDevice,
                ruleDataPo,
                notifyD,
                templateUserLoad,
                templateUserIcon,
                initFun,
                getNotifyD,
                addHandler,
                addFunc,
                delFunc,
                cleanCache,
                getDelRuleMate,
                selectChangeNotifyConfig,
                selectChangeFunc,
                editHide,
                showPopTemplate,
                notifyTemplateChange,
                notifyTemplateUserChange
            }
        }
    })
</script>   