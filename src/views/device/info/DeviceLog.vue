<template>
    <div class="tab-pan-content">
        <el-container>
            <el-main>
                <el-table :data="tableData.records" stripe border >
                    <el-table-column prop="ts"
                                     label="时间"
                                     header-align="center"
                                     align="center"
                                     width="320">
                      <template #header>
                        <div class="center-flex-contain">
                          <el-date-picker
                            v-model="pickTime"
                            type="daterange"
                            range-separator="至"
                            start-placeholder="开始"
                            end-placeholder="结束"
                            size="small" />
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column prop="messageType"
                                     label="类型"
                                     width="100"
                                     align="center"
                                     header-align="center">
                        <template #default="scope">
                            <el-tag :type="getMessageType(scope.row.messageType).tag">
                                {{getMessageType(scope.row.messageType).name}}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="messageId"
                                     label="消息ID"
                                     width="200"
                                     align="center"
                                     header-align="center"/>
                    <el-table-column prop="log"
                                     label="日志"
                                     align="center"
                                     header-align="center"/>
                </el-table>
            </el-main>
            <el-footer>
                <div class="center-flex-contain">
                    <el-pagination
                            background
                            :current-page="page.current"
                            :size="page.size"
                            :page-sizes="[10, 20, 50]"
                            layout="total,sizes,prev, pager, next"
                            @current-change="pageChange"
                            @size-change="sizeChange"
                            :total="tableData.total">
                    </el-pagination>
                </div>
            </el-footer>
        </el-container>
    </div>
</template>

<script>
    import {defineComponent, toRef, ref, watch, onMounted, reactive} from "vue"
    import {messageTypes} from '@/model/device/DeviceMessage';
    import {initPickTime,formatTs} from "@/util/common/pickTime";

    export default defineComponent({
        name: "DeviceLog",
        props:{
            data: {
                type: Object,
                required: true,
                default: ()=>({records:[],pages:0,total:0})
            }
        },
        emits:['pageRequest'],
        setup(props,context){
            const msgType=ref(messageTypes)
            const tableData=toRef(props,'data')
            const terms=reactive([])
            const pickTime=ref([])
            const page=reactive({current: 1,size:10,terms:[],sorts: [{column: "ts",order: "desc"}]})
            const resetPick=()=>{
              var dates = initPickTime();
              pickTime.value[0]=dates[0]
              pickTime.value[1]=dates[1]
            }
            watch(pickTime,v=>{
              const filteredTerms = terms.filter(item => item.column !== 'ts')
              terms.length=0
              terms.push({column:'ts',termType:'gt',value:formatTs(v[0])})
              terms.push({column:'ts',termType:'lte',value:formatTs(v[1])})
              terms.push(...filteredTerms)
              context.emit('pageRequest',page,terms)
            })
            const initData=()=>{
                resetPick()
                terms.length=0
                page.current=1
                page.size=10
                terms.push({column:'ts',termType:'gt',value:formatTs(pickTime.value[0])})
                terms.push({column:'ts',termType:'lte',value:formatTs(pickTime.value[1])})
                context.emit('pageRequest',page,terms)
            }
            const getMessageType=(value)=>{
                console.log('getMessageType:'+value)
                var r={name:'',type:'',tag:''}
                for(var i of msgType.value){
                    console.log("--->"+JSON.stringify(i))
                    if(i.type == value){
                        r=i
                        break
                    }
                }
                return r
            }
            const pageChange = (current) => {
                page.current = current

                context.emit('pageRequest',page,terms)
            }
            const sizeChange = (size)=>{
                page.size=size
                page.current=1
                context.emit('pageRequest',page,terms)
            }
            return {msgType,pickTime,page,tableData,getMessageType,initData,pageChange,sizeChange}
        }
    })
</script>
<style scoped lang="scss">
    @import "@/views/device/style/DeviceLog.scss";
    :deep(.el-header){
      padding: 10px 0 0 0;
    }
    :deep(.el-date-editor.el-input__wrapper){
      width:220px
    }

</style>

