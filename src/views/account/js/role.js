import { defineComponent,ref,reactive,getCurrentInstance,toRef,onMounted} from 'vue'
import RoleDialog from '@/components/role/RoleDialog.vue';
import {roleApi,menuRoleApi,menuPermissionApi,userPermissionApi} from "@/util/request";
export default defineComponent({
    name: "Role",
    components:{RoleDialog},
    setup(props){
        let elTree = ref();

        let drawer = ref(false);
        let drawerMinWidth = ref(200);
        let drawer2 = ref(false);
        const direction = ref('rtl')
        let elTable = ref();

        let records = reactive([])
        let checkboxGroup = ref([1])
        let pageInfo = reactive({size:10,current:0,total:0})
        let treeData=reactive([])
        let permissions = reactive([])

        const roleDialogStatus=ref(false)
        const defaultProps={
            children: 'children',
            label: 'label',
        }
        const addClick=()=>{
            roleDialogStatus.value=true
        }
        const closeListener=()=>{
            console.log('closeListener')
            roleDialogStatus.value=false
        }
        const refreshListener=()=>{
            pageInfo.current=0
            closeListener()
            apiAllMenu()
        }
        const drawCloseListener=(done)=>{
            console.log("drawCloseListener1")
            let data=elTable.value.getSelectionRows()
            elTable.value.setCurrentRow()
            drawer.value=false
            console.log(`drawCloseListener2:${data}`)
        }
        const draw2OpenListener=(done)=>{
            drawer2.value=true
        }
        const draw2CloseListener=(done)=>{
            drawer2.value=false
        }
        const deleteClick=(row,index)=>{
            console.log('deleteClick')
        }
        const apiMenuAll=(params)=>{
            menuRoleApi(params).then(value => {
                if(JSON.stringify(params) == "{}"){
                    let data=[];
                    for(const item of value.data){
                        let elItem={id:item.id,label:item.name,children:[]}
                        if(item.children != null&&item.children.length>0){
                            handlerTreeData(item.children,elItem)
                        }
                        data.push(elItem)
                    }
                    treeData.length=0
                    for(const item of data){
                        treeData.push(item)
                    }
                }else{
                    elTree.value.setCheckedKeys([2]);
                    let checks=[]
                    handerCheckTree(value.data,checks)
                    elTree.value.setCheckedKeys(checks);
                    console.log("选中菜单")

                }
                console.log(treeData)
            })
        }

        const handerCheckTree=(data,checkId)=>{
            for(let dataItem of data){
                checkId.push(dataItem.id)
                if(dataItem.children!=null&&dataItem.children.length>0){
                    handerCheckTree(dataItem.children,checkId)
                }
            }
        }

        const handlerPermissionCheck=(value)=>{
            checkboxGroup.value=[]
            for(let n of value){
                checkboxGroup.value.push(n)
            }
        }

        const handlerTreeData=(data,parent)=>{
            for(let item of data){
                let elItem={id:item.id,label:item.name,children:[]}
                if(data.children!=null&&data.children.length>0){
                    handlerTreeData(data.children,elItem)
                }
                parent.children.push(elItem)
            }
        }
        const apiAllMenu=()=>{
            roleApi(pageInfo).then(value => {
                records.length=0
                pageInfo.total=value.data.total
                for(let item of value.data.records){
                    records.push(item)
                }
                console.log(pageInfo)
            })
        }
        const apiUserPermission=(params)=>{
            userPermissionApi(params).then(value => {
                checkboxGroup.value = []
                for(let item of value.data){
                    checkboxGroup.value.push(item.id)
                }
            })
        }
        const prevClick=(num)=>{
            console.log(`num=>${num}`)
            records.length=0
            pageInfo.current = num
            apiAllMenu()
        }
        const handleCurrentChange=(data)=>{
            console.log(`选中${data}`);
            apiMenuAll(data!=null?{roleId: data.id}:{})
            if(data!=null){
                apiUserPermission({roleId: data.id})
            }
            drawer.value=true;
        }
        const menuClick=(data)=>{
            requestMenuPermission(data.id)
            draw2OpenListener(null)
        }
        const requestMenuPermission=(menuId)=>{
            menuPermissionApi({menuId:menuId}).then(value=>{
                console.log(value)
                permissions.length=0
                for(const item of value.data){
                    permissions.push(item)
                }
            })
        }

        onMounted(()=>{
            apiMenuAll({})
            apiAllMenu()
        })
        return {
            elTree,
            elTable,
            drawer,
            drawerMinWidth,
            drawer2,
            direction,
            defaultProps,
            treeData,
            permissions,
            checkboxGroup,
            records,
            pageInfo,
            roleDialogStatus,
            addClick,
            closeListener,
            refreshListener,
            prevClick,
            handleCurrentChange,
            menuClick,
            handlerPermissionCheck,
            drawCloseListener,
            draw2OpenListener,
            draw2CloseListener}
    }
})
