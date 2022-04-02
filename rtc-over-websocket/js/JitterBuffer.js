
class JitterBuffer {
    constructor(processLen,inputSamplerate,playSamperate,processBufSize,sonic) {
        this.playBuffer = new Array();

        this.stashBuffer = null;
        
        this.processLen = processLen;
        this.playBufLen = 2;
        this.inputSamplerate = inputSamplerate;
        this.playSamperate = playSamperate;
        this.sonic = sonic;
        this.delay = 0;
        this.processBufSize = processBufSize;
    }

    setDelay(delay){
        this.delay = delay;
    }

    appendBuffer(fromBuffer){
        let newBuffer = null;
        if(fromBuffer instanceof Float32Array){
            if(this.stashBuffer == null) this.stashBuffer = new Float32Array(0);
            newBuffer = new Float32Array(this.stashBuffer.length+fromBuffer.length);

        }else if(fromBuffer instanceof Int16Array){
            if(this.stashBuffer == null) this.stashBuffer = new Int16Array(0);
            newBuffer = new Int16Array(this.stashBuffer.length+fromBuffer.length);
        }
        
        newBuffer.set(this.stashBuffer, 0);
        newBuffer.set(fromBuffer, this.stashBuffer.length);
        this.stashBuffer = newBuffer;

        //console.log(this.stashBuffer.length);
    }

    extractBuffer(nSamples){
        let buf = null;
        if(this.stashBuffer!= null && this.stashBuffer.length >= nSamples){
            buf = this.stashBuffer.subarray(0, nSamples);
            this.stashBuffer = this.stashBuffer.subarray(nSamples);
        }
        return buf;
    }

    appendToPlayBuffer(){
        while(this.playBuffer.length < this.playBufLen){
            let blockBuffer = this.extractBuffer(this.processBufSize);
            if(blockBuffer != null){
                this.playBuffer.push(blockBuffer);
            }else{
                break;
            }
        }
    }

    push(buf){

        this.appendBuffer(buf);
        this.appendToPlayBuffer();
        //console.log("this.stashBuffer:"+this.stashBuffer.length);
        
        
    }
    
    pop(){
        let buf = null;
        if(this.playBuffer.length > 0){
            buf = this.playBuffer.shift();
        }else{
            this.appendToPlayBuffer();
            if(this.playBuffer.length > 0){
                buf = this.playBuffer.shift();
            }
        } 
        this.appendToPlayBuffer();
        
        return buf;
    }

    flushTempBuf(){

    }

    getLength(){
        
        return this.stashBuffer==null? 0:this.stashBuffer.length;
    }

    float2Int(floatArray){
        let intArray = new Int16Array(floatArray.length);
        for(let i =0; i<floatArray.length;i++){
            let s = Math.max(-1, Math.min(1, floatArray[j]));
            if (s < 0) {
                s = s * 0x8000;
            } else {
                s = s * 0x7fff;
            }
            intArray[i] = s;
        }
        return intArray;
    }

    int2Float(intArray){
        let floatArray = new Float32Array(intArray.length);
        for (let i = 0; i < intArray.length; i++) {
            const sample = intArray[i];
            if(sample<0){
                floatArray[i] = sample / 32768; 
            }else{
                floatArray[i] = sample / 32767; 
            }
        }
        return floatArray;
    }

}