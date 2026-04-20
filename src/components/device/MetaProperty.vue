<template>
    <el-drawer v-model="propertyDraw" :before-close="propertyDrawClose" :size="'25%'" :title="$t('deviceMeta.propertyDrawer')">
        <template #default>
            <el-form :data="selectProperty" label-position="top">
                <el-form-item :label="$t('deviceMeta.propertyId')">
                    <el-input v-model="selectProperty.id" :disabled="selectMetaIndex>=0"/>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.propertyName')">
                    <el-input v-model="selectProperty.name"/>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.dataType')">
                    <el-input v-model="selectProperty.valueType.type"/>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.dataUnit')">
                    <el-input v-model="selectProperty.valueType.unit"/>
                </el-form-item>
            </el-form>
        </template>
        <template #footer>
            <el-divider />
            <div class="center-flex-contain">
                <el-button type="info" @click="cancelClick">{{ $t('common.cancel') }}</el-button>
                <el-button type="primary" @click="submitClick">{{ $t('common.save') }}</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script>
    import {ref, reactive, defineComponent, getCurrentInstance, onMounted, toRef} from "vue";
    import { useI18n } from "vue-i18n";
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
            const { t } = useI18n()
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