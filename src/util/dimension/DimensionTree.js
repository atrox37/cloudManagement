export default function handlerDimensionTree(data,result){
    console.log(data.id+'<->'+data.name)
    result.value=data.id
    result.label=data.name
    result.children=[]
    if(data.children!=null&&data.children.length>0){
        for(let item in data.children){
            const childrenItem={}
            handlerDimensionTree(data.children[item],childrenItem)
            result.children.push(childrenItem)
        }
    }
}