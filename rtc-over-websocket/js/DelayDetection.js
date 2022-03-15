// Delay Detection
class DelayDetection{

    constructor(){
        this.delayArray  = new Array();
        this.minDiff = undefined;
    }
    updateTimestamp(sts,dts){
        let diff = dts - sts;
        if(this.minDiff === undefined){
            this.minDiff = diff;
        }else if(this.minDiff>diff){
            this.minDiff = diff;
        }

        let delay = (dts - this.minDiff) - sts;
 
        console.log("sts:"+sts+",dts:"+dts+",minDiff:"+this.minDiff+",delay:"+delay);

        if(this.delayArray.length >= 50){
            this.delayArray.shift();
            this.delayArray.push(delay);
        }else{
            this.delayArray.push(delay);
        }
    }
    getDelay(){
        var sum = 0;
        for(var i = 0;i<this.delayArray.length;i++){
            sum = sum + this.delayArray[i]
        }
        var avgDelay = 0;
        if(this.delayArray.length>0){
            var avgDelay = Math.floor(sum /this.delayArray.length);
        }
        
        return avgDelay ;
    }
}