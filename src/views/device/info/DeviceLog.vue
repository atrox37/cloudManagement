<template>
    <div class="tab-pan-content">
        <el-container>
            <el-main>
                <el-table :data="tableData.records" stripe border >
                    <el-table-column prop="ts"
                                     label="时间"
                                     header-align="center"
                                     align="center"
                                     width="300"/>
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
            const page=reactive({current: 1,size:10})
            const initData=()=>{
                terms.length=0
                page.current=1
                page.size=10
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
            return {msgType,page,tableData,getMessageType,initData,pageChange,sizeChange}
        }
    })
</script>
<style scoped lang="scss">
    @import "@/views/device/style/DeviceLog.scss";
</style>

