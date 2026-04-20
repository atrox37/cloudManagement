<template>
  <el-container>
    <el-main>
      <el-table ref="elTable" :data="records" border highlight-current-row @current-change="handleCurrentChange">
        <el-table-column prop="sysRolePo.roleName" :label="$t('role.roleName')" align="center" min-width="100"/>
        <el-table-column prop="sysDimensionPo.name" :label="$t('role.orgName')" align="center" min-width="100"/>
        <el-table-column prop="sysRolePo.updateTime" :label="$t('role.updateTime')" align="center" min-width="100"/>

        <el-table-column>
          <template #header>
            <div class="center-flex-contain">
              <el-button-group>
                <el-button @click.native.stop="addClick">
                  <font-awesome-icon size="1x" :icon="['fasr', 'square-plus']"/>
                </el-button>
              </el-button-group>
            </div>
          </template>
          <template #default="scope">
            <div class="center-flex-contain">
              <el-button-group>
                <el-button @click.native.stop="deleteClick(scope.row,scope.$index)">
                  <font-awesome-icon :icon="['fasr', 'trash']"/>
                </el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('common.noData')"/>
        </template>
      </el-table>

    </el-main>
    <el-footer>
      <el-pagination background layout="prev, pager, next" :total="pageInfo.total" :page-size="pageInfo.size"
                     @current-change="pageChange"/>
    </el-footer>
  </el-container>

  <RoleMenuDrawer :roleDrawer="drawer" :roleData="currentRow" @close="drawCloseListener"></RoleMenuDrawer>
  <RoleDialog :status="roleDialogStatus" @closeListener="closeListener"
              @closeRefreshListener="refreshListener"></RoleDialog>
</template>

<script>
import {defineComponent, ref, reactive, getCurrentInstance, toRef, onMounted} from 'vue'
import RoleDialog from '@/components/role/RoleDialog.vue';
import RoleMenuDrawer from "@/components/role/RoleMenuDrawer.vue";
import {ElMessage} from "element-plus";
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: "RolePage",
  components: {RoleDialog, RoleMenuDrawer},
  setup(props, context) {
    const {proxy} = getCurrentInstance()
    const { t } = useI18n()
    const roleDialogStatus = ref(false)
    let currentRow = ref({})
    let drawer = ref(false);
    let elTable = ref(null);
    let records = reactive([])
    let pageInfo = reactive({size: 10, current: 1, total: 0, sorts: [{ column: "t.update_time", order: "desc" }]})

    const pageApi = () => {
      proxy.$http.roleApi(pageInfo).then(value => {
        records.length = 0
        pageInfo.total = value.data.total
        for (let item of value.data.records) {
          records.push(item)
        }
        console.log(pageInfo)
      })
    }
    const refreshListener = () => {
      closeListener()
      resetApi()
    }
    const deleteApi = (row) => {
      proxy.$http.roleDelete({id: row.sysRolePo.id}).then(value => {
        ElMessage({
          showClose: true,
          message: t('common.modifySuccess'),
          type: 'success',
        })
        refreshListener()
      })
    }

    const addClick = () => {
      roleDialogStatus.value = true
    }
    const closeListener = () => {
      console.log('closeListener')
      roleDialogStatus.value = false
    }
    const drawCloseListener = () => {
      drawer.value = false
      console.log('close')
      pageApi()
    }
    const deleteClick = (row, index) => {
      console.log('deleteClick')
      deleteApi(row)
    }
    const pageChange = (current) => {
      pageInfo.current = current
      pageApi()
    }

    const resetApi = () => {
      pageInfo.current = 1
      pageApi()
    }
    const handleCurrentChange = (data) => {
      if(data!=null){
        currentRow.value = data
        drawer.value = true;
      }
    }

    onMounted(() => {
      pageApi()
    })
    return {
      records,
      drawer,
      elTable,
      currentRow,
      pageInfo,
      roleDialogStatus,
      drawCloseListener,
      refreshListener,
      closeListener,
      pageChange,
      addClick,
      deleteClick,
      handleCurrentChange
    }
  }
})
</script>

<style scoped>
@import url('style/index_role.scss');
</style>
