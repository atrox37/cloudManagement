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
      <el-table height="100%" :data="tableData" v-loading="loading" stripe border @row-click="editClick" :row-key="row => row.gatewayPo.id">
        <el-table-column prop="gatewayPo.name" :label="$t('gateway.name')" header-align="center" align="center" />
        <el-table-column :label="$t('gateway.networkComponent')" header-align="center" align="center">
          <template #default="scope">
            <el-space wrap>
              <el-text>{{ scope.row.networkConfigPo.name }}</el-text>
              <el-tag>{{ scope.row.networkConfigPo.type }}</el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="protocolPo.name" :label="$t('gateway.protocol')" header-align="center" align="center" />
        <el-table-column prop="sysDimensionPo.name" :label="$t('gateway.org')" header-align="center" align="center" />
        <el-table-column :label="$t('gateway.status')" header-align="center" align="center">
          <template #default="scope">
            <el-space wrap>
              <el-tag v-if="scope.row.gatewayPo.formatState" type="success" :key="`state-${scope.row.gatewayPo.id}`">{{ $t('gateway.yes') }}</el-tag>
              <el-tag v-else type="warning" :key="`state-${scope.row.gatewayPo.id}`">{{ $t('gateway.no') }}</el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="gatewayPo.updateTime" :label="$t('gateway.updateTime')" header-align="center" align="center"
                         width="200" />
        <el-table-column width="200">
          <template #header>
            <div class="center-flex-contain">
              <el-button-group>
                <el-button @click.native.stop="addClick">
                  <font-awesome-icon size="1x" :icon="['fasr', 'square-plus']" />
                </el-button>
              </el-button-group>
            </div>
          </template>
          <template #default="scope">
            <div class="center-flex-contain">
              <el-button-group>
                <el-button @click.native.stop="deleteClick(scope.row,scope.$index)">
                  <font-awesome-icon :icon="['fasr', 'trash']" />
                </el-button>
                <el-button @click.native.stop="boardClick(scope.row,scope.$index)">
                  <font-awesome-icon :icon="['fa-solid', 'fa-tower-broadcast']" />
                </el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :image-size=60></el-empty>
        </template>
      </el-table>
    </el-main>

    <el-footer>
      <div class="center-flex-contain">
        <el-pagination
          background
          layout="prev, pager, next"
          @current-change="pageChange"
          :total="page.total">
        </el-pagination>
      </div>
    </el-footer>
  </el-container>
  <DialogShare @close="shareClose" :data="shareDialog"></DialogShare>
  <GatewayAdd ref="gatewaySelectRef" :data="gatewaySelect" @save="saveApi"></GatewayAdd>
  <DialogPushBoard :row="boardSelect"></DialogPushBoard>
</template>

<script>
import { useRouter } from "vue-router";
import { onMounted, defineComponent, getCurrentInstance, reactive, ref, watch, toRef, computed } from "vue";
import handlerDimensionTree from "@/util/dimension/DimensionTree";
import { protocolType } from "@/model/protocol/ProtocolType";
import GatewayAdd from "@/views/gateway/components/GatewayAdd.vue";
import DialogShare from "@/components/gateway/DialogShare.vue";
import DialogPushBoard from "@/views/gateway/components/DialogPushBoard.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: "GatewayPage",
  components: { DialogShare, GatewayAdd, DialogPushBoard },
  setup() {
    const router = useRouter();
    const { proxy } = getCurrentInstance();
    const { t } = useI18n()
    const loading = ref(true);
    const searchParams = reactive([]);
    const page = reactive({ current: 0, size: 10, terms: [], sorts: [{ column: "t.update_time", order: "desc" }] });
    const tableData = reactive([]);

    const boardParam=reactive({current:1,size:10,terms:[],sorts:[{column: "ts",order: "desc"}]})

    const gatewaySelectRef = ref(null);
    const gatewaySelect = reactive({ title: t('gateway.edit'), status: false, loading: false, data: {} });
    const boardSelect = reactive({ status: false, loading: false, data: {} });
    const dimensionTree = ref([]);
    const dimensionAllTree = computed(() => {
      const rootTree = { value: -1, label: t('common.all'), children: [] };
      rootTree.children.push(...dimensionTree.value);
      return [rootTree];
    });

    const shareDialog = reactive({
      status: false,
      tree: {},
      gatewayOrg: []
    });

    const resetParam = () => {
      const p = toRef(protocolType);
      searchParams.length = 0;
      searchParams.push({ column: "t.name", value: "", termType: "like", label: t('gateway.nameLabel'), type: "input" });
      searchParams.push({ column: "t.org_id", value: -1, termType: "eq", label: t('gateway.orgLabel'), type: "tree" });
      searchParams.push({
        column: "t1.type",
        value: "",
        termType: "eq",
        label: t('gateway.networkTypeLabel'),
        type: "select",
        select: p.value
      });
    };
    const dimensionApi = () => {
      dimensionTree.value.length = 0;
      proxy.$http.dimensionTree().then(value => {
        shareDialog.tree = value.data;
        var tree = {};
        handlerDimensionTree(value.data, tree);
        dimensionTree.value.push(tree);
        console.log("dimensionTree");
      });
    };
    const requestApi = () => {
      loading.value = true;
      page.terms.length = 0;
      page.terms.push(...searchParams.map(item => ({ column: item.column, value: item.value, termType: item.termType, type: "and" })));
      for (var i = page.terms.length - 1; i >= 0; i--) {
        if (page.terms[i].column == "t.org_id" && page.terms[i].value < 0) {
          page.terms.splice(i, 1);
        } else if ((page.terms[i].column == "t.name" || page.terms[i].column == "t1.type") && page.terms[i].value == "") {
          page.terms.splice(i, 1);
        }
      }

      proxy.$http.gatewayPage(page).then(value => {
        page.total = value.data.total;
        loading.value = false;
        tableData.length = 0;
        tableData.push(...value.data.records);
        for (let index in tableData) {
          tableData[index].gatewayPo.formatState = (tableData[index].gatewayPo.state == 1);
        }
      });
    };
    var reloadApi = () => {
      gatewaySelect.status = false;
      gatewaySelect.loading = false;
      page.current = 1;
      requestApi();
    };
    const queryClick = () => {
      console.log("queryClick");
      requestApi();
    };
    const resetClick = () => {
      resetParam();
      reloadApi();
    };
    const addClick = function() {
      console.log("addclick");
      gatewaySelect.status = true;
      gatewaySelect.title = t('gateway.add');
      gatewaySelect.data = { gatewayPo: { state: 0 } };
      gatewaySelectRef.value.networkApi();
    };
    const editClick = (row) => {
      console.log("editClick");
      gatewaySelect.status = true;
      gatewaySelect.title = t('gateway.edit');
      gatewaySelect.data = JSON.parse(JSON.stringify(row));
      gatewaySelectRef.value.networkApi();
    };
    const deleteClick = (row) => {
      console.log("deleteClick");
      ElMessageBox.confirm(
        t('common.confirmDelete'),
        t('common.tip'),
        {
          confirmButtonText: t('common.delete'),
          cancelButtonText: t('common.cancel'),
          type: "warning"
        }
      )
        .then(() => {
          deleteApi(row.gatewayPo.id);
        })
        .catch(() => {
        });

    };
    const shareClose = () => {
      console.log("shareClose");
      shareDialog.status = false;
    };
    const boardClick = (row, index) => {
      console.log("boardClick");
      boardSelect.status = true;
      boardSelect.data = JSON.parse(JSON.stringify(row));
    };
    const pageChange = (current) => {
      page.current = current;
      requestApi();
    };
    const changeNetwork = (flag) => {
      flag.state = flag.formatState ? 1 : 0;
      console.log(JSON.stringify(flag));
      proxy.$http.saveUpdateGateway(flag).then(value => {
        console.log(JSON.stringify(value));
      });
    };
    const deleteApi = (id) => {
      gatewaySelect.loading = true;
      proxy.$http.deleteGateway({ id: id }).then(value => {
        reloadApi();
      }, e => {
        reloadApi();
      });

    };
    const saveApi = (params) => {
      gatewaySelect.loading = true;
      proxy.$http.saveUpdateGateway(params).then(value => {
        console.log("success");
        reloadApi();
      }, e => {
        reloadApi();
        console.log("fail");
      });

    };


    onMounted(() => {
      resetParam();
      dimensionApi();
      requestApi();
    });
    return {
      dimensionAllTree,
      gatewaySelectRef,
      gatewaySelect,
      boardSelect,
      shareDialog,
      loading,
      tableData,
      searchParams,
      page,
      resetClick,
      pageChange,
      addClick,
      queryClick,
      editClick,
      deleteClick,
      changeNetwork,
      shareClose,
      saveApi,
      boardClick
    };
  }
});
</script>

<style scoped lang="sass">
@use '@/scss/container.scss'
</style>
