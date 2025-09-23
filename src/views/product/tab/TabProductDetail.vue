<template>
    <div class="tab-pan-content">
        <el-descriptions :column="3" border v-if="data!=null">
            <template #title>
                <span>{{data.productPo.name}}</span>
            </template>
            <template #extra>
                <el-button type="primary" size="small" class="form-title" @click="editClick"><el-icon><Edit/></el-icon></el-button>
            </template>
            <el-descriptions-item label="名称">{{data.productPo.name}}</el-descriptions-item>
            <el-descriptions-item label="类型">
                <el-tag v-if="data.productPo.type == 'gateway'">网关</el-tag>
                <el-tag v-if="data.productPo.type == 'children'">子设备</el-tag>
                <el-tag v-if="data.productPo.type == 'device'">直联设备</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{data.sysUserPo.username}}</el-descriptions-item>
            <el-descriptions-item label="机构">{{data.sysDimensionPo.name}}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{data.productPo.updateTime}}</el-descriptions-item>
        </el-descriptions>
    </div>
</template>

<script>
    import {
        computed,
        defineComponent,
        ref,
        nextTick,
        onMounted,
        getCurrentInstance,
        onBeforeUnmount,
        toRef,
        watch
    } from "vue"
    export default defineComponent({
        name: "TabProductDetail",
        props: {
            productData: {
                type: Object,
                required: false
            }
        },
        emits:['dialogClick'],
        setup(props,context){
            const data = toRef(props,'productData')
            const editClick=()=>{
                context.emit('dialogClick')
            }
            return {data,editClick}
        }
    })
</script>

<style scoped>
    @import url('style/index.scss');
</style>