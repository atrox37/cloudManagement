<template>
  <el-table :data="dataCondition" class="border-dash-table" border>
    <el-table-column label="属性">
      <template #default="scope">
        <el-select
          v-model="scope.row.column"
          placeholder="Select"
          style="margin: 0; width: calc(80% - 5px)"
          @change="
            (value) => {
              handlerOperation(value, scope.$index);
              handlerConditionChange(scope.$index);
            }
          "
        >
          <el-option
            v-for="(propertyitem, propertyindex) in property"
            :key="propertyindex"
            :label="propertyitem.name"
            :value="propertyitem.id"
          />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column label="比较">
      <template #default="scope">
        <el-select v-model="scope.row.operation" placeholder="">
          <el-option
            v-for="itemChild in scope.row.condition"
            :key="itemChild.value"
            :label="itemChild.label"
            :value="itemChild.value"
          />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column label="值">
      <template #default="scope">
        <el-input-number
          v-if="scope.row.valueType == 'number' && scope.row.operation != 'IS NOT NULL'"
          v-model="scope.row.value"
        ></el-input-number>
        <el-select
          v-if="scope.row.valueType == 'enum' && scope.row.operation != 'IS NOT NULL'"
          v-model="scope.row.value"
        >
          <el-option
            v-for="itemChild in scope.row.enumData"
            :key="itemChild.key"
            :label="itemChild.value"
            :value="itemChild.key"
          />
        </el-select>
        <el-input
          v-if="scope.row.valueType == 'string' && scope.row.operation != 'IS NOT NULL'"
          style="margin: 0; width: calc(80% - 5px)"
          v-model="scope.row.value"
        ></el-input>
      </template>
    </el-table-column>
    <el-table-column label="操作">
      <template #header>
        <el-button type="primary" icon="Plus" size="small" @click="addFunc" />
        <el-button
          type="primary"
          class="custom-class"
          icon="Delete"
          size="small"
          @click="delGroup()"
        />
      </template>
      <template #default="scope">
        <el-button
          type="primary"
          class="custom-class"
          icon="Delete"
          size="small"
          @click="delFunc(scope.$index)"
        />
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import { ref, reactive, defineComponent, watch, onMounted, toRef } from "vue";
export default defineComponent({
  name: "AlarmItem",
  props: {
    productData: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    alarmData: {
      type: Object,
      required: true,
      default: () => [],
    },
  },
  emits: ["delGroup"],
  setup(props, context) {
    const sourceproduct = toRef(props, "productData");
    const sourceAlarmData = toRef(props, "alarmData");
    const property = ref([]);
    const dataCondition = reactive([]);
    const compareNum = [{value: '>',label: '大于'},{value: '<',label: '小于'},{value: '=',label: '等于'}]
    const compareEnum = [{value: '=',label: '等于'}]
    const compareStr = [{value: '=',label: '等于'},{value: 'IS NOT NULL',label: '非空'}]

    const addFunc = () => {
      if (property.value.length === 0) return;
      const newIndex = dataCondition.length;
      dataCondition.push({
        column: property.value[0].id,
        operation: undefined,
        value: undefined,
        condition: [],
        valueType: "",
      });
      handlerOperation(property.value[0].id, newIndex);
      handlerConditionChange(newIndex);
    };
    const delFunc = (index) => {
      console.log("delFunc:", index);
      dataCondition.splice(index, 1);
    };

    const delGroup = () => {
      context.emit("delGroup");
    };
    const getProperty = () => {
      return dataCondition;
    };

    const handlerOperation = (value, index) => {
      // 找到对应的属性
      const selectedProperty = property.value.find(p => p.id === value);
      if (!selectedProperty) return;

      // 确保当前行存在
      if (!dataCondition[index]) return;

      // 根据属性类型设置条件选项
      if (selectedProperty.valueType.type == 'number') {
        selectedProperty.condition = compareNum;
      } else if (selectedProperty.valueType.type == 'enum') {
        selectedProperty.condition = compareEnum;
      } else {
        selectedProperty.condition = compareStr;
      }

      // 更新当前行的条件列表和类型
      dataCondition[index].condition = selectedProperty.condition;
      dataCondition[index].valueType = selectedProperty.valueType.type;

      // 如果是枚举类型，设置枚举数据；否则清除
      if (dataCondition[index].valueType == 'enum') {
        dataCondition[index].enumData = selectedProperty.valueType.extra?.enumData || [];
      } else {
        delete dataCondition[index].enumData;
      }
    };

    // 用户主动切换属性时调用：重置操作符和值为新类型的默认值
    const handlerConditionChange = (index) => {
      const row = dataCondition[index];
      if (!row || !row.condition || row.condition.length === 0) return;

      // 始终重置操作符为当前条件列表的第一个选项
      row.operation = row.condition[0].value;

      // 重置值为当前类型的默认值
      if (row.valueType === 'number') {
        row.value = 0;
      } else if (row.valueType === 'enum') {
        row.value = row.enumData?.length > 0 ? row.enumData[0].key : '';
      } else {
        row.value = '';
      }
      console.log("handlerConditionChange:" + JSON.stringify(row));
    };

    // 加载已有数据时调用：只初始化条件列表，保留已有操作符和值
    const initPropertyCondition = () => {
      for (var i in dataCondition) {
        if (dataCondition[i].column) {
          handlerOperation(dataCondition[i].column, i);
        }
      }
    };

    watch(sourceAlarmData, (value) => {
      dataCondition.length = 0;
      dataCondition.push(...value);
      initPropertyCondition();
      console.log("sourceAlarmData:" + dataCondition.length);
    });
    watch(sourceproduct, (value) => {
      property.value.length = 0;
      property.value = value.metadata.properties;
      initPropertyCondition();
      console.log("change sourceproduct");
    });
    onMounted(() => {
      if (
        sourceproduct != null &&
        sourceproduct.value.metadata.properties.length > 0
      ) {
        property.value.length = 0;
        property.value =
          sourceproduct.value.metadata.properties;
      }
      if (sourceAlarmData != null && sourceAlarmData.value.length > 0) {
        dataCondition.length = 0;
        dataCondition.push(...sourceAlarmData.value);
        initPropertyCondition();
      }
    });
    console.log("alarmItem");
    return {
      sourceAlarmData,
      property,
      dataCondition,
      addFunc,
      delFunc,
      getProperty,
      delGroup,
      handlerOperation,
      handlerConditionChange,
    };
  },
});
</script>

<style scoped>
.border-dash {
  width: 80%;
  padding: 5px 10px 5px 10px;
  box-sizing: content-box;
}

.border-dash-table {
  margin: 0;
  padding: 0;
  width: 90%;
}

.row-style {
  width: 100%;
  height: auto;
  background: #42b983;
}

.el-input-number {
  width: 100%;
}
</style>
