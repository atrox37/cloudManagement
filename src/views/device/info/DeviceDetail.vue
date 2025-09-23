<template>
    <div class="tab-pan-content">
        <el-descriptions :column="3" border>
            <template #title>
                <span>{{data.deviceInstancePo.name}}</span>
            </template>
            <template #extra>
                <el-button type="primary" size="small" class="form-title" @click="editClick"><el-icon><Edit/></el-icon></el-button>
            </template>
            <el-descriptions-item label="设备名称">{{data.deviceInstancePo.name}}</el-descriptions-item>
            <el-descriptions-item label="设备SN">{{data.deviceInstancePo.sn}}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{data.productPo.name}}</el-descriptions-item>
            <el-descriptions-item label="产品类型">
                <el-tag>{{type}}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{data.sysUserPo.username}}</el-descriptions-item>
            <el-descriptions-item label="采集网关">{{data.gatewayPo.name}}</el-descriptions-item>
            <el-descriptions-item label="采集方式">
                <el-tag size="small">{{data.networkConfigPo.type}}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{data.deviceInstancePo.createTime}}</el-descriptions-item>
        </el-descriptions>
    </div>

</template>

<script>
    import {defineComponent, toRef,ref,watch,onMounted,computed} from "vue"
    import {productType} from '@/model/product/ProductType'
    export default defineComponent({
        name: "DeviceDetail",
        props: {
            deviceData: {
                type: Object,
                required: false
            }
        },
        emits:['editClick'],
        setup(props,context){
            const pt=toRef(productType)
            const data = toRef(props,'deviceData')
            const networkConfiguration = ref(data.value.networkConfigPo)
            watch(data,(o,n)=>{
                console.info('detail')
            })
            const type=computed(()=>{
                var v=''
                for(var i of pt.value){
                    if(i.type == data.value.productPo.type){
                        v=i.name
                        break;
                    }
                }
                return v
            })
            onMounted(()=>{
                console.info('deviceDetail')
            })
            const editClick=()=>{
                context.emit('editClick')
            }
            return {
                type,data,networkConfiguration,editClick
            }
        }
    })
</script>

<style scoped>
    @import url('../style/tab-content.css');
    .form-title{
        margin: 10px;
    }
    .el-descriptions{
        background: #FFFFFF;
    }
</style>
