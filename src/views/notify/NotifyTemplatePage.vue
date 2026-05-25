<template>
  <el-container>
    <el-header>
      <div class="search-box">
        <el-form v-model="searchParams" :inline="true">
          <el-form-item v-for="(item,index) in searchParams" :label="item.label" :key="index">
            <el-input v-if="item.type == 'input'" v-model="item.value" placeholder="" clearable />
            <el-tree-select
              style="width: 220px;"
              v-if="item.type == 'tree'"
              v-model="item.value"
              :data="dimensionAllTree"
              check-strictly
              :render-after-expand="false">
              <template #empty>
                <el-empty :description="$t('common.noData')" />
              </template>
            </el-tree-select>
            <el-select v-if="item.type == 'select'" v-model="item.value" style="width:200px">
              <el-option v-for="(item,index) in item.select" :key="index" :label="item.name"
                         :value="item.type"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="queryClick">{{ $t('common.search') }}</el-button>
            <el-button type="info" @click="resetClick">{{ $t('common.reset') }}</el-button>
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
          :label="$t('notify.templateName')"
          width="200"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="configPo.name"
          :label="$t('notify.notifyConfig')"
          width="150"
          header-align="center"
          align="center"
        />
        <el-table-column
          :label="$t('notify.templateType')"
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
          :label="$t('notify.creator')"
          width="100"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="sysDimensionPo.name"
          :label="$t('notify.org')"
          width="180"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="templatePo.createTime"
          :label="$t('notify.createTime')"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="templatePo.updateTime"
          :label="$t('notify.updateTime')"
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

  <el-dialog v-model="deleteDialg.state" :title="$t('notify.deleteTitle')">
    <span>{{ $t('notify.deleteConfirmMsg', { name: deleteDialg.template?.name }) }}</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="deleteDialg.state = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="deleteApi">{{ $t('common.confirm') }}</el-button>
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
import { useI18n } from 'vue-i18n'
export default defineComponent({
  name: "NotifyTemplatePage",
  components: { NotifyTemplateDialog, NotifyTemplateDetailDialog },
  setup() {
    const { proxy } = getCurrentInstance();
    const router = useRouter();
    const { t } = useI18n()
    const searchParams = reactive([]);
    const tableData = reactive([]);
    const loading = ref(true);
    const pageTotal = ref(0);
    const page = reactive({ size: 10, current: 1,terms:[], sorts: [{ column: "t.create_time", order: "desc" }] });
    const nType = toRef(notifyType);
    const newNotifyTempate = reactive({
      state: false,
      loading: false,
      data: { name: "", configId: undefined, msgType: 1,variables:{} },
    });
    const notifyConfigAll = reactive([]);
    const templateDetailDialogRef = ref(null);
    const deleteDialg=reactive({state:false,template:{}})
    const resetParam = () => {
      searchParams.length = 0;
      searchParams.push({ column: "t.name", value: "", termType: "like", label: t('notify.nameLabel'), type: "input" });
      console.log("resetParam");
    };

    const pageApi = () => {
      console.log("pageApi");
      loading.value = true;
      page.terms.length = 0;
      page.terms.push(...searchParams.map(item => ({ column: item.column, value: item.value, termType: item.termType, type: "and" })))
      proxy.$http.notifyTemplatePage(page).then((value) => {
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
        ElMessage.success(t('common.operationSuccess'));
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
      newNotifyTempate.data = { name: "", configId: undefined, msgType: 1,variables:{} };
      newNotifyTempate.state = true;
    };
    const editClick = (row) => {
      console.log("rowclick-->" + JSON.stringify(row));
      templateDetailDialogRef.value.handleOpen(row.templatePo.id);
    };
    const deleteClick = (row, index) => {
      console.log("deleteClick1111");
      deleteDialg.template=row.templatePo
      deleteDialg.state=true
    };
    const queryClick = () => {
      page.current = 1;
      pageApi();
    };
    const resetClick=()=>{
      console.log("resetClick");
      resetParam()
      page.current = 1;
      pageApi()
    }
    const handleSelectionChange = (selection) => {
      console.log(selection);
    };
    const pageChange = (current) => {
      page.current = current;
      console.log("pageChange" + current);
      pageApi();
    };

    const reload = () => {
      deleteDialg.state=false
      deleteDialg.template={}
      page.current = 1;
      newNotifyTempate.loading = false;
      newNotifyTempate.state = false;
      pageApi();
    };

    const handleTemplateSave = () => {
      console.log("handleTemplateSave");
      pageApi();
    };

    onMounted(() => {
      resetParam();
      pageApi();
      notifyAllApi();
    });
    return {
      newNotifyTempate,
      notifyConfigAll,
      templateDetailDialogRef,
      loading,
      tableData,
      pageTotal,
      searchParams,
      deleteDialg,
      notifyEnum,
      queryClick,
      resetClick,
      addClick,
      editClick,
      deleteClick,
      createClick,
      pageChange,
      handleSelectionChange,
      handleTemplateSave,
      deleteApi
    };
  },
});
</script>

<style scoped lang="sass">
@use '@/scss/container.scss'
@use '@/views/notify/style/page.scss'
</style>
