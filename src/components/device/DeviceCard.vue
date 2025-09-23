<template>
    <div style="width: 100%;padding: 5px 5px;box-sizing: border-box;">
        <el-card shadow="hover" class="card-border">
            <div class="card-content">
                <el-row style="width: 100%">
                    <el-col :span="16" style="height:50px;display: flex;justify-content: center;flex-direction: column;">
                        <div class="text_title">{{cartItem.name}}</div>
                    </el-col>
                    <el-col :span="8" style="height:50px;display: flex;  flex-direction: row-reverse; text-align: right;align-items:center;">
                      <el-space wrap>
                        <el-tooltip
                            class="box-item"
                            effect="dark"
                            content="读取"
                            placement="top"
                        >
                          <el-button v-if="cartItem.rw=='read'||cartItem.rw=='readwrite'" icon="RefreshRight" :loading="cartItem.loadRead" circle size="small" @click="itemclick('read')"/>
                        </el-tooltip>
                        <el-tooltip
                            class="box-item"
                            effect="dark"
                            content="写入"
                            placement="top"
                        >
                          <el-button v-if="cartItem.rw=='write'||cartItem.rw=='readwrite'" icon="EditPen" :loading="cartItem.loadWrite" circle size="small" @click="itemclick('write')"/>

                        </el-tooltip>
                        <el-tooltip
                            class="box-item"
                            effect="dark"
                            content="记录"
                            placement="top"
                        >
                          <el-button icon="Histogram" circle size="small" @click="itemclick('info')"/>
                        </el-tooltip>
                      </el-space>
                    </el-col>
                </el-row>
            </div>
            <div class="text_value">
                {{formatData}}
            </div>
            <div class="right-flex-contain" style="height: 20px !important;">
                <el-text>{{formatTs}}</el-text>
            </div>
        </el-card>
    </div>

</template>

<script>
import {ref, watch, defineComponent,computed, getCurrentInstance, onMounted, toRef} from "vue";
export default defineComponent({
    name: "DeviceCard",
    props: {
        meta:{
            type:Object,
            required: true
        },
        data: {
            type: Object,
            required: false,
            default: () => ({})
        }
    },
    emits:['writeClick','readClick','itemClick'],
    setup(props,context){
      //context.emit("propertyClick",data)
        const {proxy} = getCurrentInstance()
        const cartItem = toRef(props,'meta')
        const cardData = toRef(props, 'data')
        const formatData=ref("/")
        const formatTs=ref('')
        console.log(cartItem.value)
        let xData=[],yData=[]
        let myChart = null

        function formatTimestamp(timestamp) {
            const date = new Date(timestamp); // 时间戳是秒，Date需要毫秒
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份是从0开始的
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        const changeTs=(ts)=>{
            formatTs.value=formatTimestamp(ts)
        }
        const changeData = (n,r) => {
            console.log('changeData')
            if(cartItem.value.valueType.type=='string'||cartItem.value.valueType.type=='number'){
                formatData.value=r
            }else if(cartItem.value.valueType.type=='enum'){
                for(var i of cartItem.value.valueType.extra.enumData){
                    if(i.key == r){
                        formatData.value=i.value
                        break
                    }
                }
            }

        }
        const initCardData=(v)=>{
            formatData.value=v[cartItem.value.id]?v[cartItem.value.id].rawValue:'/'
            formatTs.value=v[cartItem.value.id]?v[cartItem.value.id].ts:''
        }
        const itemclick=(type)=>{
          console.log(''+type)
          if(type=='read'){
            context.emit('readClick',cartItem.value)
          }else if(type=='write'){
            context.emit('writeClick',cartItem.value)
          }else{
            context.emit('itemClick',cartItem.value)
          }
        }
        watch(cardData,v=>{
            initCardData(v)
        })
        onMounted(()=>{
            initCardData(cardData.value)
        })
        return {
            formatTs,
            formatData,
            cartItem,
            changeTs,
            changeData,
            itemclick
        }

    }
})
</script>

<style scoped>
    .card-border{
        width: 100%;
        box-sizing: border-box;
        --el-card-padding: 13px;
    }
    .card-content{
        width: 100%;
        height: 50px
    }
    .chart{
        width: 10%;
        height: 10%;
    }
    .text_value{
        font-size: 2.5em;
        font-family: sans-serif;
    }
    .text_title{
        font-size: 1.0em;
        font-family: sans-serif;
    }
</style>
