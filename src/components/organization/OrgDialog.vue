<template>
    <el-dialog v-model="dialogStatus" :title="(dataModel==null||dataModel.id==null) ? '新增':'编辑'" @close="cancelClick" width="30%">
        <el-form :model="dataModel" label-width="80px">
            <el-form-item label="组织ID" v-if="(dataModel!=null&&dataModel.id!=null)">
                <el-input v-model="dataModel.id" disabled />
            </el-form-item>
            <el-form-item label="组织名称">
                <el-input v-model="dataModel.name"/>
            </el-form-item>

        </el-form>
        <template #footer>
            <el-button @click="cancelClick">取消</el-button>
            <el-button type="primary" @click="submitClick" :loading="loadData">保存</el-button>
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
