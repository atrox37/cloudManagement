<template>
    <el-dialog v-model="dialogStatus" title="查看" :show-close="false" @close="closeHandler" width="60%"
               style="height:80%">

        <el-tabs
                v-model="activeName"
                type="card"
                class="dialog_tab"
                addable
                @tab-click="tabChange">
            <el-tab-pane label="数据" name="dataPane">

                <el-container>

                    <el-main style="padding: 0;">
                        <el-table height="100%" :data="data.records" v-loading="loading" stripe style="width: 100%"
                                  border>
                            <el-table-column prop="ts"
                                             label="时间"
                                             header-align="center"
                                             width="300"
                                             align="center"/>
                            <el-table-column prop="rawValue"
                                             label="值"
                                             width="400"
                                             header-align="center"
                                             align="center"/>
                            <el-table-column prop="numberValue"
                                             v-if="meas.valueType.type == 'number'"
                                             label="数值"
                                             header-align="center"
                                             align="center"/>
                            <el-table-column label="枚举值"
                                             header-align="center"
                                             align="center"
                                             v-if="meas.valueType.type == 'enum'">
                                <template #default="scope">
                                    {{getEnumValue(scope.row.rawValue)}}
                                </template>
                            </el-table-column>
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
                                    :total="propertyData.total">
                            </el-pagination>
                        </div>
                    </el-footer>
                </el-container>
            </el-tab-pane>
            <el-tab-pane lazy label="图表" name="dataChart" v-if="meas.valueType.type == 'number'">
                <div ref="chartRef" class="chart_conatiner"></div>
            </el-tab-pane>

            <template #add-icon>
                <el-date-picker
                        v-model="pickTime"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始"
                        end-placeholder="结束"
                        size="small" />
            </template>
        </el-tabs>

    </el-dialog>
</template>

<script>
    import {ref, reactive, defineComponent, getCurrentInstance, onMounted, toRef, watch} from "vue";

    export default defineComponent({
        name: "DeviceProperty",
        props: {
            status: {
                type: Boolean,
                required: true,
                default: false
            },
            property:{
                type: Object,
                required: true,
                default: () => ({})
            },
            propertyData: {
                type: Object,
                required: true,
                default: () => ({records: [], total: 0, size: 10, page: 0})
            }
        },
        emits: ['close', 'propertyApi'],
        setup(props, context) {
            const {proxy} = getCurrentInstance()
            const dialogStatus = toRef(props, 'status')
            const data = toRef(props, 'propertyData')
            const meas=toRef(props,'property')
            const chartRef = ref(null)
            const page = reactive({current: 1, size: 10})
            const activeName = ref('dataPane')
            const loading = ref(false)
            const pickTime=ref([])
            const terms=[]
            var tabIndex=0
            let myChart = null
            //const xData=['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            const seriesData=[1,2,3,4,5,6,7]
            const xDataFunc=()=>{
                var r=[]
                for(var i of data.value.records){
                    r.push(i.ts)
                }
                console.log('xData')
                return r
            }
            const yDataFunc=()=>{
                var r=[]
                for(var i of data.value.records){
                    r.push(i.numberValue)
                }
                return r
            }
            const closeHandler = () => {
                context.emit("close")
            }
            const formatDate=(v)=>{
                const year = v.getFullYear();
                const month = (v.getMonth() + 1).toString().padStart(2, '0'); // 月份是从0开始的
                const day = v.getDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}T00:00:00+08:00`;
            }
            const formatDateClear=()=>{
                console.log('formatDateClear')
                terms.length=0
                pageApi()
            }
            const formatDateChange=(value)=>{
                console.log('formatDateChange')
            }
            const getEnumValue=(value)=>{
                var formatEnum='未知值'
                for(const item of meas.value.valueType.extra.enumData){
                    if(item.key == value){
                        formatEnum=item.value
                        break;
                    }
                }
                return formatEnum
            }

            watch(dialogStatus, value => {
                console.log('watch' + value)
                if (value) {
                    pickTime.value=[]
                    terms.length=0
                    page.current = 1
                    page.size = 10
                    context.emit('propertyApi', page)
                }
            })
            watch(data, value => {
                loading.value = false
                initChart()
            })
            watch(pickTime,value=>{
                terms.length=0
                if(value!=null){
                    for(var i in value){
                        terms.push({column: "ts", value: formatDate(value[i]),termType: i==0?"gt":"lt"})
                    }
                }
                console.log('pickTime')
                page.current=1
                pageApi()
            })
            const tabChange = (tab, event) => {
                console.log('tabChange:' + tab.index);
                tabIndex=tab.index
                initChart()
            }
            const pageChange = (current) => {
                page.current = current
                pageApi()
            }
            const sizeChange = (size)=>{
                page.size=size
                page.current=1
                pageApi()
            }
            const pageApi=()=>{
                loading.value = true
                context.emit('propertyApi', page,terms)
            }
            const initChart = () => {
                if (tabIndex == 1&&meas.value.valueType.type == 'number') {
                    setTimeout(()=>{
                        myChart = proxy.$echarts.init(chartRef.value)
                        var xData=xDataFunc()
                        var yData=yDataFunc()
                        var option = {
                            xAxis: {
                                type: 'category',
                                boundaryGap: false,
                                data: xData
                            },
                            yAxis: {
                                type: 'value'
                            },
                            tooltip: {
                                trigger: 'axis',
                                backgroundColor: 'rgba(50,50,50,0.7)',
                                borderColor: 'rgba(32, 33, 36,0.20)',
                                borderWidth: 1,
                                textStyle: { // 文字提示样式
                                    color: '#fff',
                                    fontSize: '12'
                                }
                            },
                            series: [
                                {
                                    data: yData,
                                    type: 'line',
                                    smooth: true,
                                    /*data: yData,*/
                                    color: '#409EFF',
                                    label: {
                                        show: false,
                                        fontSize: 16,
                                        position: 'top'
                                    },
                                    areaStyle: {
                                        color: {
                                            type: 'linear',
                                            x: 0,
                                            y: 0,
                                            x2: 0,
                                            y2: 1,
                                            colorStops: [{
                                                offset: 0, color: 'rgba(58,132,255, 0.5)' // 0% 处的颜色
                                            }, {
                                                offset: 1, color: 'rgba(58,132,255, 0)' // 100% 处的颜色
                                            }],
                                            global: false // 缺省为 false
                                        }
                                    }
                                }
                            ]
                        };
                        myChart.setOption(option)
                        myChart.resize();
                    },2)

                }

            }
            onMounted(() => {
                console.log('DeviceProperty')
                window.addEventListener('resize', function() {
                    if(myChart!=undefined)myChart.resize();
                });
            })
            return {meas,pickTime,chartRef, loading, activeName,page, data, dialogStatus, closeHandler, pageChange,sizeChange, tabChange,formatDateClear,formatDateChange,getEnumValue}
        }
    })
</script>

<style scoped lang="scss">
@use "@/components/device/style/DeviceProperty.scss";
</style>