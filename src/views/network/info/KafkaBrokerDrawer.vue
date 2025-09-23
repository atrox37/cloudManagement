<template>
    <el-drawer v-model="dataInfo.status" :size="'25%'" >
        <el-form :model="dataInfo" label-width="80">
            <el-form-item label="名称">
                <el-input v-model="dataInfo.data.networkConfigPo.name" />
            </el-form-item>
            <el-form-item v-if="!dataInfo.add" label="ip地址">
                <el-input v-model="dataInfo.data.networkConfigPo.configuration.host"/>
            </el-form-item>
            <el-form-item label="服务端口">
                <el-input-number v-model="dataInfo.data.networkConfigPo.configuration.port"/>
            </el-form-item>
            <el-form-item label="组别名称">
                <el-input v-model="dataInfo.data.networkConfigPo.configuration.groupId" />
            </el-form-item>
            <el-form-item label="组别数量">
                <el-input-number v-model="dataInfo.data.networkConfigPo.configuration.partitions" />
            </el-form-item>
            <el-form-item label="状态">
                <el-switch
                        v-model="state"
                        width="60"
                        :disabled="dataInfo.add"
                        inline-prompt
                        active-text="开启"
                        inactive-text="关闭"
                />
            </el-form-item>
            <el-form-item label="主题">
                <el-input-tag v-model="dataInfo.data.networkConfigPo.configuration.topics" clearable placeholder="请输入订阅的主题，回车确认" />
            </el-form-item>
        </el-form>
        <template #header>
            <div>
                <el-space wrap>
                    <el-text size="large">{{dataInfo.add?'添加':'编辑'}}</el-text><el-tag effect="dark">Kafka</el-tag>
                </el-space>

            </div>
        </template>
        <template #footer>
            <el-button type="primary" :loading="dataInfo.saveloading" @click="saveClick">保存</el-button>
        </template>
    </el-drawer>
</template>
<script>
    import {defineComponent, reactive, ref,toRef, getCurrentInstance, onMounted,computed} from "vue"
    import {useRouter} from "vue-router";

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