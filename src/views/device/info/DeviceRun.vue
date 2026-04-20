<template>
    <div class="tab-pan-content" style="height: calc(100% - 50px)">
        <el-row :gutter="0">
            <el-col :span="6" v-for="(item,index) in showMeas" :key="index">
                <DeviceCard :meta="item" ref="childRef" @writeClick="writeClick" @readClick="readClick" @itemClick="itemClick" :data="hD"></DeviceCard>
            </el-col>
        </el-row>
    </div>
    <el-space direction="horizontal" alignment="start" :size="5" class="property-tag-container">
        <!--:type="selectTagId.id==item.id?'primary':'info'"-->
        <!--@click="(event)=>propertyTagClick(pindex)"-->
        <el-tag v-for="(item,pindex) in propertyTags" :type="item.selected!=undefined&&item.selected?'primary':'info'"  @click="(event)=>propertyTagClick(pindex)">
            <template #default>
                {{item.name}}
            </template>
        </el-tag>
    </el-space>
</template>

<script>
    import { toRef,ref,reactive,defineComponent,getCurrentInstance,onMounted,watch,computed } from "vue";
    import DeviceCard from '@/components/device/DeviceCard.vue'
    import { useI18n } from "vue-i18n"
    export default defineComponent({
        name: "DeviceRun",
        components:{
            DeviceCard
        },
        props:{
            deviceMeta: {
                type: Object,
                required: true
            },
            historyData:{
                type:Object,
                required: true,
                default: () => ({})
            }
        },
        emits:['readProperty','writeProperty','propertyClick'],
        setup(props,context){
            const { t } = useI18n()
            const deviceMeta=toRef(props,'deviceMeta')
            const propertyTags=reactive([])
            const hD=toRef(props,'historyData')
            const selectTag=ref({})
            const metas=reactive([])
            metas.push(...deviceMeta.value.metadata.properties)
            const childRef = ref(null);
            const initData=()=>{
                metas.length=0
                metas.push(...deviceMeta.value.metadata.properties)
                propertyTags.length=0
                propertyTags.push({name:t('common.all'),selected:true})
                propertyTags.push(...deviceMeta.value.metadata.propertyTags)
            }
            const showMeas=computed(()=>{
                var d=[]
                for(var i in metas){
                     if(selectTag.value.id==undefined||(selectTag.value.id!=undefined&&selectTag.value.id==metas[i].tagId)){
                        d.push(metas[i])
                    }
                }
                console.log('showMeas')
                return d
            })
            const itemClick=function(data){
                context.emit("propertyClick",data)
            }
            const readClick=function (data){
              context.emit('readProperty',data)
            }
            const writeClick=function (data){
              context.emit('writeProperty',data)
            }
            const showCell=(item)=>{
                if(selectTag.value.id==undefined||(selectTag.value.id!=undefined&&selectTag.value.id==item.tagId)){
                    return true
                }else{
                    return false
                }
            }
            const propertyTagClick=(index)=>{
                if(!(propertyTags[index].selected!=undefined&&propertyTags[index].selected)){
                    for(var i in propertyTags)propertyTags[i].selected=false
                    propertyTags[index].selected=true
                }
                selectTag.value=propertyTags[index]
            }
            const changeData=(data)=>{
                const dataObjs=JSON.parse(data)
                for(const item in dataObjs){
                    for(const index in childRef.value){
                        if(childRef.value[index].meta.id==dataObjs[item].property){
                            childRef.value[index].changeData(dataObjs[item].numberValue,dataObjs[item].rawValue)
                            childRef.value[index].changeTs(dataObjs[item].ts)
                            break;
                        }
                    }
                }
                console.log('changeData')
            }
            watch(deviceMeta,(newData,oldData)=>{
                console.log('deviceMeta数据发生变化')
                initData()

            })

            onMounted(()=>{
                console.log('DeviceRun onMounted')
                initData()
            })
            return {
                propertyTags,
                metas,
                childRef,
                hD,
                showMeas,
                itemClick,
                readClick,
                changeData,
                writeClick,
                propertyTagClick
            }
        }
    })
</script>
<style scoped lang="scss">
  @import "@/views/device/style/DeviceRun.scss";
</style>
