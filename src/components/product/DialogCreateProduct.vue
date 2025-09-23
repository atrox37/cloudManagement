<template>
    <el-dialog v-model="productDialog.status" title="创建产品" width="30%">
        <el-form ref="createForm" :rules="rules" :model="productDialog.product">
            <el-form-item label="产品名称" prop="productName" >
                <el-input v-model="productDialog.product.name"></el-input>
            </el-form-item>
            <el-form-item label="产品类型">
                <el-select v-model="productDialog.product.type">
                    <el-option v-for="(item,index) in productType" :key="index" :label="item.name" :value="item.type">
                    </el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="right-flex-contain">
                <el-button type="primary" @click="submitClick" :loading="productDialog.loading">保存提交</el-button>
            </div>
        </template>
    </el-dialog>
</template>
<script>
    import {defineComponent, reactive, ref, getCurrentInstance, onMounted,toRef} from "vue"
    import {useRouter} from "vue-router";
    import {productType} from "@/model/product/ProductType";

    export default defineComponent({
        name: "DialogCreateProduct",
        props: {
            data:{
                type: Object,
                required: false,
                default: () => ({status:false,loading:false,product:{}})
            }
        },
        emits:['createClick'],
        setup(props,context) {
            const createForm=ref(null)
            const productType=reactive([
                {type:"device",name:"直连设备"},
                {type:"gateway",name:"网关设备"},
                {type:"children",name:"子设备"}])
            const productDialog=toRef(props,'data')
            const validateSelect=(rule, value, callback)=>{
                if(rule.field == 'productName'){
                    if(productDialog.value.product.name == undefined || productDialog.value.product.name==''){
                        callback(('产品名称不能为空'))
                    }else{
                        callback()
                    }
                }

            }
            const rules=ref({
                productName:[{validator:validateSelect, trigger: 'blur' }]
            })
            const submitClick=()=>{
                console.log('submitClick!')
                createForm.value.validate((valid, fields) => {
                    if (valid) {
                        context.emit('createClick')
                    } else {
                        console.log('error submit!', fields)
                    }
                })
            }
            return {rules,createForm,productType,productDialog,submitClick}
        }
    })
</script>   