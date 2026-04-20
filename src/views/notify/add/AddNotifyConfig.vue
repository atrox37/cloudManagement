<template>
    <div v-if="!loading" style="width: 100%;height:100%;padding: 0;margin: 0px">
        <MenuContainerHeader :label="titleLabel" @backFunc="backClick">
        </MenuContainerHeader>
        <el-form label-position="left" class="el_form_style">
            <el-form-item class="el_item_style" :label="$t('addNotifyConfig.notifyName')" :label-width="labelWidth">
                <el-input v-model="saveData.name" class="el_item_input"></el-input>
            </el-form-item>

            <el-form-item class="el_item_style" :label="$t('addNotifyConfig.notifyType')" :label-width="labelWidth">
                <el-select v-model="selectCode" class="el_item_input">
                    <el-option v-for="(item,index) in configs" :key="index" :value="item.code" :label="item.name"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item class="el_item_style" :label="item.label" :label-width="labelWidth" v-for="(item,index) in selectConfig" >
                <div v-if="item.type == 'string'">
                    <el-input v-model="item.value" class="el_item_input"></el-input>
                </div>
                <div v-if="item.type == 'number'">
                    <el-input-number v-model="item.value" class="el_item_input"></el-input-number>
                </div>
                <div v-if="item.type == 'boolean'">
                    <el-select v-model="item.value" class="el_item_input">
                        <el-option key="1" :label="$t('common.yes')" value="true"/>
                        <el-option key="0" :label="$t('common.no')" value="false"/>
                    </el-select>
                </div>
            </el-form-item>
            <el-form-item class="el_item_style" :label-width="labelWidth">
                <el-button type="primary" @click="onSubmit">{{ $t('addNotifyConfig.create') }}</el-button>
                <el-button @click="backClick">{{ $t('common.cancel') }}</el-button>
            </el-form-item>
        </el-form>
    </div>
    <Loading :loading="loading"></Loading>
</template>

<script>
    import MenuContainerHeader from '@/components/menuContain/MenuContainerHeader.vue';
    import Loading from '@/components/load/Loading.vue';
    import {defineComponent,reactive,ref,getCurrentInstance,onMounted,watch} from "vue"
    import {useRoute, useRouter} from "vue-router";
    import { ElMessage } from 'element-plus'
    import { useI18n } from 'vue-i18n'
    export default defineComponent({
        name: "AddNotifyConfig",
        components:{MenuContainerHeader,Loading},
        setup(){
            const { t } = useI18n()
            const {proxy} = getCurrentInstance()
            const saveData=reactive({})
            const labelWidth=ref('100')
            const router=useRouter()
            const route = useRoute()
            const configs=reactive([])
            const selectConfig = reactive([])
            const selectCode=ref('')
            const loading=ref(true)
            const titleLabel=ref('');

            watch(selectCode,value => {
                for(let item of configs){
                    if(item.code == value){
                        selectConfig.length=0
                        selectConfig.push(...item.config)
                        break;
                    }
                }
                if(value == saveData.code.code){
                    for(let item in selectConfig){
                        selectConfig[item].value=saveData.config[selectConfig[item].name]
                    }
                }
                console.log('watch selectCode')
            })
            const backClick=function(){
                router.go(-1)
            }
            const saveOrUpdateApi=()=>{
                proxy.$http.notifyConfigSaveUpdate(saveData).then(value =>{
                    console.log('saveApi')
                        ElMessage({
                            message: t('common.operationSuccess'),
                            type: 'success',
                        })
                        backClick()
                },error=>{
                    console.log('saveApi error')
                        ElMessage({
                            message: t('common.operationFail'),
                            type: 'error',
                        })
                        backClick()
                })

            }

            const onSubmit=function(){
                saveData.code=selectCode.value
                saveData.configStr={}

                for(var item of selectConfig){
                    if(item.type == 'string'){
                        saveData.configStr[item.name]=item.value
                    }else if(item.type == 'boolean'){
                        saveData.configStr[item.name]=JSON.parse(item.value)
                    }else if(item.type == 'number'){
                        saveData.configStr[item.name]=parseFloat(item.value)
                    }
                }
                let str=JSON.stringify(saveData.configStr)
                delete saveData.config
                delete saveData.configStr
                saveData.configStr=str
                console.log('submit')
                saveOrUpdateApi()
            }



            const instanceConfigApi=()=>{
                var param={terms:[{column:'t.id',value:route.query.id}]}
                proxy.$http.notifyConfigDetail(param).then(value => {
                    console.log('instanceConfigApi')
                    selectCode.value=value.data.configPo.code.code
                    for(var key in value.data.configPo){
                        if(key == 'createTime'||key == 'creatorId'){
                            continue
                        }else{
                            saveData[key]=value.data.configPo[key]
                        }

                    }
                    console.log('instanceConfigApi')
                })
            }
            const supportConfigApi=()=>{
                proxy.$http.notifySupport().then(value=>{
                    console.log(JSON.stringify(value.data))
                    loading.value=false
                    for(const index in value.data){
                        var v=JSON.parse(value.data[index].config)
                        value.data[index].config=v
                    }
                    configs.length=0
                    configs.push(...value.data)
                    console.log('supportConfigApi')
                    if(route.query.id!=null){
                        instanceConfigApi()
                    }else{
                        selectCode.value=configs[0].code
                    }
                })
            }
            onMounted(() => {
                titleLabel.value = t('addNotifyConfig.detail')
                supportConfigApi()
            })
            return {saveData,labelWidth,configs,selectCode,selectConfig,loading,titleLabel,backClick,onSubmit,t}
        }
    })
</script>

<style lang="scss" scoped>
    @import url('~/element-plus/dist/index.css');
    .el_form_style{
        margin:0px 10px;
        box-sizing: border-box;
        padding: 10px 10px;
        background: var(--el-color-white);
    }
    .el_item_style{
        --el-main-padding: 0px;
        margin-bottom: 5px
    }
    .el_item_input{
        width: 500px;
    }
</style>