type ElTrees={
    id: number;
    label: string;
    children: ElTrees[];
}

type Response={
    status:number;
    msg:string;
    data:any;
}
type BaseModel={
    type: string;
    name: string;
}


export {ElTrees,Response,BaseModel}

