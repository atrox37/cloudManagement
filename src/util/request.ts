import {post, get, postHeader} from './http'

export const captchaApi=function (){
    return get('/api/sys-app/common/captcha64')
}
export const loginApi = function (p: any) {
    return post('/api/sys-app/login',p)
}
export const menuApi = function (){
    return post('/api/sys-app/sys_menu/menu',{});
}
export const menuRoleApi=function(p: any){
    return post('/api/sys-app/role/roleMenu',p)
}
export const roleApi = function(p: any){
    return post('/api/sys-app/role/_page',p);
}
export const rolePage = function(p: any){
    return post('/api/sys-app/role/list',p);
}
export const roleDelete = function(p:any){
    return get('/api/sys-app/role/_delete',p);
}
export const roleSave = function(p: any){
    return post('/api/sys-app/role/_save_or_update',p);
}
export const menuPermissionApi = function(p: any){
    return post('/api/sys-app/role/menuPermission',p)
}
export const userPermissionApi = function(p: any){
    return post('/api/sys-app/role/userPermission',p)
}
export const unitApi=()=>{
    return get('/api/iot-app/configuration/unit',{})
}
export const deviceSearch = function (p: any) {
    return post('/api/iot-app/device/_search_one',p)
}
export const devicePage = function (p: any) {
    return post('/api/iot-app/device/_page',p)
}
export const updateDeviceInstanceApi = function(p:any){
    return post('/api/iot-app/device/_save_or_update',p)
}
export const updateBatchDeviceInstanceApi = function(p:any){
    return post('/api/iot-app/device/_save_or_update_batch',p)
}
export const deleteDeviceInstanceApi = function (p:any){
    return get('/api/iot-app/device/_delete',p)
}
export const productParse = function (p: any) {
    return post('/api/iot-app/product/_parse',p)
}
export const productPage = function (p: any) {
    return post('/api/iot-app/product/_page',p)
}
export const productDetail = function (p: any) {
    return post('/api/iot-app/product/_search_one',p)
}
export const productUpdate = function(p:any){
    return post('/api/iot-app/product/_save_or_update',p)
}
export const productDelete = function(p:any){
    return get('/api/iot-app/product/_delete',p)
}
export const productOrgPage = function(p:any){
    return post('/api/iot-app/product_org/_page',p)
}
export const deleteProductOrgIds = function (p: any){
    return post('/api/iot-app/product_org/_deleteBatchIds',p)
}
export const saveBatchProductOrg = function (p: any){
    return post('/api/iot-app/product_org/_save_or_update_batch',p)
}
export const dimensionTree = function(){
    return post('/api/sys-app/sys-dimension/tree',{})
}
export const dimensionUser = function (p:any) {
    return post('/api/sys-app/sys_user/_search_all',p)
}
export const saveUpdateUser = function (p: any) {
    return post('/api/sys-app/sys_user/_save_or_update_batch',p)
}
export const sysUserPage = function(p:any){
    return post('/api/sys-app/sys_user/_page',p)
}
export const sysUserSaveUpdate = function(p : any){
    return post('/api/sys-app/sys_user/_save_or_update',p)
}
export const querydimension=function (p: any) {
    return post('/api/sys-app/sys-dimension/_search_one',p)
}
export const saveDimension=function(p: any){
    return post('/api/sys-app/sys-dimension/_save_or_update',p)
}
export const deleteDimension=function(p: any){
    return get('/api/sys-app/sys-dimension/_delete',p)
}
export const roleChangePermission=function (p: any) {
    return post('/api/sys-app/role_permission/batchChangePermission',p)
}
export const rolePermissionUpdate=function (p: any) {
    return post('/api/sys-app/role_permission/_save_or_update_batch',p)
}
export const roleMenuUpdate=function(p: any){
    return post('/api/sys-app/role_menu/_save_or_update_batch',p)
}
export const networkPage=function (p: any) {
    return post('/api/iot-app/network/_page',p)
}
export const saveUpdateNetwork=function (p: any) {
    return post('/api/iot-app/network/_save_or_update',p)
}
export const deleteNetwork=function (p: any) {
    return get('/api/iot-app/network/_delete',p)
}
export const gatewayPage=function (p: any) {
    return post('/api/iot-app/gateway/_page',p)
}
export const gatewayShareOrg=(p: any)=>{
    return get('/api/iot-app/gateway/org',p)
}
export const saveUpdateGateway=function (p: any) {
    return post('/api/iot-app/gateway/_save_or_update',p)
}
export const deleteGateway=function (p: any) {
    return get('/api/iot-app/gateway/_delete',p)
}
export const protocolPage=function (p: any) {
    return post('/api/iot-app/protocol/_page',p)
}
export const protocolFileUpload=function (p: any) {
    return postHeader('/api/iot-app/protocol/_upload',p,{'Content-Type':'multipart/form-data'})
}
export const saveUpdateProtocol=function (p: any) {
    return post('/api/iot-app/protocol/_save_or_update',p)
}
export const reloadProtocol=function (p: any) {
    return get('/api/iot-app/protocol/_reload',p)
}
export const deleteProtocol=function (p: any) {
    return get('/api/iot-app/protocol/_delete',p)
}
export const testProtocol=function (p: any) {
    return post('/api/iot-app/protocol/_test',p)
}
export const notifyPage=function (p: any) {
    return post('/api/notify-app/notify-config/_page',p)
}
export const notifySupport=function () {
    return get('/api/notify-app/notify-config/support',{})
}
export const notifyConfigDetail=function (p: any) {
    return post('/api/notify-app/notify-config/_search_one',p)
}
export const notifyConfigSave=function (p: any) {
    return post('/api/notify-app/notify-config/_save_vo',p)
}
export const notifyConfigSaveUpdate=function(p:any){
    return post('/api/notify-app/notify-config/_save_or_update',p)
}
export const notifyContentModel=function (p: any){
    return get('/api/notify-app/notify-config/contentModel',p)
}
export const notifyConfigUpdate=function (p: any) {
    return post('/api/notify-app/notify-config/_update',p)
}
export const notifyTemplatePage=function (p: any) {
    return post('/api/notify-app/notify-template/_page',p)
}
export const notifyTemplateInfo=function (p: any) {
    return post('/api/notify-app/notify-template/_search_one',p)
}
export const notifyTemplateContent=function(p: any){
    return post('/api/notify-app/notify-template/templateContent',p)
}
export const notifyTemplateUpdate=function(p: any){
    return post('/api/notify-app/notify-template/_save_or_update',p)
}
export const notifyTemplateUserPage=function (p: any) {
    return post('/api/notify-app/notify-template-user/_page',p)
}
export const notifyTemplateUserUpdate=function (p: any) {
    return post('/api/notify-app/notify-template-user/_save_or_update',p)
}
export const notifyTemplateUserDelete=function (p: any) {
    return get('/api/notify-app/notify-template-user/_delete',p)
}
export const notifyTemplateTest=function (p: any) {
    return post('/api/notify-app/notify-template/send_test',p)
}
export const deviceAlarmList=function (p: any) {
    return post('/api/iot-app/rule/_search_all',p)
}
export const deviceAlarmPage=function (p: any) {
    return post('/api/iot-app/rule/_page',p)
}
export const deviceAlarmParse=function (p: any) {
    return get('/api/iot-app/rule/_parse',p)
}
export const deviceRuleSave=function (p: any) {
    return post('/api/iot-app/rule/save',p)
}
export const devicePropertyData=function(p: any){
    return post('/api/register-app/timeseries/property/_page',p)
}
export const devicePropertyHistory=function (p:any) {
    return get('/api/register-app/timeseries/property/history',p)
}
export const deviceLogData=function (p: any) {
    return post('/api/register-app/timeseries/log/_page',p)
}