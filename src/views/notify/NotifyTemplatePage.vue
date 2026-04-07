<template>
  <el-container>
    <el-header>
      <div class="search-box">
        <el-form v-model="searchParams" :inline="true">
          <el-form-item label="名称">
            <el-input v-model="searchParams.name" placeholder="" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="queryClick">查询</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-header>
    <el-main>
      <el-table
        height="100%"
        :data="tableData"
        v-loading="loading"
        stripe
        border
        @row-click="editClick"
      >
        <el-table-column
          prop="templatePo.name"
          label="模板名称"
          width="200"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="configPo.name"
          label="通知配置"
          width="150"
          header-align="center"
          align="center"
        />
        <el-table-column
          label="模板类型"
          width="100"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            <el-tag>{{ notifyEnum(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="sysUserPo.username"
          label="创建人"
          width="100"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="sysDimensionPo.name"
          label="所属机构"
          width="180"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="templatePo.createTime"
          label="创建时间"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="templatePo.updateTime"
          label="更新时间"
          header-align="center"
          align="center"
        />
        <el-table-column>
          <template #header>
            <div class="center-flex-contain">
              <el-button-group>
                <el-button @click.native.stop="addClick"
                  ><font-awesome-icon size="1x" :icon="['fasr', 'square-plus']"
                /></el-button>
              </el-button-group>
            </div>
          </template>
          <template #default="scope">
            <div class="center-flex-contain">
              <el-button
                @click.native.stop="deleteClick(scope.row, scope.$index)"
                ><font-awesome-icon :icon="['fasr', 'trash']"
              /></el-button>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :image-size="60"></el-empty>
        </template>
      </el-table>
    </el-main>

    <el-footer>
      <div class="center-flex-contain">
        <el-pagination
          background
          layout="prev, pager, next"
          @current-change="pageChange"
          :total="pageTotal"
        >
        </el-pagination>
      </div>
    </el-footer>
  </el-container>
  <NotifyTemplateDialog
    :data="newNotifyTempate"
    :config="notifyConfigAll"
    @save="createClick"
  ></NotifyTemplateDialog>
  <NotifyTemplateDetailDialog
    ref="templateDetailDialogRef"
    @save="handleTemplateSave"
  ></NotifyTemplateDetailDialog>

  <el-dialog v-model="deleteDialg.state" title="删除">
    <span>是否删除 '{{ deleteDialg.template?.name }}' 模板</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="deleteDialg.state = false">取消</el-button>
        <el-button type="primary" @click="deleteApi">确定</el-button>
      </div>
    </template>
  </el-dialog>

</template>

<script>
import {
  defineComponent,
  reactive,
  ref,
  getCurrentInstance,
  onMounted,
  toRef,
} from "vue";
import { ElMessage } from "element-plus";
import { notifyType } from "@/model/notify/NotifyType";
import NotifyTemplateDialog from "@/components/notify/NotifyTemplateDialog.vue";
import NotifyTemplateDetailDialog from "@/components/notify/NotifyTemplateDetailDialog.vue";
import { useRouter } from "vue-router";
import { notifyPage, notifyTemplateUpdate } from "@/util/request";
export default defineComponent({
  name: "NotifyTemplatePage",
  components: { NotifyTemplateDialog, NotifyTemplateDetailDialog },
  setup() {
    const { proxy } = getCurrentInstance();
    const router = useRouter();
    const searchParams = ref({});
    const tableData = reactive([]);
    const loading = ref(true);
    const pageTotal = ref(0);
    const page = ref({ size: 10, current: 1, sorts: [{ column: "t.create_time", order: "desc" }] });
    const nType = toRef(notifyType);
    const newNotifyTempate = reactive({
      state: false,
      loading: false,
      data: { name: "", configId: undefined, msgType: 1,variables:{} },
    });
    const notifyConfigAll = reactive([]);
    const templateDetailDialogRef = ref(null);
    const deleteDialg=reactive({state:false,template:{}})
    // const templateDetailData=reactive({state:false,loading:false,name:'',content:'',id:null})
    // const selectTemplateId = ref(null);
    const pageApi = () => {
      console.log("pageApi");
      loading.value = true;
      proxy.$http.notifyTemplatePage(page.value).then((value) => {
        pageTotal.value = value.data.total;
        loading.value = false;
        tableData.length = 0;
        tableData.push(...value.data.records);
      });
    };
    const notifyAllApi = () => {
      proxy.$http.notifyPage({ size: -1 }).then(
        (value) => {
          console.log("notifyAllApi success");
          notifyConfigAll.length = 0;
          for (var item of value.data.records) {
            notifyConfigAll.push(item.configPo);
          }
          console.log("notifyAllApi success");
        },
        (error) => {
          console.log("notifyAllApi fail");
        }
      );
    };
    const createClick = (data) => {
      console.log("createClick");
      newNotifyTempate.loading = true;
      proxy.$http.notifyTemplateUpdate(data).then(
        (value) => {
          console.log("craete success");
          reload();
        },
        (error) => {
          console.log("craete fail");
          reload();
        }
      );
    };
    const deleteApi=()=>{
      proxy.$http.notifyTemplateDelete({id:deleteDialg.template.id}).then(value=>{
        ElMessage.success('操作成功');
        reload()
      },error=>{
        reload()
      })
    }
    const notifyEnum = (row) => {
      var label = "";
      for (let item of nType.value) {
        if (item.type == row.configPo.code) {
          label = item.name;
          break;
        }
      }
      console.log("notifyEnum");
      return label;
    };
    const addClick = () => {
      newNotifyTempate.state = true;
    };
    const editClick = (row) => {
      console.log("rowclick-->" + JSON.stringify(row));
      // 弹出模板详情对话框
      templateDetailDialogRef.value.handleOpen(row.templatePo.id);

      // templateDetailData.id = row.templatePo.id
      // templateDetailData.name = row.templatePo.name || ''
      // templateDetailData.content = row.templatePo.content || ''
      // templateDetailData.loading = false
      // selectTemplateId.value = row.templatePo.id;
    };
    const deleteClick = (row, index) => {
      console.log("deleteClick1111");
      deleteDialg.template=row.templatePo
      deleteDialg.state=true
    };
    const queryClick = () => {
      console.log("queryClick");
    };
    const handleSelectionChange = (selection) => {
      console.log(selection);
    };
    const pageChange = (current) => {
      page.value.current = current;
      console.log("pageChange" + current);
      pageApi();
    };

    const reload = () => {
      deleteDialg.state=false
      deleteDialg.template={}
      page.value.current = 1;
      newNotifyTempate.loading = false;
      newNotifyTempate.state = false;
      pageApi();
    };

    const handleTemplateSave = () => {
      // 保存模板成功后，重新获取表格数据
      console.log("handleTemplateSave");
      pageApi();
    };

    onMounted(() => {
      pageApi();
      notifyAllApi();
    });
    return {
      newNotifyTempate,
      notifyConfigAll,
      templateDetailDialogRef,
      // templateDetailData,
      loading,
      tableData,
      pageTotal,
      searchParams,
      deleteDialg,
      notifyEnum,
      queryClick,
      addClick,
      editClick,
      deleteClick,
      createClick,
      // updateTemplate,
      // cancelTemplateDetail,
      pageChange,
      handleSelectionChange,
      handleTemplateSave,
      deleteApi
      // selectTemplateId,
    };
  },
});
</script>

<style scoped lang="sass">
@use '@/scss/container.scss'
@use '@/views/notify/style/page.scss'
</style>
