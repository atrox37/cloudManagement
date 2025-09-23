let map={x: 1,y: 2,z: 3}
const str1: string=`data: ${ map.x }`
console.log(str1)
let turple: [string,number]
turple= ['12',1]
turple[0] = '33'
console.log(`turple[0]=${ turple[0] }`)

let array = [1,2,3,4]
array.forEach((value, index, array1) => {
    console.log(`value: ${ value } index: ${ index }`)
})

let current=1
do {
    current++
    if(current>100){
        break
    }
    console.log(`current: ${ current }`)
}while (true)

let f = (x: number) => {
    return x*x
}
console.log(`ff:${ f(9) }`)


interface Message{
    name: string;
    number: [string];
    func: (data: string)=>boolean;
    [propName: string]: any;
}
let funcImpl = (data: string)=>{
    console.log(data)
    return true
}
let msg: Message = {name: 'ass',number: ['sss'],func: funcImpl,opacity: 0.9,method: '222222'}
const flag = msg.func('as')
console.log(flag)
console.log(msg.number[0])


interface Dao{
    color: string
    setTime(d: Date): Date;
}
class DaoImpl implements Dao{
    public a: string = '';
    private b: string = '';
    constructor(a: string,b: string) {
        this.a = a
        this.b = b
    }
    setTime(d: Date) {
        console.log('setData '+d.getFullYear())
        return d
    }

    color: string = '';
}
let dd=new DaoImpl('12','23')
dd.color = 'red'
dd.setTime(new Date())
console.log(dd.color)


class A{
    static common = {x: 0,y: 9}
    data: number = 0
    constructor(data: number) {
        this.data = data
    }
    move(num: number = 0){
        num+=this.data
        return num
    }

    addMySelf(x: number,y: number,myAdd: (x:number, y:number) => number){
        return myAdd(x,y)
    }
}
class B extends A{
    go(num: number = 0){
        num-=this.data
        return num;
    }
}
abstract class C{

}
let bean = new B(1)
let addMy = function (x: number, y: number) {
    return x+y
}
let result=bean.addMySelf(1,1,addMy)
console.log(result+'   '+bean.move(20)+'   '+bean.go(20)+'   '+A.common.y)



//fanxing
interface BaseInterface{
    changeData(num: number): number
}
class DogBaseInterface implements BaseInterface{
    changeData(num: number): number {
        return ++num
    }
}

class PigBaseInterface implements BaseInterface{
    changeData(num: number): number {
        return --num
    }
}
class Anmis{
    result<T extends BaseInterface>(num: number,bean: T){
        return bean.changeData(num)
    }
}
let dog=new DogBaseInterface()
let pig=new PigBaseInterface()
let anmis=new Anmis()
let r1=anmis.result(12,dog)
let r2=anmis.result(12,pig)
console.log(`r1:${r1} r2:${r2} beanclass:${(dog instanceof DogBaseInterface)} typeofString: ${typeof str1} typeofClass: ${typeof dog}`)

//enum
enum EventData {
    A=1,
    B=2
}
const events: EventData=EventData.A
console.log(events.valueOf() + 100)


const str2=str1.replace('data','rrrr')
const str2s=str2.split(':')
console.log(`${str2}  index: ${str2.search('1')} str2s: ${str2s[0]}`)
str2s.forEach(value => {
    console.log(`str2s: ${value}`)
})

let resultMap=new Map([["a1", "value1"],["a2", "value2"]])

export default {dog,pig,resultMap,DaoImpl}