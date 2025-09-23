<template>
    <div class="header_conatin">
        <div class="flex-box">
            <font-awesome-icon class="icon" v-if="backLabel" size="1x" :fixedWidth=true :icon="['fas', 'arrow-left']" @click="backFunction"></font-awesome-icon>
            <div class="text_contain">
                <span style="vertical-align: middle;line-height: 50px;">{{titleLabel}}</span>
            </div>
            <slot name="more"></slot>
        </div>
    </div>
</template>

<script>
import {defineComponent,toRef} from 'vue';
export default defineComponent({
    name:"MenuContainerHeader",
    props:{
        label:{
            type: String,
            required: true,
            default: ''
        },
        back:{
            type: Boolean,
            required: false,
            default: true
        }
    },
    setup(props,context){
        const titleLabel=toRef(props,'label')
        const backLabel=toRef(props,'back')

        const backFunction=function(){
            console.log('back')
            context.emit('backFunc')
        }
        console.log('title->'+titleLabel.value)
        return {titleLabel,backLabel,backFunction}
    }
})
</script>

<style scoped>
    @import "style/header.scss";
</style>
