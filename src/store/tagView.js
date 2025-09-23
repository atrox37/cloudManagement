import { defineStore } from "pinia"

const tagViewStore = defineStore({
    id:'tagviews',
    state: ()=> {
        return {history:[],position:-1}
    },
    actions:{
        addView(view){
            console.log('addView')
            this.resetActive(-1)
            if(this.filterView(view.path)){
                var tagViewExit=false
                for(var index in this.history){
                    if(this.history[index].path == view.path){
                        this.history[index].active=true
                        tagViewExit=true
                        break;
                    }
                }

                if(!tagViewExit){
                    this.history.push(view)
                }

            }
        },
        removeView(view){
            console.log('removeView')
            this.resetActive(-1)
            if(this.filterView(view.path)){
                for(var index in this.history){
                    if(this.history[index].path == view.path){
                        this.history.splice(index,1)
                        break
                    }
                }
            }
            if(this.history.length>0){
                this.history[this.history.length-1].active=true
            }
        },
        getCurrentView(){
            var c=-1
            for(var index in this.history){
                if(this.history[index].active){
                    c=index
                    break;
                }
            }
            return c>=0?this.history[c]:undefined
        },
        getView(){
            return this.history
        },
        cleanView(){
            this.history.length=0
        },
        resetActive(i){
            for(var index in this.history){
                this.history[index].active=(index==i)

            }
        },
        autoActive(){
            var exitActive=false
            for(var index in this.history){
                if(this.history[index].active){
                    exitActive=true
                }
            }
            if(!exitActive
                &&this.history.length>0){
                this.history[this.history.length-1].active=true
            }
            console.log('autoActive')
            return exitActive;
        },
        setPosition(p){
            this.position=p
        },
        getPosition(){
            return this.position
        },
        filterView(path){
            return path!=undefined&&!path.includes('/index')
        }
    },
    persist: true,
})

export default tagViewStore