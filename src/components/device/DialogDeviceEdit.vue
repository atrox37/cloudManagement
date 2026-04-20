<template>
    <el-dialog v-model="dialogStatus" :title="$t('deviceDialog.edit')" :show-close="false" @close="closeHandler">
        <el-form :model="copyData">
            <el-form-item :label="$t('deviceDialog.deviceName')">
                <el-input v-model="copyData.deviceInstancePo.name"></el-input>
            </el-form-item>
            <el-form-item :label="$t('deviceDialog.deviceGateway')">
                <el-select v-model="copyData.networkConfigPo.id" @change="selectChange">
                    <el-option v-for="item in gatewayData" :key="item.gatewayPo.id" :label="item.gatewayPo.name" :value="item.gatewayPo.id">
                    </el-option>
                </el-select>
                <el-tag size="large">{{networkType.type}}</el-tag>
            </el-form-item>

        </el-form>
        <template #footer>
            <el-button @click="closeClick">Cancel</el-button>
            <el-button type="primary" @click="submitClick">Submit</el-button>
        </template>

    </el-dialog>

</template>

<script>
    import {defineComponent,ref,toRef,watch} from "vue"
    export default defineComponent({
        name: "DialogDeviceEdit",
        props:{
            status:{
                type: Boolean,
                required: true,
                default: false
            },
            data:{
                type: Object,
                required: true
            },
            gateways:{
                type: Array,
                required: false,
                default: () => []
            }
        },
        emits:['save','cancel'],
        setup(props,context){
            const dialogStatus=toRef(props,'status')
            const modelData=toRef(props,'data')
            const gatewayData=toRef(props,'gateways')
            const copyData=ref({})
            const networkType=ref({})

            watch(modelData,value => {
                copyData.value = JSON.parse(JSON.stringify(value))
                networkType.value=copyData.value.networkConfigPo
            })
            watch(gatewayData,value => {
                const ddd = JSON.parse(JSON.stringify(value))
                console.log('change gateway')
            })
            const selectChange=(value)=>{
                for (let i of gatewayData.value){
                    if (i.networkConfigPo.id == value){
                        networkType.value = i.networkConfigPo
                        copyData.value.deviceInstancePo.gatewayId=i.gatewayPo.id
                        break
                    }
                }
            }
            const closeClick=()=>{
                console.log('closeClick')
                context.emit("cancel")
            }
            const submitClick=()=>{
                console.log('submitClick')
                context.emit("save",copyData.value.deviceInstancePo)
            }

            const closeHandler=()=>{
                console.log('closeHandler')
                context.emit("cancel")
            }
            return {networkType,gatewayData,copyData,dialogStatus,closeClick,submitClick,closeHandler,selectChange}
        }
    })
</script>

<style scoped>

</style>