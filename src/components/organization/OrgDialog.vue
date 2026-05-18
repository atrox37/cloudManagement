<template>
    <el-dialog v-model="dialogStatus" :title="(dataModel==null||dataModel.id==null) ? $t('organization.addTitle') : $t('organization.editTitle')" @close="cancelClick" width="30%">
        <el-form :model="dataModel" label-width="auto">
            <el-form-item :label="$t('organization.orgId')" v-if="(dataModel!=null&&dataModel.id!=null)">
                <el-input v-model="dataModel.id" disabled />
            </el-form-item>
            <el-form-item :label="$t('organization.orgName')">
                <el-input v-model="dataModel.name"/>
            </el-form-item>

        </el-form>
        <template #footer>
            <el-button @click="cancelClick">{{ $t('common.cancel') }}</el-button>
            <el-button type="primary" @click="submitClick" :loading="loadData">{{ $t('common.save') }}</el-button>
        </template>
    </el-dialog>
</template>

<script>
    import {defineComponent, ref, onMounted, onActivated, getCurrentInstance, toRef,watch} from "vue"
    export default defineComponent({
        name: "OrgDialog",
        props:{
          status:{
              type: Boolean,
              required: false,
              default: false
          },
          dimension:{
              type: Object,
              required: true
          },
          loading:{
              type: Boolean,
              required: true,
          }
        },
        emits:['cancelClick','submitClick'],
        setup(props,context){
            const dialogStatus=toRef(props,'status')

            const dataModel=toRef(props,'dimension')
            const loadData=toRef(props,'loading')
            const cancelClick=()=>{
                context.emit("cancelClick")
            }
            const submitClick=()=>{
                context.emit("submitClick")
            }
            return {
                loadData,dataModel,dialogStatus,cancelClick,submitClick
            }
        }
    })
</script>

<style scoped>

</style>
