<template>
    <el-drawer v-model="propertyDraw" :before-close="propertyDrawClose" :size="'25%'" :title="'属性'">
        <template #default>
            <el-form :data="selectProperty" label-position="top">
                <el-form-item label="属性ID">
                    <el-input v-model="selectProperty.id" :disabled="selectMetaIndex>=0"/>
                </el-form-item>
                <el-form-item label="属性名称">
                    <el-input v-model="selectProperty.name"/>
                </el-form-item>
                <el-form-item label="数据类型">
                    <el-input v-model="selectProperty.valueType.type"/>
                </el-form-item>
                <el-form-item label="数据单位">
                    <el-input v-model="selectProperty.valueType.unit"/>
                </el-form-item>
            </el-form>
        </template>
        <template #footer>
            <el-divider />
            <div class="center-flex-contain">
                <el-button type="info" @click="cancelClick">取消</el-button>
                <el-button type="primary" @click="submitClick">保存</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script>
    import {ref, reactive, defineComponent, getCurrentInstance, onMounted, toRef} from "vue";
    export default defineComponent({
        name: "MetaProperty",
        props:{
            selectData: {
                type: Object,
                required: true
            },
            drawerData:{
                type: Boolean,
                required: false,
                default: false
            },
            selectIndex:{
                type: Number,
                required: false,
                default: -1
            }
        },
        emits:["close","submit"],
        setup(props,context){
            const propertyDraw=toRef(props,'drawerData')
            const selectProperty=toRef(props,'selectData')
            const selectMetaIndex=toRef(props,'selectIndex')
            const propertyDrawClose=(done)=>{
                done()
                context.emit('close')
            }
            const submitClick=()=>{
                context.emit('submit')
            }
            const cancelClick=()=>{
                context.emit('close')
            }
            return {
                propertyDraw,
                selectProperty,
                selectMetaIndex,
                propertyDrawClose,
                cancelClick,
                submitClick
            }
        }
    })
</script>

<style scoped>

</style>