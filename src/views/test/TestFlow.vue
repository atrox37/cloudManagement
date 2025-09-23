<template>
    <div class="contain">
        <FlowChart></FlowChart>
    </div>
</template>

<script>
    import {defineComponent, ref} from 'vue';
    import FlowChart from '@/components/nodeRed/FlowChart.vue'
    export default defineComponent({
        name: "TestFlow",
        components: {FlowChart},
        setup(){
            return {}
        }
    })
</script>

<style scoped>
    .contain{
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
    }
</style>