interface DeviceUnit{
    label:string,
    value:string
}

const deviceUnits:DeviceUnit[]=[{label:"enum",value:"enum"}, {label:"number",value:"number"},{label:"string",value:"string"}];
const deviceTypes:DeviceUnit[]=[{label:"百分比",value:"percent"}];
const devicePropertyRW:DeviceUnit[]=[{label:"可读",value:"read"},{label:"可写",value:"write"},{label:"可读写",value:"readwrite"},{label:"无",value:"none"}]

export {deviceUnits,deviceTypes,devicePropertyRW}