<template>
    <div id="mapview" class="mapview"></div>
</template>

<script>
    import { defineComponent,ref,reactive,watch,onMounted } from 'vue'
    import AMapLoader from '@amap/amap-jsapi-loader';
    export default defineComponent({
        name: "TestMap",
        setup(){
            var path = [
                new AMap.LngLat(116.368904, 39.913423),
                new AMap.LngLat(116.382122, 39.901176),
                new AMap.LngLat(116.387271, 39.912501),
                new AMap.LngLat(116.398258, 39.9046),
            ];
            const getGis = ()=>{
                AMapLoader.load({
                    //注册开发者/创建应用，选择web端JS API（必须）
                    key: 'c6403a28c8ff7fd9680c38e3fa203293',//首次load必填
                    version: '2.0'
                }).then(() => {
                    var map = new AMap.Map('mapview', {
                        viewMode: '2D', //默认使用 2D 模式
                        zoom: 11, //地图级别
                        center: [116.397428, 39.90923], //地图中心点
                        // Loca 自 1.2.0 起 viewMode 模式默认为 3D，如需 2D 模式，请显示配置。
                        // viewMode: '3D'
                    });
                    AMap.plugin('AMap.ToolBar',function(){
                        var toolbar = new AMap.ToolBar(); //缩放工具条实例化
                        map.addControl(toolbar); //添加控件
                        toolbar.show();
                    });
                    const markerContent='<div class="circle"></div>'
                    const position = new AMap.LngLat(116.397428, 39.90923); //Marker 经纬度
                    const marker = new AMap.Marker({
                        position: position,
                        content: markerContent, //将 html 传给 content
                        offset: new AMap.Pixel(-13, -30), //以 icon 的 [center bottom] 为原点
                    });
                    map.add(marker)


                    var polyline = new AMap.Polyline({
                        path: path,
                        strokeWeight: 2, //线条宽度
                        strokeColor: "red", //线条颜色
                        lineJoin: "round", //折线拐点连接处样式
                    });
                    map.add(polyline);

                }).catch((e) => {
                    console.error(e);
                });
            }
            onMounted(()=>{
                getGis()
            })
            return {}
        }
    })
</script>

<style lang="scss">
    .mapview{
        width: 100%;
        height: 100%;
    }
    @keyframes expandShrink {
        0%, 100% {
            transform: scale(0.5); /* 初始大小 */
        }
        50% {
            transform: scale(1.0); /* 放大20% */
        }
    }

    .circle {
        width: 10px; /* 定义圆环的直径 */
        height: 10px; /* 定义圆环的直径 */
        background-color: transparent; /* 背景颜色设置为透明 */
        border: 5px solid #409EFF; /* 定义圆环的边框宽度及颜色 */
        border-radius: 50%; /* 将边框变为圆形 */
        box-shadow: 0 0 0 5px white inset; /* 创建内部圆的颜色和大小 */
        animation: expandShrink 2s infinite ease-in-out; /* 应用动画 */
    }


</style>