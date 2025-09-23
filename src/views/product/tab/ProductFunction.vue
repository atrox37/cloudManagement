<template>
    <div>ProductFunction</div>
</template>

<script>
    import {defineComponent, ref, onMounted, getCurrentInstance, toRef} from "vue"

    export default defineComponent({
        name: "ProductFunction",
        props: {
            productData: {
                type: Object,
                required: false
            }
        },
        setup(props,context){
            const data = toRef(props,'productData')
            return {}
        }
    })
</script>

<style scoped>

</style>