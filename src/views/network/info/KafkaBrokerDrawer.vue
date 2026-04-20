<template>
    <el-drawer v-model="dataInfo.status" :size="'25%'" >
        <el-form :model="dataInfo" label-width="80">
            <el-form-item :label="$t('common.name')">
                <el-input v-model="dataInfo.data.networkConfigPo.name" />
            </el-form-item>
            <el-form-item v-if="!dataInfo.add" :label="$t('networkDrawer.ipAddress')">
                <el-input v-model="dataInfo.data.networkConfigPo.configuration.host"/>
            </el-form-item>
            <el-form-item :label="$t('networkDrawer.servicePort')">
                <el-input-number v-model="dataInfo.data.networkConfigPo.configuration.port"/>
            </el-form-item>
            <el-form-item :label="$t('networkDrawer.groupName')">
                <el-input v-model="dataInfo.data.networkConfigPo.configuration.groupId" />
            </el-form-item>
            <el-form-item :label="$t('networkDrawer.groupCount')">
                <el-input-number v-model="dataInfo.data.networkConfigPo.configuration.partitions" />
            </el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-switch
                        v-model="state"
                        width="60"
                        :disabled="dataInfo.add"
                        inline-prompt
                        :active-text="$t('networkDrawer.statusOn')"
                        :inactive-text="$t('networkDrawer.statusOff')"
                />
            </el-form-item>
            <el-form-item :label="$t('networkDrawer.topics')">
                <el-input-tag v-model="dataInfo.data.networkConfigPo.configuration.topics" clearable :placeholder="$t('networkDrawer.topicsPlaceholder')" />
            </el-form-item>
        </el-form>
        <template #header>
            <div>
                <el-space wrap>
                    <el-text size="large">{{dataInfo.add ? $t('networkDrawer.addTitle') : $t('networkDrawer.editTitle')}}</el-text><el-tag effect="dark">Kafka</el-tag>
                </el-space>
            </div>
        </template>
        <template #footer>
            <el-button type="primary" :loading="dataInfo.saveloading" @click="saveClick">{{ $t('common.save') }}</el-button>
        </template>
    </el-drawer>
</template>
<script>
    import {defineComponent, reactive, ref,toRef, getCurrentInstance, onMounted,computed} from "vue"
    import {useRouter} from "vue-router";
    import { useI18n } from 'vue-i18n';

    export default defineComponent({
        name: "KafkaBrokerDrawer",
        props: {
            data: {
                type: Object,
                required: false,
                default: () => ({saveloading:false,add:false,status:false,data:{}})
            }
        },
        emits:['submit'],
        setup(props, context) {
            const { t } = useI18n()
            const input = ref(['tag1', 'tag2', 'tag3'])
            const dataInfo=toRef(props,'data')
            const state=computed({
                get(){
                    return dataInfo.value.data.networkConfigPo.state == 1;
                },
                set(v){
                    dataInfo.value.data.networkConfigPo.state = v?1:0;
                }
            })
            const saveClick=()=>{
                context.emit("submit",dataInfo.value)
            }
            return {
                state,
                input,
                dataInfo,
                saveClick
            }
        }
    })
</script>
