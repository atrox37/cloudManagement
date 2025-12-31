<template>
    <el-drawer v-model="protocolData.drawable">
        <template #header>
            <h4>MQTT协议测试</h4>
        </template>
        <template #default>
            <el-form :model="protocolData.mqtt" label-width="80">
                <el-form-item label="主题">
                    <el-input v-model="protocolData.mqtt.topic"/>
                </el-form-item>
                <el-form-item label="clientId">
                    <el-input v-model="protocolData.mqtt.clientId"/>
                </el-form-item>
                <el-form-item label="发送报文">
                    <el-input v-model="protocolData.mqtt.data" type="textarea"/>
                </el-form-item>
                <el-form-item label="结果" v-if="protocolData.result.type != undefined">
                    <div>
                        <el-form-item label="消息类型">
                            <el-tag>{{protocolData.result.name}}</el-tag>
                        </el-form-item>
                        <div v-if="protocolData.result.type == 'report-property'">
                            <el-form-item label="设备ID">
                                <el-input v-model="protocolData.result.deviceId" disabled/>
                            </el-form-item>
                            <el-form-item label="设备SN">
                                <el-input v-model="protocolData.result.deviceSn" disabled/>
                            </el-form-item>
                            <el-form-item label="属性值">
                                <template #default>
                                    <div v-for="(item,index) in protocolData.result.properties" :key="index">
                                        <el-space wrap>
                                            <el-text>属性ID:{{index}}</el-text>
                                            <el-text>值:{{item}}</el-text>
                                        </el-space>
                                    </div>
                                </template>
                            </el-form-item>
                        </div>
                        <div v-if="protocolData.result.type == 'online'">
                            <el-form-item label="设备ID">
                                <el-input v-model="protocolData.result.deviceId" disabled/>
                            </el-form-item>
                            <el-form-item label="设备SN">
                                <el-input v-model="protocolData.result.deviceSn" disabled/>
                            </el-form-item>
                        </div>
                        <div v-if="protocolData.result.type == 'offline'">
                            <el-form-item label="设备ID">
                                <el-input v-model="protocolData.result.deviceId" disabled/>
                            </el-form-item>
                            <el-form-item label="设备SN">
                                <el-input v-model="protocolData.result.deviceSn" disabled/>
                            </el-form-item>
                        </div>
                        <div v-if="protocolData.result.type == 'request-reply'">
                            <el-form-item label="设备ID">
                                <el-input v-model="protocolData.result.deviceId" disabled/>
                            </el-form-item>
                            <el-form-item label="设备SN">
                                <el-input v-model="protocolData.result.deviceSn" disabled/>
                            </el-form-item>
                            <el-form-item label="消息ID">
                                <el-input v-model="protocolData.result.messageId" disabled/>
                            </el-form-item>
                            <el-form-item label="回复属性">
                                <template #default>
                                    <div v-for="(item,index) in protocolData.result.resultMapData" :key="index">
                                        <el-space wrap>
                                            <el-text>属性ID:{{index}}</el-text>
                                            <el-text>值:{{item}}</el-text>
                                        </el-space>
                                    </div>
                                </template>
                            </el-form-item>
                        </div>
                        <div v-if="protocolData.result.type == 'board-reply'">
                          <el-form-item label="消息ID">
                            <el-input v-model="protocolData.result.messageId" disabled/>
                          </el-form-item>
                          <el-form-item label="消息结果">
                            <el-input v-model="protocolData.result.replyType" disabled/>
                          </el-form-item>
                        </div>
                    </div>


                </el-form-item>

            </el-form>

        </template>
        <template #footer>
            <el-button @click="testClick">测试</el-button>
        </template>
    </el-drawer>
</template>
<script>
    import {defineComponent, toRef, ref, getCurrentInstance, watch} from "vue"
    import {messageTypes} from '@/model/device/DeviceMessage'
    import {useRouter} from "vue-router";

    export default defineComponent({
        name: "ProtocolMqttTest",
        props: {
            data: {
                type: Object,
                required: true,
                default: () => ({drawable: false, mqtt: {}, result: {}})
            }
        },
        emits:['test'],
        setup(props, context) {
            const protocolData = toRef(props, 'data')
            const resultData=ref(null)
            const msgTypes=ref(messageTypes)
            const testClick = () => {
                const params=JSON.parse(JSON.stringify(protocolData.value))
                console.log('testClick:'+JSON.stringify(params))
                context.emit('test',protocolData.value.mqtt)
            }
            const handlerResult=()=>{
                for(var item of msgTypes.value){
                    if(protocolData.value.result.type==item.type){
                        protocolData.value.result.name=item.name
                        break
                    }
                }
                console.log('handlerResult')
              debugger;
            }
            watch(protocolData,value => {
                console.log("watch protocolData")
            })

            return {protocolData, testClick,handlerResult}
        }
    })
</script>   