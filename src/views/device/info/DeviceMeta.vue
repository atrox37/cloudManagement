<template>
    <el-tabs type="border-card" style="overflow: hidden;height: 100%" addable @tab-add="saveMeta" @tab-change="elTabChange">
        <template #default>
            <el-tab-pane :label="$t('deviceMeta.tabProperties')">

                <el-table :data="filterProperty" stripe >
                    <el-table-column prop="name" :label="$t('deviceMeta.name')" width="180" />
                    <el-table-column prop="valueType.type" :label="$t('deviceMeta.type')" width="180" />
                    <el-table-column :label="$t('deviceMeta.unit')" width="180">
                        <template #default="scope">
                            {{getUnitLabel(scope.row.valueType.unit)}}
                        </template>
                    </el-table-column>
                    <el-table-column :label="$t('deviceMeta.tag')" width="180">
                        <template #default="scope">
                            {{getTagName(scope.row.tagId)}}
                        </template>
                    </el-table-column>
                    <el-table-column>
                        <template #header>
                            <div class="right-flex-contain">
                                <el-button-group>
                                    <el-button @click="addPropertyClick"><font-awesome-icon :icon="['fasr', 'square-plus']" /></el-button>
                                </el-button-group>
                            </div>
                        </template>
                        <template #default="scope">
                            <div class="right-flex-contain">
                                <el-button-group>
                                    <el-button @click="editPropertyClick(scope.row,scope.$index,$event)"><font-awesome-icon :icon="['fas', 'pen-to-square']" /></el-button>
                                    <el-button @click="deletePropertyClick(scope.row,scope.$index)"><font-awesome-icon :icon="['fasr', 'trash']" /></el-button>
                                </el-button-group>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
                <el-space direction="horizontal" alignment="start" :size="5" class="property-tag-container">
                    <el-tag v-for="(item,pindex) in deviceMeta.metadata.propertyTags" :type="selectTagId.id==item.id?'primary':'info'" @click="(event)=>propertyTagClick(pindex)">
                        <template #default>
                            {{item.name}}
                        </template>
                    </el-tag>
                    <el-button size="small" @click="addPropertyTag">+ New Tag</el-button>
                </el-space>

        </el-tab-pane>
        <el-tab-pane :label="$t('deviceMeta.tabFunctions')">
            <el-table :data="deviceMeta.metadata.functions" stripe>
                <el-table-column prop="name" :label="$t('deviceMeta.name')" width="180" />
                <el-table-column prop="async" :label="$t('deviceMeta.isAsync')" width="180" />
                <el-table-column>
                    <template #header>
                        <div class="right-flex-contain">
                            <el-button-group>
                                <el-button @click="addFunctionClick"><font-awesome-icon :icon="['fasr', 'square-plus']" /></el-button>
                            </el-button-group>
                        </div>
                    </template>
                    <template #default="scope">
                        <div class="right-flex-contain">
                            <el-button-group>
                                <el-button @click="editFuncClick(scope.row,scope.$index,$event)"><font-awesome-icon :icon="['fas', 'pen-to-square']" /></el-button>
                                <el-button @click="deleteFunctionClick(scope.row,scope.$index)"><font-awesome-icon :icon="['fasr', 'trash']" /></el-button>
                            </el-button-group>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-tab-pane>
        </template>

        <template #add-icon>
            <el-icon size="20"><Finished /></el-icon>  <el-text tag="b" size="default">{{ $t('common.save') }}</el-text>
        </template>
    </el-tabs>
    <el-drawer v-if="selectTab=='0'&&selectMetaIndex>=0" v-model="property_draw" :before-close="propertyDrawClose" :size="'25%'" :title="$t('deviceMeta.propertyDrawer')">
        <template #default>
            <el-form :data="deviceMeta.metadata.properties[selectMetaIndex]" label-position="top">
                <el-form-item :label="$t('deviceMeta.propertyId')">
                    <el-input v-model="deviceMeta.metadata.properties[selectMetaIndex].id" :disabled="!(deviceMeta.metadata.properties[selectMetaIndex].create!=undefined&&deviceMeta.metadata.properties[selectMetaIndex].create)"/>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.propertyName')">
                    <el-input v-model="deviceMeta.metadata.properties[selectMetaIndex].name"/>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.dataType')">
                    <el-select v-model="deviceMeta.metadata.properties[selectMetaIndex].valueType.type" placeholder="Select" @change="propertyTypeChange">
                        <el-option
                                v-for="(item,index) in deviceUnit"
                                :key="index"
                                :label="item.name"
                                :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.decimals')" v-if="deviceMeta.metadata.properties[selectMetaIndex].valueType.type=='number'">
                    <el-input-number v-model="deviceMeta.metadata.properties[selectMetaIndex].valueType.extra.point"></el-input-number>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.enumValue')" v-if="deviceMeta.metadata.properties[selectMetaIndex].valueType.type=='enum'">
                    <el-table :data="deviceMeta.metadata.properties[selectMetaIndex].valueType.extra.enumData" border>
                        <el-table-column width="140" header-align="center" align="center">
                            <template #header="scope">
                                <el-popover
                                        placement="top-start"
                                        :width="150"
                                        trigger="hover"
                                        :content="$t('deviceMeta.numberOnly')">
                                    <template #reference>
                                        <div class="center-flex-contain">
                                            <span>{{ $t('deviceMeta.dataValue') }}</span>
                                            <el-icon size="15"><Warning /></el-icon>
                                        </div>
                                    </template>
                                </el-popover>
                            </template>
                            <template #default="scope">
                                <el-input v-model="scope.row.key" @change="(value)=>propertyEnumTypeValueChange(value,scope.$index)"></el-input>
                            </template>
                        </el-table-column>
                        <el-table-column :label="$t('deviceMeta.enumValue')" width="180" header-align="center" align="center">
                            <template #default="scope">
                                <el-input v-model="scope.row.value"></el-input>
                            </template>
                        </el-table-column>
                        <el-table-column>
                            <template #header>
                                <div class="center-flex-contain">
                                    <el-button-group>
                                        <el-button size="small" round @click="propertyEnumTypeAdd"><font-awesome-icon size="1x" :icon="['fasr', 'square-plus']" /></el-button>
                                    </el-button-group>
                                </div>

                            </template>
                            <template #default="scope">
                                <div class="center-flex-contain">
                                    <el-button-group>
                                        <el-button round size="small" @click="propertyEnumTypeDelete(scope.$index)"><font-awesome-icon size="1x" :icon="['fasr', 'trash']" /></el-button>
                                    </el-button-group>
                                </div>
                            </template>

                        </el-table-column>
                    </el-table>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.dataUnit')">
                    <el-select v-model="deviceMeta.metadata.properties[selectMetaIndex].valueType.unit" placeholder="Select">
                        <el-option
                                v-for="(item,index) in deviceType"
                                :key="index"
                                :label="`${item.en} (${item.unit})`"
                                :value="item.unit"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.readWrite')">
                  <el-segmented
                      v-model="deviceMeta.metadata.properties[selectMetaIndex].rw"
                      :options="propertyRW"
                      style="margin-bottom: 1rem"
                  />
                </el-form-item>
            </el-form>
        </template>
    </el-drawer>
    <el-drawer v-if="selectTab=='1'&&selectMetaIndex>=0" v-model="func_draw" :before-close="funcDrawClose" :size="func_args_draw?'30%':'26%'" :title="$t('deviceMeta.functionDrawer')">
        <template #default>
            <el-form :data="deviceMeta.metadata.functions[selectMetaIndex]" label-position="top">
                <el-form-item :label="$t('deviceMeta.functionId')">
                    <el-input v-model="deviceMeta.metadata.functions[selectMetaIndex].id" :disabled="!(deviceMeta.metadata.functions[selectMetaIndex].create!=undefined&&deviceMeta.metadata.functions[selectMetaIndex].create)"/>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.name')">
                    <el-input v-model="deviceMeta.metadata.functions[selectMetaIndex].name"/>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.functionParam')">
                    <el-table :data="deviceMeta.metadata.functions[selectMetaIndex].inputs" border>
                        <el-table-column prop="id" :label="$t('deviceMeta.identifier')" width="80" header-align="center" align="center"/>
                        <el-table-column prop="name" :label="$t('deviceMeta.name')" width="140" header-align="center" align="center"/>
                        <el-table-column>
                            <template #header>
                                <div class="center-flex-contain">
                                    <el-button-group>
                                        <el-button size="small" round @click="addFuncInputArgsClick"><font-awesome-icon size="1x" :icon="['fasr', 'square-plus']" /></el-button>
                                    </el-button-group>
                                </div>

                            </template>
                            <template #default="scope">
                                <div class="center-flex-contain">
                                    <el-button-group>
                                        <el-button round size="small" @click="selectFuncInputArgsClick(scope.row,scope.$index)"><font-awesome-icon size="1x" :fixedWidth=true :icon="'edit'" /></el-button>
                                        <el-button round size="small" @click="deleteFuncInputArgsClick(scope.row,scope.$index)"><font-awesome-icon size="1x" :icon="['fasr', 'trash']" /></el-button>
                                    </el-button-group>
                                </div>
                            </template>

                        </el-table-column>
                    </el-table>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.result')">
                    <el-table :data="deviceMeta.metadata.functions[selectMetaIndex].outputs" border>
                        <el-table-column prop="id" :label="$t('deviceMeta.identifier')" width="80" header-align="center" align="center"/>
                        <el-table-column prop="name" :label="$t('deviceMeta.name')" width="140" header-align="center" align="center"/>
                        <el-table-column>
                            <template #header>
                                <div class="center-flex-contain">
                                    <el-button-group>
                                        <el-button size="small" @click="addFuncOutputArgsClick" round><font-awesome-icon size="1x" :icon="['fasr', 'square-plus']" /></el-button>
                                    </el-button-group>
                                </div>
                            </template>
                            <template #default="scope">
                                <div class="center-flex-contain">
                                    <el-button-group>
                                        <el-button round size="small" @click="selectFuncOutputArgsClick(scope.row,scope.$index)"><font-awesome-icon size="1x" :fixedWidth=true :icon="'edit'" /></el-button>
                                        <el-button round size="small" @click="deleteFuncOutputArgsClick(scope.row,scope.$index)"><font-awesome-icon size="1x" :fixedWidth=true :icon="'trash'" /></el-button>
                                    </el-button-group>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-form-item>

            </el-form>
        </template>
    </el-drawer>

    <el-drawer v-if="selectMetaIndex>=0&&selectArgIndex>=0" :before-close="funcDrawArgClose" v-model="func_args_draw" :title="$t('deviceMeta.paramInfo')"  :size="'20%'" :body-style="{overflow: 'auto'}">
        <template #default>
            <el-form :model="selectFunArg" label-position="top">
                <el-form-item :label="$t('deviceMeta.paramId')">
                    <el-input v-model="selectFunArg.id"/>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.paramName')">
                    <el-input v-model="selectFunArg.name"/>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.type')">
                    <el-select v-model="selectFunArg.valueType.type" placeholder="Select" size="default" @change="funcArgTypeChange">
                        <el-option
                                v-for="(item,index) in deviceUnit"
                                :key="index"
                                :label="item.name"
                                :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="selectArgIndex>=0&&selectFunArg.valueType.type == 'enum'" :label="$t('deviceMeta.enumValue')">
                    <el-table :data="selectFunArg.valueType.extra.enumData" border>
                        <el-table-column prop="key" :label="$t('deviceMeta.paramValue')" width="80" header-align="center" align="center">
                            <template #default="scope">
                                <el-input v-model="scope.row.key"></el-input>
                            </template>
                        </el-table-column>
                        <el-table-column prop="value" :label="$t('deviceMeta.enumValue')" width="140" header-align="center" align="center">
                            <template #default="scope">
                                <el-input v-model="scope.row.value"></el-input>
                            </template>
                        </el-table-column>
                        <el-table-column>
                            <template #header>
                                <div class="center-flex-contain">
                                    <el-button-group>
                                        <el-button size="small" round @click="addSelectFuncArgsEnumClick"><font-awesome-icon size="1x" :icon="['fasr', 'square-plus']" /></el-button>
                                    </el-button-group>
                                </div>

                            </template>
                            <template #default="scope">
                                <div class="center-flex-contain">
                                    <el-button-group>
                                        <el-button round size="small" @click="delSelectFuncArgsEnumClick(scope.row,scope.$index)"><font-awesome-icon size="1x" :icon="['fasr', 'trash']" /></el-button>
                                    </el-button-group>
                                </div>
                            </template>

                        </el-table-column>
                    </el-table>
                </el-form-item>
                <el-form-item :label="$t('deviceMeta.unit')">
                    <el-select v-model="selectFunArg.valueType.unit" placeholder="Select" size="default">
                        <el-option
                                v-for="item in deviceType"
                                :key="item.unit"
                                :label="`${item.en} (${item.unit})`"
                                :value="item.unit"
                        />
                    </el-select>
                </el-form-item>
            </el-form>
        </template>
    </el-drawer>
    <el-dialog v-model="renameTag" :title="$t('deviceMeta.modifyTagTitle')" width="30%">
        <el-input v-model="renameName"></el-input>
        <template #footer>
            <el-button @click="renameTag = false" type="warning">{{ $t('common.delete') }}</el-button>
            <el-button @click="renameTag = false">{{ $t('common.cancel') }}</el-button>
            <el-button @click="()=>{deviceMeta.metadata.propertyTags[selectTagId.index].name=renameName;renameTag=false;}">{{ $t('common.confirm') }}</el-button>
        </template>
    </el-dialog>
</template>

<script>
    import {deviceTypes} from "@/model/device/DeviceUnit";
    import { toRef,ref,reactive,defineComponent,computed,onMounted,watch } from "vue";
    import { useI18n } from "vue-i18n";
    export default defineComponent({
        name: "DeviceMeta",
        props:{
          deviceUnit:{
            type: Object,
            required: true,
            default: () => ([])
          },
          deviceMeta: {
            type: Object,
            required: true
          }
        },
        emits:["updateClick"],
        setup(props,context) {
            const { t } = useI18n()
            const deviceType=ref(deviceTypes)
            const propertyRW = computed(() => [
              { label: t('deviceMeta.rwRead'),      value: 'read'      },
              { label: t('deviceMeta.rwWrite'),     value: 'write'     },
              { label: t('deviceMeta.rwReadWrite'), value: 'readwrite' },
              { label: t('deviceMeta.rwNone'),      value: 'none'      },
            ])

            const property_draw=ref(false)
            const func_draw=ref(false)
            const func_args_draw=ref(false)
            const deviceUnit=toRef(props,'deviceUnit')
            let deviceMeta=toRef(props,'deviceMeta')

            const deleteMeta=ref([])
            const selectMetaIndex=ref(-1)
            const selectArgIndex=ref(-1)
            const saveFuncArgs=ref(0)

            const selectTab=ref('0')



            const selectTagId=reactive({id:'-1',index:-1})
            const renameTag=ref(false)
            const renameName=ref('')

            const selectFunArg=computed({
                get(){
                    if(selectArgIndex.value<0){
                        return {}
                    }else{
                        return saveFuncArgs.value==0?deviceMeta.value.metadata.functions[selectMetaIndex.value].inputs[selectArgIndex.value]:deviceMeta.value.metadata.functions[selectMetaIndex.value].outputs[selectArgIndex.value]
                    }
                },
                set(value){
                    console.log("selectFunArg set")
                }
            })

            if(deviceMeta.value.metadata.propertyTags.length>0){
                selectTagId.id=deviceMeta.value.metadata.propertyTags[0].id
                selectTagId.index=0
            }


            watch(deviceMeta,(newData,oldData)=>{
                console.log('deviceMeta数据发生变化')
                initData()
            })
            const filterProperty=computed(()=>{
                var rt=[]
                for(var item of deviceMeta.value.metadata.properties){
                    if(item.tagId==selectTagId.id){
                        rt.push(item)
                    }
                }
                console.log('filterProperty')
                return rt
            })


            const initData=()=>{
                property_draw.value=false
                func_draw.value=false
                func_args_draw.value=false
                deleteMeta.value.length=0
                selectArgIndex.value=-1
                saveFuncArgs.value=-1
                if(deviceMeta.value.metadata.propertyTags.length>0){
                    selectTagId.id=deviceMeta.value.metadata.propertyTags[0].id
                    selectTagId.index=0
                }
            }

            const getTagName=(id)=>{
                var name=''
                for(var item of deviceMeta.value.metadata.propertyTags){
                    if(item.id==id){
                        name=item.name
                        break
                    }
                }
                return name
            }
            const getUnitLabel=(unit)=>{
                if(!unit) return ''
                const found = deviceType.value.find(item => item.unit.toLowerCase() === unit.toLowerCase())
                return found ? `${found.en} (${found.unit})` : unit
            }
            const propertyTagClick=(index)=>{
                if(selectTagId.id==deviceMeta.value.metadata.propertyTags[index].id){
                    renameTag.value=true
                }
                selectTagId.id=deviceMeta.value.metadata.propertyTags[index].id
                selectTagId.index=index
                console.log(selectTagId.id+'  propertyTagClick:'+index)
            }
            const createTagId=()=>{
                var id=Math.floor(Math.random()*1000+1)+'';
                return id
            }
            const addPropertyTag=()=>{
                var tagi=createTagId()
                while (true){
                    var e=false
                    for(var i of deviceMeta.value.metadata.properties){
                        if(i.tagId == tagi){
                            e=true
                            break
                        }
                    }
                    if(e){
                        tagi=createTagId()
                    }else{
                        break;
                    }

                }
                deviceMeta.value.metadata.propertyTags.push({id:tagi,name:'column'})
            }
            const addPropertyClick=function(evt){
                console.log('addPropertyCLick')
                deviceMeta.value.metadata.properties.push({id:'',name:'',create:true,tagId:selectTagId.id,rw:'none',valueType:{type:'string',extra:{length:null},unit:'data'}})
                selectMetaIndex.value=deviceMeta.value.metadata.properties.length-1
                property_draw.value=true
            }
            const addFunctionClick=function(evt){
                //{inputs:[{id:'',name:'',type:'string',unit:'count',valueType:{length:null}}],outputs:[{id:'',name:'',type:'string',unit:'count',valueType:{length:null}}]}
                deviceMeta.value.metadata.functions.push({id: "",name: "",create:true,async: true,inputs:[],outputs:[]})
                selectMetaIndex.value=deviceMeta.value.metadata.functions.length-1
                func_draw.value=true
                func_args_draw.value=false
            }
            const deletePropertyClick=function(row,index){
                getPropertyIndex(row)
                deviceMeta.value.metadata.properties.splice(selectMetaIndex.value,1)
                selectMetaIndex.value=deviceMeta.value.metadata.properties.length-1
                initData()
            }

            const batchDeleteProperty=()=>{
                console.log('batchDeleteProperty')
            }
            const deleteFunctionClick=function(row,index){
                console.log('deleteFunctionClick')
                deviceMeta.value.metadata.functions.splice(index,1)
                selectMetaIndex.value=deviceMeta.value.metadata.functions.length-1
            }
            const batchDeleteFunction=()=>{
                console.log('batchDeleteFunction')//deleteMeta
            }
            const getPropertyIndex=(row)=>{
                for(var index in deviceMeta.value.metadata.properties){
                    if(deviceMeta.value.metadata.properties[index].id == row.id){
                        selectMetaIndex.value=index
                        break;
                    }
                }
            }
            const editPropertyClick=function(row,index,target){
                console.log("click")
                getPropertyIndex(row)
                property_draw.value=true
            }
            const propertyTypeChange=function(value){
                console.log("propertyTypeChange:"+value)
                if(value=='number'){
                    delete deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.enumData
                    deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.point=1
                }else if(value=='enum'){
                    delete deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.point
                    deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra={enumData:[]}
                }else if(value=='string'){
                    delete deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.enumData
                    delete deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.point
                    deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra={length:-1}
                }
            }
            const propertyEnumTypeAdd=()=>{
                if(deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.enumData==null){
                    deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.enumData=[]
                }else{
                    deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.enumData.push({key:'',value:''})
                }
            }
            const propertyEnumTypeDelete=(index)=>{
                deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.enumData.splice(index,1)
            }
            const propertyEnumTypeValueChange=(value,index)=>{
                console.log('propertyEnumTypeValueChange:'+isAlphaNumeric(value))
                if(!isAlphaNumeric(value)){
                    deviceMeta.value.metadata.properties[selectMetaIndex.value].valueType.extra.enumData[index].key=''
                }

            }
            function isAlphaNumeric(str) {
                const regex = /^[A-Za-z0-9]+$/;
                return regex.test(str);
            }
            const propertyDrawClose=(done)=>{
                console.log('关闭侧边栏')
                property_draw.value=false
                done()
            }
            const funcDrawClose=(done)=>{
                func_draw.value=false
                func_args_draw.value=false
                done()
            }
            const funcDrawArgClose=(done)=>{
                selectArgIndex.value=-1
                func_args_draw.value=false
                done()
            }

            const updateDeviceRequest=()=>{
                console.log('updateDeviceRequest')
                //context.emit('updateClick',copyDeviceMeta.value)
            }
            const editFuncClick=function(row,index){
                selectMetaIndex.value=index
                func_draw.value=true
                func_args_draw.value=false
            }
            const funcArgTypeChange=(val)=>{
                const args = saveFuncArgs.value==0
                    ? deviceMeta.value.metadata.functions[selectMetaIndex.value].inputs
                    : deviceMeta.value.metadata.functions[selectMetaIndex.value].outputs
                const arg = args[selectArgIndex.value]
                if(val=='enum'){
                    if(!arg.valueType.extra.enumData || arg.valueType.extra.enumData.length==0){
                        arg.valueType.extra.enumData=[{key:'',value:''}]
                    }
                }
            }
            const addSelectFuncArgsEnumClick=()=>{
                const args = saveFuncArgs.value==0
                    ? deviceMeta.value.metadata.functions[selectMetaIndex.value].inputs
                    : deviceMeta.value.metadata.functions[selectMetaIndex.value].outputs
                const arg = args[selectArgIndex.value]
                if(!arg.valueType.extra.enumData){
                    arg.valueType.extra.enumData=[{key:'',value:''}]
                }else{
                    arg.valueType.extra.enumData.push({key:'',value:''})
                }
                console.log('addSelectFuncArgsEnumClick')
            }
            const delSelectFuncArgsEnumClick=(row,index)=>{
                const args = saveFuncArgs.value==0
                    ? deviceMeta.value.metadata.functions[selectMetaIndex.value].inputs
                    : deviceMeta.value.metadata.functions[selectMetaIndex.value].outputs
                args[selectArgIndex.value].valueType.extra.enumData.splice(index,1)
            }
            const selectFuncArg=(index)=>{
                selectArgIndex.value=index
                func_args_draw.value=true
            }
            const selectFuncInputArgsClick=function(row,index){
                console.log('selectFuncInputArgsClick'+JSON.stringify(row))
                saveFuncArgs.value=0
                selectFuncArg(index)
            }
            const selectFuncOutputArgsClick=function (row,index) {
                console.log('selectFuncOutputArgsClick')
                saveFuncArgs.value=1
                selectFuncArg(index)
            }
            const deleteFuncInputArgsClick=function (row,index) {
                console.log('deleteFuncInputArgsClick')
                saveFuncArgs.value=0
                deviceMeta.value.metadata.functions[selectMetaIndex.value].inputs.splice(index,1)
                selectArgIndex.value=deviceMeta.value.metadata.functions[selectMetaIndex.value].inputs.length-1
            }
            const deleteFuncOutputArgsClick=function (row,index) {
                console.log('deleteFuncOutputArgsClick')
                saveFuncArgs.value=1
                deviceMeta.value.metadata.functions[selectMetaIndex.value].outputs.splice(index,1)
                selectArgIndex.value=deviceMeta.value.metadata.functions[selectMetaIndex.value].outputs.length-1
            }

            const addFuncInputArgsClick=function(){
                console.log('addFuncInputArgsClick')
                saveFuncArgs.value=0
                deviceMeta.value.metadata.functions[selectMetaIndex.value].inputs.push({id:'',name:'',type:'string',unit:'count',valueType:{extra:{length:null}}})
                selectArgIndex.value=deviceMeta.value.metadata.functions[selectMetaIndex.value].inputs.length-1
                func_args_draw.value=true
            }
            const addFuncOutputArgsClick=function(){
                console.log('addFuncOutputArgsClick')
                saveFuncArgs.value=1
                deviceMeta.value.metadata.functions[selectMetaIndex.value].outputs.push({id:'',name:'',type:'string',unit:'count',valueType:{extra:{length:null}}})
                selectArgIndex.value=deviceMeta.value.metadata.functions[selectMetaIndex.value].outputs.length-1
                func_args_draw.value=true
            }

            const saveMeta=()=>{
                console.log('saveMeta：'+JSON.stringify(deviceMeta.value.metadata))
                context.emit('updateClick',deviceMeta.value.metadata)
            }
            const elTabChange=(tab)=>{
                console.log('elTabChange')
                selectTab.value=tab
            }
            onMounted(()=>{
                console.log('DeviceMeta--->'+JSON.stringify(deviceMeta.value.metadata.properties))
                console.log('DeviceMeta--->'+JSON.stringify(propertyRW.value))
            })
            return {
              propertyRW,
                renameTag,
                renameName,
                deleteMeta,
                deviceType,
                deviceUnit,
                selectArgIndex,
                selectMetaIndex,
                filterProperty,
                selectTagId,
                property_draw,
                func_draw,
                func_args_draw,
                selectFunArg,
                saveFuncArgs,
                selectTab,
                elTabChange,
                getTagName,
                getUnitLabel,
                addPropertyTag,
                propertyTagClick,
                addPropertyClick,
                addFunctionClick,
                batchDeleteProperty,
                deletePropertyClick,
                batchDeleteFunction,
                deleteFunctionClick,
                editPropertyClick,
                propertyTypeChange,
                propertyEnumTypeAdd,
                propertyEnumTypeDelete,
                propertyEnumTypeValueChange,
                editFuncClick,
                addFuncInputArgsClick,
                addFuncOutputArgsClick,
                selectFuncInputArgsClick,
                selectFuncOutputArgsClick,
                funcArgTypeChange,
                addSelectFuncArgsEnumClick,
                delSelectFuncArgsEnumClick,
                deleteFuncInputArgsClick,
                deleteFuncOutputArgsClick,
                propertyDrawClose,
                funcDrawClose,
                funcDrawArgClose,
                saveMeta
            }
        }

    })
</script>

<style scoped lang="scss">
    @import "@/views/device/style/DeviceMeta.scss";
    :deep(.el-drawer__body) {
        overflow-y: auto;
    }
</style>
