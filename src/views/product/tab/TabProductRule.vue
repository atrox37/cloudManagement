<template>
  <div class="tab-pan-content">
    <el-table :data="data.rules">
      <el-table-column prop="name" label="规则名称" width="200" header-align="center" align="center"/>
      <el-table-column label="轮询周期" header-align="center" align="center">
        <template #default="scope">
          {{ handlerCroe(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="采集时长" header-align="center" align="center">
        <template #default="scope">
          {{ handlerColTime(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="阈值次数" header-align="center" align="center">
        <template #default="scope">
          {{ handerCount(scope.row) }}
        </template>
      </el-table-column>

      <el-table-column label="条件" min-width="240" header-align="center" align="center">
        <template #default="scope">
          <el-text class="cell-pre">{{ formatSql(scope.row) }}</el-text>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center">
        <template #header>
          <el-button @click="add()" class="login_btn" type="primary">添加</el-button>
        </template>
        <template #default="scope">
          <el-button @click="edit(scope.row)" class="login_btn" type="primary">修改</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
  <DialogProductRule :data="ruleData"></DialogProductRule>
</template>

<script>
import {defineComponent, ref, onMounted, reactive, getCurrentInstance} from 'vue'
import DialogProductRule from "@/components/product/DialogProductRule.vue";
import cronstrue from 'cronstrue/i18n'
import {productParse} from "@/util/request";

export default defineComponent({
  name: 'TabProductRule',
  components: {DialogProductRule},
  setup() {
    const {proxy} = getCurrentInstance()
    const ruleData = reactive({status: false, loading: false, rule: {},column:[]})
    // 演示数据（父组件未传入时仍能展示）
    const data = ref(JSON.parse("{\"properties\":[{\"id\":\"num\",\"name\":\"num名字\",\"tagId\":\"1\",\"rw\":\"write\",\"valueType\":{\"extra\":{\"point\":1},\"type\":\"number\",\"unit\":\"percent\"}},{\"id\":\"data\",\"name\":\"data名字\",\"tagId\":\"2\",\"rw\":\"write\",\"valueType\":{\"extra\":{\"point\":1},\"type\":\"number\",\"unit\":\"data\"}},{\"id\":\"mm\",\"name\":\"mm\",\"tagId\":\"1\",\"rw\":\"write\",\"valueType\":{\"extra\":{\"enumData\":[{\"key\":\"1\",\"value\":\"开\"},{\"key\":\"0\",\"value\":\"关\"}]},\"type\":\"enum\",\"unit\":\"data\"}},{\"id\":\"mm2\",\"name\":\"mm2\",\"tagId\":\"1\",\"rw\":\"write\",\"valueType\":{\"extra\":{\"length\":null},\"type\":\"string\",\"unit\":\"percent\"}},{\"id\":\"str\",\"name\":\"str\",\"tagId\":\"1\",\"rw\":\"write\",\"valueType\":{\"extra\":{\"length\":null},\"type\":\"string\",\"unit\":\"percent\"}},{\"id\":\"p\",\"name\":\"p\",\"tagId\":\"1\",\"rw\":\"write\",\"valueType\":{\"extra\":{\"length\":null},\"type\":\"string\",\"unit\":\"data\"}}],\"functions\":[{\"id\":\"funid\",\"name\":\"funname\",\"async\":false,\"inputs\":[{\"id\":\"arg1\",\"name\":\"arg1name\",\"valueType\":{\"extra\":{\"enumData\":[{\"key\":\"1\",\"value\":\"开\"},{\"key\":\"0\",\"value\":\"关\"}]},\"type\":\"enum\",\"unit\":\"data\"}},{\"id\":\"arg2\",\"name\":\"arg2name\",\"valueType\":{\"extra\":{\"length\":null},\"type\":\"string\",\"unit\":\"percent\"}},{\"id\":\"arg3\",\"name\":\"arg3name\",\"valueType\":{\"extra\":{\"point\":0},\"type\":\"number\",\"unit\":\"percent\"}},{\"id\":\"a1\",\"name\":\"a1\",\"valueType\":{\"extra\":{\"point\":0},\"type\":\"number\",\"unit\":\"percent\"}},{\"id\":\"a2\",\"name\":\"a2\",\"valueType\":{\"extra\":{\"point\":0},\"type\":\"number\",\"unit\":\"percent\"}},{\"id\":\"a3\",\"name\":\"a3\",\"valueType\":{\"extra\":{\"point\":0},\"type\":\"number\",\"unit\":\"percent\"}},{\"id\":\"a4\",\"name\":\"a4\",\"valueType\":{\"extra\":{\"point\":0},\"type\":\"number\",\"unit\":\"percent\"}},{\"id\":\"a5\",\"name\":\"a5\",\"valueType\":{\"extra\":{\"point\":0},\"type\":\"number\",\"unit\":\"percent\"}}],\"outputs\":[{\"id\":\"arg1\",\"name\":\"arg1name\",\"valueType\":{\"extra\":{\"length\":null},\"type\":\"string\",\"unit\":\"count\"}}]},{\"id\":\"funid2\",\"name\":\"功能2\",\"async\":true,\"inputs\":[{\"id\":\"arg1\",\"name\":\"arg1name\",\"valueType\":{\"extra\":{\"point\":0},\"type\":\"number\",\"unit\":\"percent\"}}],\"outputs\":[{\"id\":\"result1\",\"name\":\"result1name\",\"valueType\":{\"extra\":{\"point\":0},\"type\":\"number\",\"unit\":\"percent\"}}]}],\"propertyTags\":[{\"id\":\"1\",\"name\":\"遥测\"},{\"id\":\"2\",\"name\":\"遥调\"}],\"rules\":[{\"name\":\"默认规则\",\"ruleData\":{\"type\":\"time\",\"count\":2,\"collTime\":5,\"cron\":\"0/10 * * * * ?\"},\"ruleMeta\":{\"sql\":\"select * where (num > ? and data > ?) or (mm = ?)\",\"param\":{\"mm\":[\"1\"],\"data\":[1.0],\"num\":[10.0]}}}],\"trees\":[]}"))

    const handlerCroe = (row) => cronstrue.toString(row.ruleData.cron, {locale: 'zh_CN'})
    const handlerColTime = (row) => `采集${row.ruleData.collTime}秒`
    const handerCount = (row) => "阈值" + row.ruleData.count + "次"



    // 条件列：将 SQL 中的占位符用参数替换，并将属性 id 替换为 name
    const formatSql = (row) => {
      try {
        if (!row || !row.ruleMeta) return ''
        let sql = String(row.ruleMeta.sql || '')
        const param = row.ruleMeta.param || {}

        const props = Array.isArray(data.value?.properties) ? data.value.properties : []
        const idNameMap = props.reduce((acc, p) => {
          acc[p.id] = p.name || p.id;
          return acc
        }, {})

        // 复制参数数组，以便按出现顺序依次替换
        const buckets = {}
        Object.keys(param).forEach(k => {
          const v = param[k]
          buckets[k] = Array.isArray(v) ? [...v] : [v]
        })

        // 去掉前缀 select * where
        sql = sql.replace(/^\s*select\s*\*\s*where\s*/i, '')

        // 将 "id OP ?" 替换为 "name OP value"
        sql = sql.replace(/\b([a-zA-Z_][\w]*)\b(\s*(?:>=|<=|!=|=|>|<)\s*)\?/g, (m, key, op) => {
          const name = idNameMap[key] || key
          const list = buckets[key] || []
          const value = list.length ? list.shift() : '?'
          buckets[key] = list
          return `${name}${op}${value}`
        })

        // 其余独立出现的 id 也替换为 name
        Object.keys(idNameMap).forEach(id => {
          const escaped = id.replace(/[\-\\/\\^$*+?.()|[\]{}]/g, r => `\\${r}`)
          const re = new RegExp(`\\b${escaped}\\b`, 'g')
          sql = sql.replace(re, idNameMap[id])
        })

        // and/or 美化为中文
        sql = sql.replace(/\band\b/ig, " 且 ").replace(/\bor\b/ig, " 或 ")
        return sql.trim()
      } catch (e) {
        return String(e)
      }
    }

    const parseApi=(param)=>{
      proxy.$http.productParse(param).then(result=>{
        console.log('success')
        ruleData.column.length=0
        ruleData.column.push(...result.data)
      },error=>{
        console.log('error')
      })
    }

    const edit=(row)=>{
      ruleData.rule=JSON.parse(JSON.stringify(row))
      console.log('edit')
      parseApi(row.ruleMeta)
    }
    const add=()=>{
      console.log('add')
    }


    onMounted(() => {
      // eslint-disable-next-line no-console
      console.log('TabProductRule mounted', data.value?.rules)
    })

    return {data, ruleData, handlerCroe, handlerColTime, handerCount, formatSql,add,edit}
  }
})
</script>

<style>
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
</style>
