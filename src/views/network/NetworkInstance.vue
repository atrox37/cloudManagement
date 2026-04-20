<template>
    <div class="content-box">
        <el-form :model="data" label-width="100px">
            <el-row>
                <el-col span="8">
                    <el-form-item label="Activity name">
                        <el-input v-model="data.name" class="input-type"/>
                    </el-form-item>
                </el-col>
                <el-col span="8">
                    <el-form-item label="Activity name">
                        <el-input v-model="data.type" class="input-type"/>
                    </el-form-item>
                </el-col>
                <el-col span="8">
                    <el-form-item label="">
                    </el-form-item>
                </el-col>
            </el-row>

        </el-form>
    </div>
</template>

<script>
    import {useRoute, useRouter} from 'vue-router';
import {onMounted,defineComponent,computed, getCurrentInstance, reactive, ref, watch} from "vue"
export default defineComponent({
    name: "NetworkInstance",
    setup(){
        const data=ref({name:'111',type:'221'})
        const route = useRoute()

        const requestApi=()=>{
            console.log('id-->'+route.query.id)
        }
        onMounted(()=>{
            requestApi()
        })
        return {
            data
        }
    }
})
</script>

<style scoped lang="sass">
    @import '../../scss/container.scss'
    @import url('style/instance.scss')
</style>