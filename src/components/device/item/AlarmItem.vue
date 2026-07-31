<template>
    <!-- {{ dataCondition }} -->
    <el-table :data="dataCondition" class="border-dash-table" border>
        <el-table-column :label="$t('alarmItem.property')" >
            <template #default="scope">
                <el-select v-model="scope.row.column" placeholder="Select" style="margin: 0;width: calc(80% - 5px)" @change="(value)=>{handlerOperation(value,scope.$index,true);}">
                    <el-option
                            v-for="(propertyitem,propertyindex) in property"
                            :key="propertyindex"
                            :label="propertyitem.name"
                            :value="propertyitem.id"/>
                </el-select>
            </template>

        </el-table-column>
        <el-table-column :label="$t('alarmItem.comparison')" >
            <template #default="scope">
                <el-select v-model="scope.row.operation" placeholder="" @change="handlerComparisonChange(scope.row)">
                    <el-option
                            v-for="itemChild in scope.row.condition"
                            :key="itemChild.value"
                            :label="itemChild.label"
                            :value="itemChild.value"/>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column :label="$t('alarmItem.value')" >
            <template #default="scope">
                <el-input-number v-if="scope.row.valueType=='number'" v-model="scope.row.value" ></el-input-number>
                <el-select v-if="scope.row.valueType=='enum'" v-model="scope.row.value">
                    <el-option
                            v-for="itemChild in scope.row.enumData"
                            :key="itemChild.key"
                            :label="itemChild.value"
                            :value="String(itemChild.key)"/>
                </el-select>
                <el-input v-if="scope.row.valueType=='string' && scope.row.operation!='IS NOT NULL'" style="margin: 0;width: calc(80% - 5px)" v-model="scope.row.value" ></el-input>
            </template>
        </el-table-column>
        <el-table-column :label="$t('alarmItem.operation')">
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
    import {ref, reactive, computed, defineComponent, watch, onMounted, toRef} from "vue";
    import { useI18n } from 'vue-i18n';
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
            const { t } = useI18n()
            const sourceDevice=toRef(props,'deviceData')
            const sourceAlarmData=toRef(props,'alarmData')
            const property=ref([])
            const dataCondition=reactive([])
            const compareNum = computed(() => [
                {value: '>',label: t('alarmItem.greaterThan')},
                {value: '<',label: t('alarmItem.lessThan')},
                {value: '=',label: t('alarmItem.equalTo')}
            ])
            const compareEnum = computed(() => [
                {value: '=',label: t('alarmItem.equalTo')}
            ])
            const compareStr = computed(() => [
                {value: '=',label: t('alarmItem.equalTo')},
                {value: 'IS NOT NULL',label: t('alarmItem.notNull')}
            ])

            const addFunc=()=>{
                if(property.value.length === 0) return;
                
                // 添加新行，使用正确的字段名
                const newIndex = dataCondition.length;
                dataCondition.push({
                    column: property.value[0].id,
                    operation: undefined,
                    value: undefined,
                    condition: [],
                    valueType: ''
                });

                // 初始化新添加的行
                handlerOperation(property.value[0].id, newIndex, true);
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

            const handlerOperation=(value,index,resetValue=false)=>{
                // 找到对应的属性
                const selectedProperty = property.value.find(p => p.id === value);
                if (!selectedProperty) return;

                // 确保当前行存在
                if (!dataCondition[index]) return;

                const row = dataCondition[index];
                const valueType = selectedProperty.valueType.type;
                if(valueType === 'number'){
                    row.condition = compareNum.value;
                }else if(valueType === 'enum'){
                    row.condition = compareEnum.value;
                }else{
                    row.condition = compareStr.value;
                }
                row.valueType = valueType;

                if(!row.condition.some(item => item.value === row.operation)){
                    row.operation = row.condition[0].value;
                }

                if(valueType === 'number'){
                    delete row.enumData;
                    const numberValue = Number(row.value);
                    row.value = resetValue || !Number.isFinite(numberValue) ? 0 : numberValue;
                }else if(valueType === 'enum'){
                    row.enumData = (selectedProperty.valueType.extra?.enumData || []).map(item => ({
                        ...item,
                        key: String(item.key)
                    }));
                    const currentValue = row.value == null ? '' : String(row.value);
                    const hasCurrentValue = row.enumData.some(item => item.key === currentValue);
                    row.value = !resetValue && hasCurrentValue
                        ? currentValue
                        : (row.enumData[0]?.key || '');
                }else{
                    delete row.enumData;
                    row.value = resetValue || row.value == null ? '' : String(row.value);
                }
            }

            const handlerComparisonChange=(row)=>{
                if(row.valueType === 'string' && row.operation === '=' && typeof row.value !== 'string'){
                    row.value = row.value == null ? '' : String(row.value)
                }
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
            return {sourceAlarmData,property,dataCondition,addFunc,delFunc,getProperty,delGroup,handlerOperation,handlerComparisonChange}
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
