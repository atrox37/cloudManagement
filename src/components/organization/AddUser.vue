<template>
    <el-table :data="datas" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="username" label="用户" />
    </el-table>
</template>

<script>
    import {defineComponent, ref, onMounted, onActivated, getCurrentInstance, toRef,watch} from "vue"

    export default defineComponent({
        name: "AddUser",
        emits:['addUserChange'],
        props:{
            drawState:{
                type: Boolean,
                required: false,
                default: false
            },
            orgs: {
                type: [Object],
                required: false,
                default: []
            }
        },
        setup(props,context) {
            const {proxy} = getCurrentInstance()
            const datas=ref([])
            const draw=toRef(props,'drawState')
            const orgsRef=toRef(props,'orgs')
            watch(draw,(value, oldValue) => {
                console.log('draw-->'+value)
                if(value){
                    requestApi()
                }
            })
            const handleSelectionChange=(changeData)=>{
                context.emit('addUserChange',changeData)
            }

            const requestApi=()=>{
                const param={"terms": [{"column": "t.org_id","termType": "isnull"},{"column": "t.org_id","type": "or","termType": "in","value": []}]}
                for(let index in orgsRef.value){
                    param.terms[1].value.push(orgsRef.value[index])
                }
                console.log('requestApi')
                proxy.$http.dimensionUser(param).then(value => {
                    console.log('requestApi')
                    datas.value.length=0
                    datas.value.push(...value.data)
                })
            }
            onMounted(()=>{
                requestApi()
            })
            onActivated(()=>{
                console.log('onActivated')
            })
            return {datas,handleSelectionChange}
        }
    })
</script>

<style scoped>

</style>
