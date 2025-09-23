<template>
    <div class="content-header-container">
        <slot name="more"></slot>
    </div>
</template>
<script>
import {defineComponent, reactive, ref, getCurrentInstance, onMounted} from "vue"
import {useRouter} from "vue-router";

export default defineComponent({
    name: "ContentHeader",
    setup() {
        return {}
    }
})
</script>
<style lang="scss" scoped>
@import "@/components/menuContain/style/ContentHeader.scss";
</style>