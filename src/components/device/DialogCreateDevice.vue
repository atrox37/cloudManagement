<template>
    <el-dialog v-model="deviceDialog.status" title="创建设备" width="30%">
        <el-form ref="createForm" :rules="rules" :model="deviceDialog"> <!--:rules="rules"-->
            <el-form-item label="设备名称" prop="deviceName" label-width="100">
                <el-input v-model="deviceDialog.device.name"></el-input>
            </el-form-item>
            <el-form-item label="设备SN" prop="deviceSN" label-width="100">
                <el-input v-model="deviceDialog.device.sn"></el-input>
            </el-form-item>
            <el-form-item label="产品" prop="productId" label-width="100">
                <el-select v-model="deviceDialog.device.productId">
                    <el-option v-for="(item,index) in products" :key="index" :label="item.productPo.name" :value="item.productPo.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="网关" prop="gatewayId" label-width="100">
                <el-select v-model="deviceDialog.device.gatewayId">
                    <el-option v-for="(item,index) in gateways" :key="index" :label="item.gatewayPo.name" :value="item.gatewayPo.id"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="right-flex-contain">
                <el-button type="primary" @click="submitClick" :loading="deviceDialog.loading">保存提交</el-button>
            </div>
        </template>
    </el-dialog>
</template>
<script>
    import {defineComponent, reactive, ref, getCurrentInstance, onMounted, toRef} from "vue"
    import {useRouter} from "vue-router";

    export default defineComponent({
        name: "DialogCreateDevice",
        props: {
            data:{
                type: Object,
                required: false,
                default: () => ({status:false,loading:false,device:{name:''}})
            }
        },
        emits:['createClick'],
        setup(props,context) {
            const {proxy} = getCurrentInstance()
            const deviceDialog=toRef(props,'data')
            const createForm=ref(null)
            const products=reactive([])
            const gateways=reactive([])
            const validateSelect=(rule, value, callback)=>{
                if(rule.field == 'productId'){
                    if(deviceDialog.value.device.productId == undefined || deviceDialog.value.device.productId==''){
                        callback(('产品不能为空'))
                    }else{
                        callback()
                    }
                }else if(rule.field == 'deviceName'){
                    if(deviceDialog.value.device.name == undefined || deviceDialog.value.device.name==''){
                        callback(('名称不能为空'))
                    }else{
                        callback()
                    }
                }else if(rule.field == 'deviceSN'){
                    if(deviceDialog.value.device.sn == undefined || deviceDialog.value.device.sn==''){
                        callback(('设备SN不能为空'))
                    }else{
                        callback()
                    }
                }else if(rule.field == 'gatewayId'){
                    if(deviceDialog.value.device.gatewayId == undefined || deviceDialog.value.device.gatewayId==''){
                        callback(('网关不能为空'))
                    }else{
                        callback()
                    }
                }

            }
            const rules=ref({
                deviceName:[{validator:validateSelect, trigger: 'blur' }],
                productId:[{validator:validateSelect, trigger: 'blur' }],
                deviceSN:[{validator:validateSelect, trigger: 'blur' }],
                gatewayId:[{validator:validateSelect, trigger: 'blur' }]
            })


            const submitClick=()=>{
                createForm.value.validate((valid, fields) => {
                    if (valid) {
                        console.log('submitClick')
                        context.emit('createClick')
                    } else {
                        console.log('error submit!', fields)
                    }
                })
            }
            const requestAllProductApi=()=>{
                proxy.$http.productPage({"size": -1}).then(value => {
                    products.push(...value.data.records)
                    console.log('requestAllProductApi')
                })
            }
            const requestAllGatewayApi=()=>{
                proxy.$http.gatewayPage({"size": -1}).then(value => {
                    gateways.push(...value.data.records)
                    console.log('requestAllGatewayApi')
                })
            }
            onMounted(()=>{
                requestAllProductApi()
                requestAllGatewayApi()
            })
            return {
                createForm,
                rules,
                gateways,
                products,
                deviceDialog,
                submitClick
            }
        }
    })
</script>   