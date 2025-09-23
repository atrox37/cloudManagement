<template>
    <el-dialog v-model="sourcestatus" title="编辑" :show-close="false" @close="closeHandler" class="gload-dialog">
        <el-form label-position="left" label-width="auto" v-model="sourceAlarm">
            <el-form-item label="名称">
                <el-input v-model="sourceAlarm.rulePo.name"></el-input>
            </el-form-item>
            <el-form-item label="工作状态">
                <el-radio-group size="small" v-model="sourceAlarm.rulePo.state">
                    <el-radio-button label="启动" value="1" />
                    <el-radio-button label="关闭" value="0" />
                </el-radio-group>
            </el-form-item>
            <el-form-item label="触发方式">
                <el-radio-group size="small" v-model="sourceAlarm.rulePo.ruleData.type">
                    <el-radio-button label="time" value="time" />
                    <el-radio-button label="cron" value="cron" />
                </el-radio-group>
            </el-form-item>
            <el-form-item label="触发时间">
                <div v-if="sourceAlarm.rulePo.ruleData.type == 'time'">
                    <el-input-number v-model="sourceAlarm.rulePo.ruleData.time" size="small"></el-input-number>
                    -
                    <el-input-number v-model="sourceAlarm.rulePo.ruleData.count" size="small"></el-input-number>
                </div>
                <div v-if="sourceAlarm.rulePo.ruleData.type == 'cron'">
                    <el-input v-model="sourceAlarm.rulePo.ruleData.cron"></el-input>
                </div>

            </el-form-item>
            <el-form-item label="触发条件">
                <AlarmItem ref="alarmItems" :deviceData="sourceDevice" v-for="(columns,key) in alarmColumn" @delGroup="delGroup(key)" :key="key" :alarmData="columns" style="width: 100%;height: auto;padding: 0;margin: 5px 0 0 0;overflow: hidden;"></AlarmItem>
                <el-row style="width:100%">
                    <el-col :span="24" class="center-flex-contain" style="padding: 5px">
                        <el-button type="primary" icon="Plus" size="small" @click="addGroup"/>
                    </el-col>
                </el-row>
            </el-form-item>
            <el-form-item label="处理方式">
                <!--<AlarmHandlerItem ref="alarmNotifys" v-for="(item,index) in ruleNotifyData" :key="index" :notifyPo="item" :deviceData="sourceDevice"></AlarmHandlerItem>-->
                <AlarmHandler ref="alarmNotifys" :rulePo="sourceAlarm.rulePo" :deviceData="sourceDevice" :notifyData="ruleNotifyData" :notifyConfig="notifyConfig"></AlarmHandler>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="right-flex-contain">
                <el-button @click="closeHandler">取消</el-button>
                <el-button type="primary" @click="saveAlarm">保存</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script>
    import {ref, reactive, defineComponent, watch, onMounted,onBeforeUpdate,onUpdated, toRef, getCurrentInstance} from "vue";
    import { Plus,Delete } from "@element-plus/icons-vue";
    import AlarmItem from '@/components/device/item/AlarmItem.vue'
    import AlarmHandlerItem from '@/components/device/item/AlarmHandlerItem.vue'
    import AlarmNotify from '@/components/device/item/AlarmNotify.vue'
    import AlarmHandler from '@/components/device/item/AlarmHandler.vue'
    import {ElMessage} from "element-plus";
    export default defineComponent({
        name: "DialogAlarm",
        components:{AlarmItem,AlarmHandlerItem,AlarmNotify,AlarmHandler},
        props: {
            status:{
                type: Boolean,
                required: true,
                default: false
            },
            deviceData:{
                type: Object,
                required: true,
                default: () => ({})
            },
            alarmData:{
                type: Object,
                required: false,
                default: () => ({columns:[],rulePo:{ruleData:{}}})
            }
        },
        emits:['close','reload'],
        setup(props,context){
            const {proxy} = getCurrentInstance()
            const sourceDevice=toRef(props,'deviceData')
            const sourceAlarm=toRef(props,"alarmData")
            const sourcestatus=toRef(props,"status")
            const alarmItems=ref([])
            const notifyConfig=reactive([])
            const alarmNotifys=ref(null)

            const ruleNotifyData=reactive([])


            const alarmColumn=ref([]);
            watch(sourceAlarm,value => {
                alarmColumn.value.length=0
                alarmColumn.value.push(...value.columns)
                ruleNotifyData.length=0
                ruleNotifyData.push(...value.ruleDtos)
                console.log('change alarmColumn')
                if(alarmNotifys.value!=null){
                    console.log("sourcestatus change:")
                    alarmNotifys.value.initFun()
                }
            })

            /*watch(sourcestatus,value=>{
                if(value&&alarmNotifys.value!=null){
                    console.log("sourcestatus change:")
                    //alarmNotifys.value.initFun()
                }
            })*/

            const apiNotifyConfig=()=>{
                proxy.$http.notifyPage({size: -1}).then(value => {
                    notifyConfig.length=0
                    notifyConfig.push(...value.data.records)
                    console.log('apiNotifyConfig')
                })
            }

            const addGroup=()=>{
                alarmColumn.value.push([])
            }
            const delGroup=(index)=>{
                alarmColumn.value.splice(index,1)
                console.log('delGroup')
            }

            const closeHandler=()=>{
                console.log('closeHandler')
                context.emit("close")
            }
            const saveAlarm=()=>{
                var data={rulePo:sourceAlarm.value.rulePo,columns:[],ruleDtos:[],delMeta:[]}
                for(var item of alarmItems.value){
                    if(item.getProperty().length>0){
                        data.columns.push(item.getProperty())
                    }
                }
                for(var item of alarmNotifys.value.getNotifyD()){
                    /**var handlerType=JSON.stringify(item.ruleMetaPo.handlerType)
                    item.ruleMetaPo.handlerType=handlerType**/
                    item.ruleMetaPo.handlerType=JSON.stringify(item.ruleMetaPo.handlerType)
                    if(item.ruleMetaPo.id==null){
                        data.ruleDtos.push({ruleMetaPo:item.ruleMetaPo})
                    }else{
                        data.ruleDtos.push({ruleMetaPo:item.ruleMetaPo})
                    }
                }
                data.delMeta.push(...alarmNotifys.value.getDelRuleMate())
                console.log('saveAlarm')

                proxy.$http.deviceRuleSave(data).then(value => {
                    console.log('保存成功')
                    ElMessage({
                        showClose: true,
                        message: '保存成功',
                        type: 'success',
                    })
                    context.emit("reload")
                })

            }

            onMounted(()=>{
                alarmColumn.value.length=0
                if(sourceAlarm!=null
                    &&sourceAlarm.value!=null){
                    alarmColumn.value.push(...sourceAlarm.value.columns)
                }
                apiNotifyConfig()
            })
            onUpdated(()=>{
                if(alarmNotifys.value!=null)alarmNotifys.value.cleanCache()
            })

            return {
                notifyConfig,
                alarmNotifys,
                alarmItems,
                ruleNotifyData,
                alarmColumn,
                sourceDevice,
                sourcestatus,
                sourceAlarm,
                addGroup,
                delGroup,
                saveAlarm,
                closeHandler
            }
        }
    })
</script>
<style scoped lang="scss">
.dialog-alarm .el-dialog{
    border-radius: 20px;
    --el-dialog-width: 80%;
    height: 30%;
    background-color: #42b983;
}
.text-style{
    color: #2c3e50;
    font-size: 20ex;
}
::v-deep .el-dialog{
    height: 30%;
    background-color: #42b983;
}
</style>