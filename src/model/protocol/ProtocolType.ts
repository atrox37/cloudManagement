type ProtocolType={
    type: string;
    name: string;
}
const protocolType:ProtocolType[]=[
    {type:"KAFKA",name:"kafka客户端"},
    {type:"MQTT_CLIENT",name:"MQTT客户端"},
    {type:"MQTT_SERVER",name:"MQTT服务"}];

export {protocolType}