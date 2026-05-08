interface DeviceUnit {
    label: string,
    value: string
}

interface DeviceType {
    zh: string,
    en: string,
    unit: string
}

const deviceUnits: DeviceUnit[] = [
    { label: "enum", value: "enum" },
    { label: "number", value: "number" },
    { label: "string", value: "string" }
];

const deviceTypes: DeviceType[] = [
    { zh: "百分比", en: "Percent", unit: "%" },
    { zh: "千瓦", en: "Kilowatt", unit: "kW" },
    { zh: "千瓦时", en: "Kilowatt Hour", unit: "kWh" },
    { zh: "伏特", en: "Volt", unit: "V" },
    { zh: "安培", en: "Ampere", unit: "A" },
    { zh: "摄氏度", en: "Celsius", unit: "℃" },
    { zh: "赫兹", en: "Hertz", unit: "Hz" },
    { zh: "升", en: "Liter", unit: "L" },
    { zh: "升/千瓦时", en: "Liter per kWh", unit: "L/kWh" },
    { zh: "分钟", en: "Minute", unit: "min" },
    { zh: "米", en: "Meter", unit: "m" },
    { zh: "平方米", en: "Square Meter", unit: "m²" },
    { zh: "美元", en: "Dollar", unit: "$" },
    { zh: "千乏", en: "Kilovar", unit: "kVar" },
    { zh: "千伏安", en: "Kilovolt Ampere", unit: "kVA" },
    { zh: "千焦/摄氏度", en: "kJ per Celsius", unit: "kJ/°C" },
    { zh: "瓦/摄氏度", en: "Watt per Celsius", unit: "W/°C" },
    { zh: "无单位", en: "None", unit: "" }
];

const devicePropertyRW: DeviceUnit[] = [
    { label: "可读", value: "read" },
    { label: "可写", value: "write" },
    { label: "可读写", value: "readwrite" },
    { label: "无", value: "none" }
];

export { deviceUnits, deviceTypes, devicePropertyRW }
export type { DeviceUnit, DeviceType }
