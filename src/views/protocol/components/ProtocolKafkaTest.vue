<template>
    <el-drawer v-model="protocolData.drawable">
        <template #header>
            <h4>{{ $t('protocolTest.kafkaTitle') }}</h4>
        </template>
        <template #default>
            <el-form :model="protocolData.kafka" label-width="120">
                <el-form-item :label="$t('protocolTest.topic')">
                    <el-input v-model="protocolData.kafka.topic"/>
                </el-form-item>
                <el-form-item :label="$t('protocolTest.sendData')">
                    <el-input v-model="protocolData.kafka.data" type="textarea"/>
                </el-form-item>
                <el-form-item :label="$t('protocolTest.result')" v-if="protocolData.result.name != undefined">
                    <div>
                        <el-form-item :label="$t('protocolTest.msgType')">
                            <el-tag>{{protocolData.result.name}}</el-tag>
                        </el-form-item>
                        <div v-if="protocolData.result.type == 'report-property'">
                            <el-form-item :label="$t('protocolTest.deviceId')">
                                <el-input v-model="protocolData.result.deviceId" disabled/>
                            </el-form-item>
                            <el-form-item :label="$t('protocolTest.deviceSn')">
                                <el-input v-model="protocolData.result.deviceSn" disabled/>
                            </el-form-item>
                            <el-form-item :label="$t('protocolTest.propValue')">
                                <template #default>
                                    <div v-for="(item,index) in protocolData.result.properties" :key="index">
                                        <el-space wrap>
                                            <el-text>{{ $t('protocolTest.propId') }}{{index}}</el-text>
                                            <el-text>{{ $t('protocolTest.valueLabel') }}{{item}}</el-text>
                                        </el-space>
                                    </div>
                                </template>
                            </el-form-item>
                        </div>
                        <div v-if="protocolData.result.type == 'online'">
                            <el-form-item :label="$t('protocolTest.deviceId')">
                                <el-input v-model="protocolData.result.deviceId" disabled/>
                            </el-form-item>
                            <el-form-item :label="$t('protocolTest.deviceSn')">
                                <el-input v-model="protocolData.result.deviceSn" disabled/>
                            </el-form-item>
                        </div>
                        <div v-if="protocolData.result.type == 'offline'">
                            <el-form-item :label="$t('protocolTest.deviceId')">
                                <el-input v-model="protocolData.result.deviceId" disabled/>
                            </el-form-item>
                            <el-form-item :label="$t('protocolTest.deviceSn')">
                                <el-input v-model="protocolData.result.deviceSn" disabled/>
                            </el-form-item>
                        </div>
                        <div v-if="protocolData.result.type == 'request-reply'">
                            <el-form-item :label="$t('protocolTest.deviceId')">
                                <el-input v-model="protocolData.result.deviceId" disabled/>
                            </el-form-item>
                            <el-form-item :label="$t('protocolTest.deviceSn')">
                                <el-input v-model="protocolData.result.deviceSn" disabled/>
                            </el-form-item>
                            <el-form-item :label="$t('protocolTest.msgId')">
                                <el-input v-model="protocolData.result.messageId" disabled/>
                            </el-form-item>
                            <el-form-item :label="$t('protocolTest.replyProp')">
                                <template #default>
                                    <div v-for="(item,index) in protocolData.result.resultData" :key="index">
                                        <el-space wrap>
                                            <el-text>{{ $t('protocolTest.propId') }}{{index}}</el-text>
                                            <el-text>{{ $t('protocolTest.valueLabel') }}{{item}}</el-text>
                                        </el-space>
                                    </div>
                                </template>
                            </el-form-item>
                        </div>
                    </div>
                </el-form-item>
            </el-form>
        </template>
        <template #footer>
            <el-button @click="testClick">{{ $t('protocolTest.testBtn') }}</el-button>
        </template>
    </el-drawer>
</template>
<script>
    import {defineComponent, toRef, ref, getCurrentInstance, watch} from "vue"
    import {messageTypes} from '@/model/device/DeviceMessage'
    import {useRouter} from "vue-router";
    import { useI18n } from 'vue-i18n';

    export default defineComponent({
        name: "ProtocolKafkaTest",
        props: {
            data: {
                type: Object,
                required: true,
                default: () => ({drawable: false, kafka: {}, result: {}})
            }
        },
        emits:['test'],
        setup(props, context) {
            const { t } = useI18n()
            const protocolData = toRef(props, 'data')
            const resultData=ref(null)
            const msgTypes=ref(messageTypes)
            const testClick = () => {
                const params=JSON.parse(JSON.stringify(protocolData.value))
                console.log('testClick:'+JSON.stringify(params))
                context.emit('test',protocolData.value.kafka)
            }
            const handlerResult=()=>{
                for(var item of msgTypes.value){
                    if(protocolData.value.result.type==item.type){
                        protocolData.value.result.name=item.name
                        break
                    }
                }
                console.log('handlerResult')
            }
            watch(protocolData,value => {
                console.log("watch protocolData")
            })

            return {protocolData, testClick,handlerResult}
        }
    })
</script>
