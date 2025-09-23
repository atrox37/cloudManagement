<template>
    <el-table :data="datas" style="width: 100%">
        <el-table-column prop="username" label="用户"/>
    </el-table>
</template>

<script>
    import {defineComponent, ref, onMounted, getCurrentInstance, watch, toRef} from "vue"
    import AddUser from "@/components/organization/AddUser.vue";

    export default defineComponent({
        name: "SelectUser",
        components:{AddUser},
        emits:['setAddDraw'],
        props:{
            data: {
                type: [Object],
                required: true
            },
            drawState: {
                type: Boolean,
                required: false,
                default: false
            },
            orgs:{
                type: [Object],
                required: true,
                default: []
            }
        },
        setup(props,context) {
            //const datas=ref([{"id":1,"name":"zzzz"}])
            const draw=toRef(props,'drawState')
            const addDraw=ref(false)
            const datas = toRef(props,'data')
            const orgsRef = toRef(props,'orgs')
            const selectData=ref([])
            const addUser = []
            const delUser = []
            watch(draw,(value, oldValue) => {
                console.log('watch SelectUser data')
                if(value){
                    selectData.value.length=0
                    addUser.length=0
                    delUser.length=0
                }
            })
            watch(addDraw,(newValue, oldValue)=>{
                console.log(newValue?'open':'close')
                context.emit("setAddDraw",newValue)
            })
            watch(datas, (newValue, oldValue)=>{
                console.log('datas changes')
            })
            const deleteClick=function (data,index) {
                handlerUserData()
            }
            const deleteMutilClick=()=>{
                handlerUserData()
            }

            const handlerUserData=()=>{
                for(let selectIndex in selectData.value){
                    for(let dataIndex in datas.value){
                        if(datas.value[dataIndex].id==selectData.value[selectIndex].id){
                            datas.value.splice(dataIndex,1)
                            break
                        }
                    }
                }

                for(let index in selectData.value){
                    if(selectData.value[index].dimensionId!=null){
                        delUser.push(selectData.value[index])
                    }
                }
            }
            const addClick=function () {
                console.log("addClick")
                addDraw.value=true
            }

            const selectDelChange=(values)=>{
                selectData.value=values
            }
            const getSubmitData=()=>{
                return [addUser,delUser]
            }
            const saveClick=function () {
                for(let addIndex in addUser){
                    var flag=true
                    for(let index in datas.value){
                        console.log('saveClick-->'+JSON.stringify(datas.value[index]))
                        if(datas.value[index].id==addUser[addIndex].id){
                            flag=false
                            break
                        }
                    }
                    if(flag)datas.value.push(addUser[addIndex])
                }
                addDraw.value=false
            }
            const cancelClick=function(){
                console.log('cancelClick')
                addDraw.value=false
                addUser.length=0
            }
            const addUserChange=function(change){
                console.log('addUserChange')
                addUser.length=0
                addUser.push(...change)
            }

            return {datas,orgsRef,addDraw,delUser,selectData,selectDelChange,deleteClick,deleteMutilClick,addClick,saveClick,cancelClick,addUserChange,getSubmitData}
        }
    })
</script>

<style scoped>
    @import url('./style/selectIndex.css');
</style>
