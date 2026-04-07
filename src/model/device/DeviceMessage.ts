type MessageType={
    type: string;
    name: string;
    tag: string;
}
const messageTypes:MessageType[]=[
    {type:"online",name:"上线",tag:"primary"},
    {type:"offline",name:"下线",tag:"success"},
    {type:"report-property",name:"属性上报",tag:"info"},
    {type:"read-reply",name:"读取回应",tag:"info"},
    {type:"write-reply",name:"写入回应",tag:"info"},
    {type:"function-reply",name:"功能回应",tag:"danger"},
    {type:"board-reply",name:"总招回应",tag:"success"}];

export {messageTypes}