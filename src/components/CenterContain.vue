<template>
    <div class="contain">
        <slot name="content"></slot>
    </div>
</template>

<script>
import {defineComponent} from "vue";
export default defineComponent({
    name: "CenterContain",
    setup(){
        return
    }
})
</script>

<style scoped>
.contain{
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
