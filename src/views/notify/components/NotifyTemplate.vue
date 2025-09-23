<template>
    
</template>

<script>
    import {defineComponent,watch,ref,getCurrentInstance,onMounted,toRef,computed} from "vue"
    export default defineComponent({
        name: "NotifyTemplate",
        props:{
            data:{
                type: Object,
                required: true,
                default: ()=>({state:false,loading:false,total:0})
            }
        },
        setup(){
            return {}
        }
    })
</script>

<style scoped>

</style>