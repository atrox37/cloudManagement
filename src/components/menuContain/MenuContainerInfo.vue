<template>
    <el-row :gutter="0" style="padding: 10px;width: 100%">
        <el-col :span="6"  v-for="(item,index) in datas" :key="index">
            <el-text type="primary">{{item.name}}</el-text>
            <div>{{item.name}}</div>
            <div>{{item.value}}</div>
        </el-col>
    </el-row>
</template>
<script>
    import {defineComponent,toRef} from 'vue';
    export default defineComponent ({
        name:"MenuContainerInfo",
        props:{
            data:{
                type: Object,
                required: false,
                default: null
            }
        },
        setup(props,context){
            const datas=toRef(props,'data')
            console.log('json->'+JSON.stringify(datas))
            return {
                datas
            }
        }
    })
</script>

<style scoped>

</style>