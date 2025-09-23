<template>
    <el-form v-model="contentModel" label-width="100px">
        <el-form-item label="标题(title)">
          <el-input v-model="contentModel.title" />
        </el-form-item>
        <el-form-item label="内容(content)">
            <el-input v-model="contentModel.content" />
        </el-form-item>
    </el-form>

</template>

<script>
    import {defineComponent,watch,ref,getCurrentInstance,onMounted,toRef,computed} from "vue"
    export default defineComponent({
        name: "NotifyEmailTemplate",
        props:{
            content:{
                type: String,
                required: true,
                default: ""
            }
        },
        setup(props,context) {
            const {proxy} = getCurrentInstance()
            const contentStr=toRef(props,'content')
            const contentModel=ref({})
            watch(contentStr,v=>{
                contentModel.value= JSON.parse(v)
            })
            const getContent=()=>{
                return JSON.stringify(contentModel.value)
            }
            onMounted(()=>{
                contentModel.value= JSON.parse(contentStr.value)
            })
            return {contentModel,getContent}
        }
    })
</script>

<style scoped>

</style>