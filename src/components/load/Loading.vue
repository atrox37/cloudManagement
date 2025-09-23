<template>
    <div v-if="load" v-loading="load" class="load-container"></div>
</template>

<script>
    import {defineComponent,toRef} from "vue";
    export default defineComponent({
        name: "Loading",
        props:{
            loading:{
                type: Boolean,
                required: false,
                default: true
            }
        },
        setup(props,context){
            const load=toRef(props,'loading')
            return {
                load
            }
        }
    })
</script>

<style scoped>
.load-container{
    width: 100%;
    height: 100%;
    background:#C0C4CC;
    padding: 0;
    margin: 0;
}
</style>