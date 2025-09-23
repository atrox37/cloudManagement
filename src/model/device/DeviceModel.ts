type MeasValueModel={
    type: string;
    unit: string;
}
type MeasItemModel={
    id: string;
    name: string;
    valueType: MeasValueModel;
}

export {MeasItemModel,MeasValueModel}

