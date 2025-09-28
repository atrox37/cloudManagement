<template>
    <!-- {{ dataCondition }} -->
    <el-table :data="dataCondition" class="border-dash-table" border>
        <el-table-column label="属性" >
            <template #default="scope">
                <el-select v-model="scope.row.column" placeholder="Select" style="margin: 0;width: calc(80% - 5px)" @change="(value)=>{handlerOperation(value,scope.$index);handlerConditionChange(scope.$index);}">
                    <el-option
                            v-for="(propertyitem,propertyindex) in property"
                            :key="propertyindex"
                            :label="propertyitem.name"
                            :value="propertyitem.id"/>
                </el-select>
            </template>

        </el-table-column>
        <el-table-column label="比较" >
            <template #default="scope">
                <el-select v-model="scope.row.operation" placeholder="">
                    <el-option
                            v-for="itemChild in scope.row.condition"
                            :key="itemChild.value"
                            :label="itemChild.label"
                            :value="itemChild.value"/>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="值" >
            <template #default="scope">
                <el-input-number v-if="scope.row.valueType=='number'" v-model="scope.row.value" ></el-input-number>
                <el-select v-if="scope.row.valueType=='enum'" v-model="scope.row.value">
                    <el-option
                            v-for="itemChild in scope.row.enumData"
                            :key="itemChild.value"
                            :label="itemChild.value"
                            :value="itemChild.key"/>
                </el-select>
                <el-input v-if="scope.row.valueType=='string'" style="margin: 0;width: calc(80% - 5px)" v-model="scope.row.value" ></el-input>
            </template>
        </el-table-column>
        <el-table-column label="操作">
            <template #header>
                <el-button type="primary" icon="Plus" size="small" @click="addFunc"/>
                <el-button type="primary" class="custom-class" icon="Delete" size="small" @click="delGroup()"/>
            </template>
            <template #default="scope">
                <el-button type="primary" class="custom-class" icon="Delete" size="small" @click="delFunc(scope.$index)"/>
            </template>
        </el-table-column>
    </el-table>
</template>

<script>
    import {ref, reactive, defineComponent, watch, onMounted, toRef} from "vue";
    export default defineComponent({
        name: "AlarmItem",
        props:{
            deviceData:{
                type: Object,
                required: true,
                default: () => ({})
            },
            alarmData:{
                type: Object,
                required: true,
                default: () => ([])
            }
        },
        emits:['delGroup'],
        setup(props,context){
            const sourceDevice=toRef(props,'deviceData')
            const sourceAlarmData=toRef(props,'alarmData')
            const property=ref([])
            const dataCondition=reactive([])
            const compare = ref([{value: '>',label: '大于',},{value: '<',label: '小于',},{value: '=',label: '等于',}])

            const addFunc=()=>{
                dataCondition.push({dataCondition:property.value[0].id,operation:'=',value:''})
                initPropertyCondition()

            }
            const delFunc=(index)=>{
                console.log('delFunc:',index)
                dataCondition.splice(index,1)
            }

            const delGroup=()=>{
                context.emit('delGroup')
            }
            const getProperty=()=>{
                return dataCondition;
            }

            const handlerOperation=(value,index)=>{
                for(var index in property.value){
                    if(property.value[index].id == value){
                        if(property.value[index].valueType.type=='number'){
                            property.value[index].condition=compare.value
                        }else{
                            property.value[index].condition=[{value: '=',label: '等于'}]
                        }

                        for(var i in dataCondition){
                            if(dataCondition[i].column==value){
                                dataCondition[i].condition=property.value[index].condition
                                dataCondition[i].valueType=property.value[index].valueType.type
                                if(dataCondition[i].valueType=='enum'){
                                    dataCondition[i].enumData=property.value[index].valueType.extra.enumData
                                }
                                break
                            }
                        }
                        break
                    }
                }
            }

            const handlerConditionChange=(index)=>{
                for(var i in property.value){
                    for(var j in dataCondition){
                        if(property.value[i].id==dataCondition[j].column){
                            dataCondition[j].operation = property.value[i].condition[0].value
                            if(property.value[i].valueType.type=='number'){
                                dataCondition[j].value=0
                            }else if(property.value[i].valueType.type=='enum'){
                                if(property.value[i].valueType.extra.enumData.length>0){
                                    dataCondition[j].value=property.value[i].valueType.extra.enumData[0].key
                                }else{
                                    dataCondition[j].value=''
                                }
                            }else{
                                dataCondition[j].value=''
                            }
                            break
                        }
                    }
                }
                console.log('handlerConditionChange:'+JSON.stringify(dataCondition[index]))
            }

            const initPropertyCondition=()=>{
                for(var index in property.value){
                    handlerOperation(property.value[index].id,index)
                }
            }

            watch(sourceAlarmData,value => {
                dataCondition.length=0
                dataCondition.push(...value)
                initPropertyCondition()
                console.log('sourceAlarmData:'+dataCondition.length)
            })
            watch(sourceDevice,value=>{
                property.value.length=0
                property.value=value.deviceInstancePo.metadata.properties
                initPropertyCondition()
                console.log('change sourceDevice')
            })
            onMounted(()=>{
                if(sourceDevice!=null
                    &&sourceDevice.value.deviceInstancePo.metadata.properties.length>0){
                    property.value.length=0
                    property.value=sourceDevice.value.deviceInstancePo.metadata.properties
                }
                if(sourceAlarmData!=null&&sourceAlarmData.value.length>0){
                    dataCondition.length=0
                    dataCondition.push(...sourceAlarmData.value)
                    initPropertyCondition()
                }
            })
          console.log('alarmItem')
            return {sourceAlarmData,property,dataCondition,compare,addFunc,delFunc,getProperty,delGroup,handlerOperation,handlerConditionChange}
        }
    })
</script>

<style scoped>
    .border-dash{
        width: 80%;
        padding: 5px 10px 5px 10px;
        box-sizing: content-box;
    }
    .border-dash-table{
        margin: 0;
        padding: 0;
        width: 90%;
    }
    .row-style{
        width: 100%;
        height: auto;
        background: #42b983;
    }
    .el-input-number{
        width: 100%;
    }
</style>