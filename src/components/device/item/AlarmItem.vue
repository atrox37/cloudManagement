<template>
    <!-- {{ dataCondition }} -->
    <el-table :data="dataCondition" class="border-dash-table" border>
        <el-table-column label="属性" >
            <template #default="scope">
                <el-select v-model="scope.row.column" placeholder="Select" style="margin: 0;width: calc(80% - 5px)" @change="(value)=>{handlerOperation(value,scope.$index);}">
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
                <el-input v-if="scope.row.valueType=='string' && scope.row.operation!='IS NOT NULL'" style="margin: 0;width: calc(80% - 5px)" v-model="scope.row.value" ></el-input>
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
            const compareNum = [{value: '>',label: '大于'},{value: '<',label: '小于'},{value: '=',label: '等于'}]
            const compareStr = [{value: '=',label: '等于'},{value: 'IS NOT NULL',label: '非空'}]

            const addFunc=()=>{
                if(property.value.length === 0) return;
                
                // 添加新行，使用正确的字段名
                const newIndex = dataCondition.length;
                dataCondition.push({
                    column: property.value[0].id,
                    operation: '=',
                    value: '',
                    condition: [],
                    valueType: ''
                });
                
                // 初始化新添加的行
                handlerOperation(property.value[0].id, newIndex);
            }
            const delFunc=(index)=>{
                console.log('delFunc:',index)
                dataCondition.splice(index,1)
            }

            const delGroup=()=>{
                context.emit('delGroup')
            }
            const getProperty=()=>{
                console.log('alarmItem getProperty')
                return dataCondition;
            }

            const handlerOperation=(value,index)=>{
                // 找到对应的属性
                const selectedProperty = property.value.find(p => p.id === value);
                if (!selectedProperty) return;
                
                // 确保当前行存在
                if (!dataCondition[index]) return;
                
                // 根据属性类型设置条件选项
                if(selectedProperty.valueType.type=='number'){
                    selectedProperty.condition = compareNum;
                }else{
                    selectedProperty.condition = compareStr;
                }

                // 直接更新当前行的数据
                dataCondition[index].condition = selectedProperty.condition;
                dataCondition[index].valueType = selectedProperty.valueType.type;
                
                // 如果是枚举类型，设置枚举数据
                if(dataCondition[index].valueType=='enum'){
                    dataCondition[index].enumData = selectedProperty.valueType.extra?.enumData || [];
                } else {
                    // 非枚举类型，清除 enumData
                    delete dataCondition[index].enumData;
                }
                
                // 设置默认操作符
                if(dataCondition[index].condition && dataCondition[index].condition.length > 0 && dataCondition[index].operation == undefined){
                    dataCondition[index].operation = dataCondition[index].condition[0].value;
                }
                
                // 根据类型设置默认值
                if(selectedProperty.valueType.type=='number' && dataCondition[index].value == undefined){
                    dataCondition[index].value = 0;
                }else if(selectedProperty.valueType.type=='enum' && dataCondition[index].value == undefined){
                    if(selectedProperty.valueType.extra?.enumData && selectedProperty.valueType.extra.enumData.length>0){
                        dataCondition[index].value = selectedProperty.valueType.extra.enumData[0].key;
                    }else{
                        dataCondition[index].value = '';
                    }
                }else if(selectedProperty.valueType.type=='string' && dataCondition[index].value == undefined){
                    dataCondition[index].value = '';
                }
            }

            const handlerConditionChange=(index)=>{
                // 这个方法现在主要用于重置值，但主要逻辑已经在 handlerOperation 中处理
                // 保留这个方法以防其他地方调用
                console.log('handlerConditionChange:'+JSON.stringify(dataCondition[index]))
            }

            const initPropertyCondition=()=>{
                // 遍历所有 dataCondition 行，初始化每一行的属性条件
                for(var i in dataCondition){
                    if(dataCondition[i].column){
                        handlerOperation(dataCondition[i].column, i);
                    }
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
            return {sourceAlarmData,property,dataCondition,addFunc,delFunc,getProperty,delGroup,handlerOperation,handlerConditionChange}
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