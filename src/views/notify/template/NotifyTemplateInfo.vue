<template>
  <div v-if="!loading" style="width: 100%;height:100%;padding: 0;margin: 0px">
    <el-form v-model="templateData" class="tiny-template-header" inline>
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="templateData.templatePo.name" clearable class="tiny-template-input"></el-input>
      </el-form-item>
      <el-form-item prop="type">
        <template #label>
          <el-space wrap>
            <el-text>通知配置</el-text>
            <el-tag>{{ templateData.configPo.codeName }}</el-tag>
          </el-space>

        </template>
        <template #default>
          <el-select v-model="templateData.templatePo.notifyId" class="tiny-template-input">
            <el-option v-for="(item,index) in configs" :key="index" :label="item.name" :value="item.id">
            </el-option>
          </el-select>
        </template>

      </el-form-item>
      <el-form-item label="模板内容" prop="content">
        <el-space wrap>
          <el-input v-model="templateData.templatePo.msgContent" disabled class="tiny-template-input">
            <template #append>
              <el-button icon="Edit" @click="()=>{drawableContent=true}"/>
            </template>
          </el-input>
        </el-space>
      </el-form-item>
      <el-form-item>
        <el-button-group>
          <el-button size="small" @click="onTest">测试</el-button>
          <el-button size="small" @click="onSubmit">保存</el-button>
        </el-button-group>
      </el-form-item>
    </el-form>
    <el-container class="tiny-container">
      <el-main class="tiny-main">
        <el-table :data="page.record" border stripe >
          <!-- <el-table-column prop="templateUserPo.id" label="Id" width="50"/> -->
          <el-table-column prop="templateUserPo.name" label="名称" width="180"/>
          <el-table-column prop="templateUserPo.receiver" label="接受对象"/>
          <el-table-column prop="templateUserPo.variables" label="模板内容"/>
          <el-table-column prop="templateUserPo.updateTime" label="更新时间" width="180"/>
          <el-table-column width="80">
            <template #header>
              <div class="center-flex-contain">
                <el-button-group>
                  <el-button @click.native.stop="addClick">
                    <font-awesome-icon size="1x" :icon="['fasr', 'square-plus']"/>
                  </el-button>
                </el-button-group>
              </div>
            </template>
            <template #default="scope">
              <div class="center-flex-contain">
                <el-button @click.native.stop="deleteClick(scope.row,scope.$index)">
                  <font-awesome-icon :icon="['fasr', 'trash']"/>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-main>
      <el-footer class="tiny-footer">
        <div class="center-flex-contain">
          <el-pagination
              background
              layout="prev, pager, next"
              @current-change="pageChange"
              :total="page.total">
          </el-pagination>
        </div>
      </el-footer>
    </el-container>
  </div>
  <Loading :loading="loading"></Loading>
  <TestEmail title="邮箱模板测试" :user="accountUser" submitLabel="发送" :data="testEmail" @click="testClick"></TestEmail>
<!--  <TestEmail title="邮箱模板新增编辑" submitLabel="保存" :data="selectEmail" @click="selectClick"></TestEmail>-->
  <el-drawer v-model="drawableContent" size="25%" title="模板内容" @close="drawClose">
    <template #default>
      <NotifyEmailTemplate v-if="templateData.configPo.code == 'email'" ref="drawableEmailRef"
                           :content="templateData.templatePo.msgContent"></NotifyEmailTemplate>
    </template>
  </el-drawer>
</template>
<script>
import Loading from '@/components/load/Loading.vue';
import ContentHeader from '@/components/menuContain/ContentHeader.vue'
import {notifyType} from '@/model/notify/NotifyType'
import NotifyEmailTemplate from '@/views/notify/template/content/NotifyEmailTemplate.vue'
import TestEmail from '@/views/notify/template/test/TestEmail.vue'
import {defineComponent, reactive, ref, getCurrentInstance, onMounted, watch, toRef} from "vue"
import {useRoute, useRouter} from "vue-router";
import {ElMessage} from 'element-plus'
import { notifyTemplateUpdate, notifyTemplateUserDelete, notifyTemplateUserUpdate, sysUserPage } from "@/util/request";

export default defineComponent({
  name: "NotifyTemplateInfo",
  components: {ContentHeader, NotifyEmailTemplate, Loading, TestEmail},
  setup() {
    const {proxy} = getCurrentInstance()
    const route = useRoute()
    const router = useRouter()
    const loading = ref(true)
    const configs = reactive([])
    const titleLabel = ref('模板详情')
    let contentModel = reactive([])
    const selectConfig = reactive([])
    let templateData = ref()
    let templateContentData = ref({})

    let sendData = reactive([])
    let sendReceiver = reactive({to: ""})

    const nType = toRef(notifyType)
    const drawableEmailRef = ref()
    const drawableContent = ref(false)
    const page = reactive({total: 0, current: 0, size: 10, terms: [], record: [], sorts: [{ column: "t.update_time", order: "desc" }]})

    const testEmail = reactive({name:'',state: false, sendData: [], receiver: "", loading: false})
    const selectEmail = reactive({
      id: undefined,
      name: '',
      templateId: undefined,
      state: false,
      sendData: [],
      receiver: "",
      loading: false
    })
    const accountUser=reactive([])

    let queryData;

    const resetTestData = () => {
      testEmail.name=templateData.value.templatePo.name
      testEmail.loading = false
      testEmail.state = false
      testEmail.sendData.length = 0
      testEmail.receiver = ''
    }
    const resetSelectData = () => {
      selectEmail.id = undefined
      selectEmail.name = ''
      selectEmail.templateId = templateData.value.templatePo.id
      selectEmail.loading = false
      selectEmail.state = false
      selectEmail.sendData.length = 0
      selectEmail.receiver = ''
    }
    const userPageApi = () => {
      if (queryData != undefined && queryData.templateId != undefined) {
        var terms = [{column: 't.template_id', value: queryData.templateId}]
        page.record.length=0
        page.terms.length = 0
        page.terms.push(...terms)
        proxy.$http.notifyTemplateUserPage(page).then(value => {
          console.log('userPageApi success')
          page.record.push(...value.data.records)
          page.total = value.data.total
        }, error => {
          console.log('userPageApi error')
        })
      }
    }
    const pageChange = (current) => {
      console.log('pageChange')
      page.current = current
      userPageApi()
    }
    const supportConfigApi = () => {
      proxy.$http.notifyPage({size: -1}).then(value => {
        configs.length = 0
        for (var item of value.data.records) {
          configs.push(item.configPo)
        }
        requestContentModel()
      })
    }
    const msgContentApi = (changeData, variables = {}) => {
      changeData.sendData.length = 0
      var msgContent = ''
      for (var key in templateContentData.value) {
        if (templateContentData.value[key] != null && key != 'type') {
          msgContent = msgContent.concat('', templateContentData.value[key])
        }
      }

      proxy.$http.notifyTemplateContent({content: msgContent}).then(value => {
        for (var item of value.data) {
          changeData.sendData.push({name: item, value: (variables[item] == undefined ? '' : variables[item])})
        }
        changeData.state = true
      })
    }
    const requestInfoApi = () => {
      if (queryData != undefined && queryData.templateId != undefined) {
        const param = {terms: [{column: "t.id", value: queryData.templateId}]}
        proxy.$http.notifyTemplateInfo(param).then(value => {
          //notifyConfig.value=value.data.configPo
          //templateData.value=value.data.templatePo
          loading.value = false
          templateContentData.value = value.data.templatePo.msgContent
          templateData.value = value.data
          var label = ''
          for (let item of nType.value) {
            if (item.type == value.data.configPo.code) {
              templateData.value.configPo.codeName = item.name
              break
            }
          }

          console.log('requestInfoApi')
        })
      }
    }
    const sendTemplateApi = (params) => {
      testEmail.loading = true
      proxy.$http.notifyTemplateTest(params).then(value => {
        resetTestData()
        console.log('sendTemplateApi')
        var s = 0, f = 0
        for (var item of value.data.data) {
          if (item.result) {
            s++;
          } else {
            f++;
          }
        }
        var str = '操作成功,成功:' + s + ",失败:" + f
        ElMessage({
          message: str,
          type: 'success',
        })
      }, error => {
        resetTestData()
      })
    }
    const saveTemplateApi = () => {
      proxy.$http.notifyTemplateUpdate(templateData.value.templatePo).then(value => {
        console.log('saveTemplateApi success')
        reload()
      }, error => {
        console.log('saveTemplateApi error')
        reload()
      })
    }
    const deleteTemplateApi = (param) => {
      proxy.$http.notifyTemplateUserDelete(param).then(value => {
        console.log('deleteTemplateApi success')
        reload()
      }, error => {
        console.log('deleteTemplateApi error')
        reload()
      })
    }

    const reload=()=>{
      resetTestData()
      resetSelectData()
      page.current=1
      requestInfoApi()
      userPageApi()
    }

    const requestContentModel = () => {
      proxy.$http.notifyContentModel({code: queryData.code}).then(value => {
        console.log('notifyContentModel')
        contentModel.length = 0
        contentModel.push(...value.data)
        requestInfoApi()
      })
    }
    const handleClick = (tab, event) => {
      console.log('item click')
    }
    const onTest = () => {
      resetTestData()
      msgContentApi(testEmail)
    }
    const onSubmit = () => {
      console.log('submit:' + JSON.stringify(templateData.value.templatePo))
      saveTemplateApi()
    }

    const testClick = (testData) => {
      const param = JSON.parse(JSON.stringify(testData))
      param.notifyPo.id = templateData.value.templatePo.notifyId
      param.templatePo.msgContent = templateData.value.templatePo.msgContent
      param.templatePo.msgType = 0
      console.log('testClick->%s', JSON.stringify(param))
      sendTemplateApi(param)
    }

    const accountApi=()=>{
      proxy.$http.sysUserPage({current:1,size:-1}).then(v=>{
        accountUser.length=0;
        accountUser.push(...v.data.records)
        console.log('accountApi')
      },e=>{
        console.log('accountApi')
      })
    }

    const selectClick = (selectData) => {
      console.log('selectClick:' + JSON.stringify(selectData.receiverPo))

      proxy.$http.notifyTemplateUserUpdate(selectData.receiverPo).then(value => {
        console.log('notifyTemplateUserUpdate success')
        reload()
      }, error => {
        console.log('notifyTemplateUserUpdate fail')
        reload()
      })
    }
    const editClick = (row) => {
      console.log('editClick')
      resetSelectData()
      selectEmail.id = row.templateUserPo.id
      selectEmail.receiver = row.templateUserPo.receiver
      selectEmail.name = row.templateUserPo.name
      msgContentApi(selectEmail, row.templateUserPo.variables)
    }
    const addClick = () => {
      console.log('addclick')
      resetSelectData()
      msgContentApi(selectEmail)
    }
    const deleteClick = (row, index) => {
      console.log('deleteClick:' + row.templateUserPo.id)
      deleteTemplateApi({id: row.templateUserPo.id})
    }
    const drawClose = () => {
      templateData.value.templatePo.msgContent = drawableEmailRef.value.getContent()
      console.log('drawClose')
    }

    onMounted(() => {
      queryData = route.query
      console.log('onMounted')
      accountApi()
      supportConfigApi()
      requestInfoApi()
      userPageApi()
    })
    return {
      page,
      configs,
      drawableEmailRef,
      drawableContent,
      selectConfig,
      sendReceiver,
      testEmail,
      selectEmail,
      loading,
      titleLabel,
      contentModel,
      templateData,
      templateContentData,
      accountUser,
      testClick,
      onTest,
      selectClick,
      editClick,
      addClick,
      deleteClick,
      onSubmit,
      handleClick,
      drawClose,
      pageChange
    }
  }
})
</script>

<style scoped>
@import url('./style/templateInfo.scss');
</style>