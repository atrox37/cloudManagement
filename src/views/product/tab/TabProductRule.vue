<template>
  <div class="tab-pan-content">
    <el-table :data="data.rules">
      <el-table-column
        prop="name"
        label="规则名称"
        width="200"
        header-align="center"
        align="center"
      />
      <el-table-column label="轮询周期" header-align="center" align="center">
        <template #default="scope">
          {{ handlerCroe(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="阈值次数" header-align="center" align="center">
        <template #default="scope">
          {{ handerCount(scope.row) }}
        </template>
      </el-table-column>

      <el-table-column
        label="条件"
        min-width="240"
        header-align="center"
        align="center"
      >
        <template #default="scope">
          <el-text class="cell-pre">{{ formatSql(scope.row) }}</el-text>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center" min-width="200">
        <template #header>
          <el-button @click="add()" class="login_btn" type="primary"
            ><el-icon><Plus /></el-icon>添加
          </el-button>
          <el-button @click="saveAll" class="login_btn" type="primary"
            ><el-icon><Finished /></el-icon>保存
          </el-button>
        </template>
        <template #default="scope">
          <el-button-group>
            <el-button
              @click="edit(scope.row, scope.$index)"
              class="login_btn"
              type="primary"
            >
              修改
            </el-button>
            <el-button @click="deleteClick(scope.$index)">删除</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
  </div>
  <DialogProductRule :data="ruleData"></DialogProductRule>
</template>

<script>
import {
  defineComponent,
  ref,
  onMounted,
  reactive,
  getCurrentInstance,
} from "vue";
import DialogProductRule from "@/components/product/DialogProductRule.vue";
import cronstrue from "cronstrue/i18n";
import { productParse } from "@/util/request";
import { Finished, Plus } from "@element-plus/icons-vue";
import { randomIds } from "@/util/common/randomUtil.js";

export default defineComponent({
  name: "TabProductRule",
  components: { DialogProductRule },
  props: {
    productData: {
      type: Object,
      required: false,
    },
  },
  emits: ["open"],
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const ruleData = reactive({
      status: false,
      loading: false,
      rule: {},
      column: [],
    });
    // 演示数据（父组件未传入时仍能展示）
    const data = ref(props.productData.metadata);

    const handlerCroe = (row) =>
      cronstrue.toString(row.ruleData.cron, { locale: "zh_CN" });
    const handerCount = (row) => "阈值" + row.ruleData.count + "次";

    // 条件列：将 SQL 中的占位符用参数替换，并将属性 id 替换为 name
    const formatSql = (row) => {
      try {
        if (!row || !row.ruleMeta) return "";
        let sql = String(row.ruleMeta.sql || "");
        const param = row.ruleMeta.param || {};

        const props = Array.isArray(data.value?.properties)
          ? data.value.properties
          : [];
        const idNameMap = props.reduce((acc, p) => {
          acc[p.id] = p.name || p.id;
          return acc;
        }, {});

        // 复制参数数组，以便按出现顺序依次替换
        const buckets = {};
        Object.keys(param).forEach((k) => {
          const v = param[k];
          buckets[k] = Array.isArray(v) ? [...v] : [v];
        });

        // 去掉前缀 select * where
        sql = sql.replace(/^\s*select\s*\*\s*where\s*/i, "");

        // 将 "id OP ?" 替换为 "name OP value"
        sql = sql.replace(
          /\b([a-zA-Z_][\w]*)\b(\s*(?:>=|<=|!=|=|>|<)\s*)\?/g,
          (m, key, op) => {
            const name = idNameMap[key] || key;
            const list = buckets[key] || [];
            const value = list.length ? list.shift() : "?";
            buckets[key] = list;
            return `${name}${op}${value}`;
          }
        );

        // 其余独立出现的 id 也替换为 name
        Object.keys(idNameMap).forEach((id) => {
          const escaped = id.replace(
            /[\-\\/\\^$*+?.()|[\]{}]/g,
            (r) => `\\${r}`
          );
          const re = new RegExp(`\\b${escaped}\\b`, "g");
          sql = sql.replace(re, idNameMap[id]);
        });

        // and/or 美化为中文
        sql = sql.replace(/\band\b/gi, " 且 ").replace(/\bor\b/gi, " 或 ");
        return sql.trim();
      } catch (e) {
        return String(e);
      }
    };

    const parseApi = (row, index) => {
      proxy.$http.productParse(row.ruleMeta).then(
        (result) => {
          console.log("success");
          // ruleData.column.length = 0
          // ruleData.column.push(...result.data)
          context.emit(
            "open",
            { columns: result.data, rulePo: row },
            index,
            data.value
          );
        },
        (error) => {
          console.log("error");
        }
      );
    };
    const saveAll = () => {
      // console.log("save");
      context.emit("save", data.value);
    };
    const edit = (row, index) => {
      ruleData.rule = JSON.parse(JSON.stringify(row));
      if (typeof ruleData.rule.state === "undefined" || ruleData.rule.state === null) {
        ruleData.rule.state = 0;
      }
      console.log("edit");
      parseApi(row, index);
    };
    const deleteClick = (index) => {
      data.value.rules.splice(index, 1);
    };
    const add = () => {
      const index = data.value.rules.length;
      const ids = data.value.rules.map(({ id }) => id);
      var newId=randomIds(ids)
      context.emit(
        "open",
        {
          columns: [],
          rulePo: {
            id: newId,
            name: "",
            state: 0,
            ruleData: { type: "time", cron: "", count: 0 },
          },
        },
        index,
        data.value
      );
    };

    onMounted(() => {
      // eslint-disable-next-line no-console
      console.log("TabProductRule mounted", data.value?.rules);
    });

    return {
      data,
      ruleData,
      handlerCroe,
      handerCount,
      formatSql,
      add,
      edit,
      deleteClick,
      saveAll,
      Finished,
      Plus,
    };
  },
});
</script>

<style scoped>
.tab-pan-content {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: transparent;
}

.cell-pre {
  white-space: pre-wrap;
  margin: 0;
}

:deep(.el-icon) {
  margin-right: 5px;
}
</style>
