<template>
    <el-drawer v-model="selectData.status">
        <template #header>
            <h4>{{selectData.title}}</h4>
        </template>
        <template #default>
            <el-form :model="selectData" border label-width="100px">
                <el-form-item :label="$t('common.name')" prop="name">
                    <el-input v-model="selectData.data.gatewayPo.name" :placeholder="$t('gatewayAdd.namePlaceholder')" clearable/>
                </el-form-item>
                <el-form-item :label="$t('gatewayAdd.networkComponent')" prop="network">
                    <el-select v-model="selectData.data.gatewayPo.networkId" @change="netSelectChange">
                        <el-option v-for="(item,index) in allNetwork" :key="index"
                                   :label="item.name"
                                   :value="item.id"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('gatewayAdd.protocolLib')" prop="network">
                    <el-select v-model="selectData.data.gatewayPo.protocolId">
                        <el-option v-for="(item,index) in optionProtocol" :key="index"
                                   :label="item.name"
                                   :value="item.id"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('common.status')">
                    <el-switch
                            v-model="state"
                            width="60"
                            inline-prompt
                            :active-text="$t('gatewayAdd.statusOn')"
                            :inactive-text="$t('gatewayAdd.statusOff')"
                    />
                </el-form-item>
            </el-form>
        </template>
        <template #footer>
            <el-button type="primary" @click="submitClick" :loading="selectData.loading">{{ $t('common.save') }}</el-button>
        </template>
    </el-drawer>
</template>

<script>
    import {defineComponent, computed, ref, reactive, toRef, getCurrentInstance, onMounted, watch} from "vue"
    import {protocolType} from "@/model/protocol/ProtocolType";
    import {useRouter} from "vue-router";
    import { useI18n } from 'vue-i18n';

    export default defineComponent({
        name: "GatewayAdd",
        props: {
            data: {
                type: Object,
                required: true,
                default: () => ({title: '编辑', status: false, loading: false, data: {}})
            }
        },
        emits: ['save'],
        setup(props, context) {
            const { t } = useI18n()
            const {proxy} = getCurrentInstance()
            const selectData = toRef(props, 'data')
            const allNetwork = reactive([])
            const allProtocol = reactive([])
            const optionProtocol = reactive([])
            const type = ref(protocolType)

            const state=computed({
                get(){
                    return selectData.value.data.gatewayPo.state == 1;
                },
                set(v){
                    selectData.value.data.gatewayPo.state = v?1:0;
                }
            })

            const networkApi = () => {
                allNetwork.length = 0
                const param = {current: -1, terms: [{column: 't2.id', termType: 'isnull'}]}
                proxy.$http.networkPage(param).then(v => {
                    console.log('networkApi success')
                    console.log("" + JSON.stringify(selectData.value))
                    if (selectData.value.data.networkConfigPo != undefined) {
                        allNetwork.push(selectData.value.data.networkConfigPo)
                    } else if (selectData.value.data.networkConfigPo == undefined && v.data.records.length > 0) {
                        selectData.value.data.networkConfigPo = v.data.records[0].t1
                    }
                    for (var item of v.data.records) {
                        allNetwork.push(item.t1.networkConfigPo)
                    }
                    protocolApi()
                }, e => {
                    console.log('networkApi fail')
                })
            }

            const handlerOptionProtocol = (network) => {
                optionProtocol.length = 0
                for (var item of allProtocol) {
                    for (var p of item.support) {
                        if (p == network.type) {
                            optionProtocol.push(item)
                            break
                        }
                    }
                }
                console.log('handlerOptionProtocol')
            }

            const protocolApi = () => {
                allProtocol.length = 0
                const param = {current: -1}
                proxy.$http.protocolPage(param).then(v => {
                    console.log('protocolApi success')
                    allProtocol.push(...v.data.records)
                    handlerOptionProtocol(selectData.value.data.networkConfigPo)
                }, e => {
                    console.log('protocolApi fail')
                })
            }

            const netSelectChange = (value) => {
                console.log('netSelectChange')
                for (var item of allNetwork){
                    if(item.id == value){
                        handlerOptionProtocol(item)
                        break
                    }
                }
                selectData.value.data.gatewayPo.protocolId=undefined
                console.log('netSelectChange')
            }
            const submitClick=()=>{
                console.log("submitClick:"+JSON.stringify(selectData.value.data.gatewayPo))
                context.emit('save',selectData.value.data.gatewayPo)
            }

            onMounted(() => {
                console.log('GatewayAdd')
            })

            return {state,optionProtocol, selectData, allNetwork, submitClick,networkApi, netSelectChange}
        }
    })
</script>