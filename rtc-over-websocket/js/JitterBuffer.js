
class JitterBuffer {
    constructor(processLen,samplerate,sonic) {
        this.playbuffer = new Array();
        this.stashBuffer = new Float32Array(0);
        
        this.processLen = processLen;
        this.playBufLen = 2;
        this.samplerate = samplerate;
        this.sonic = sonic;
        this.delay = 0;
    }

    setDelay(delay){
        this.delay = delay;
    }

    appendBuffer(toBuffr,fromBuffer){
        let newBuffer = new Float32Array(toBuffr.length+fromBuffer.lenght);
        newBuffer.set(toBuffr, 0);
        newBuffer.set(fromBuffer, toBuffr.lenght);
        toBuffr = newBuffer;
    }

    push(buf){
        appendBuffer(this.stashBuffer,buf);
        
        if(this.playbuffer.length < this.playBufLen && this.stashBuffer.length >= this.processLen){
            let blockBuffer = null;
            blockBuffer = this.stashBuffer.subarray(0, this.processLen);
            let remainBuf = this.stashBuffer.subarray(this.processLen, this.stashBuffer.length);
            this.stashBuffer = remainBuf;
            this.playbuffer.push(blockBuffer);
        }

        if(this.playbuffer.length < this.playBufLen && this.stashBuffer.length >= this.processLen){
            let blockBuffer = null;
            blockBuffer = this.stashBuffer.subarray(0, this.processLen);
            let remainBuf = this.stashBuffer.subarray(this.processLen, this.stashBuffer.length);
            this.stashBuffer = remainBuf;
            this.playbuffer.push(blockBuffer);
        }

        if(this.delay > 100){
            if(this.stashBuffer.length > this.samplerate/2){//(8k,4000)
                
                this.sonic.setSpeed(2);
                this.sonic.input(this.stashBuffer);
                this.stashBuffer = this.sonic.flush();
            }  

        }else{
            if(this.stashBuffer.length > this.samplerate/5){//(8k,1600)
                this.sonic.setSpeed(2);
                this.sonic.input(this.stashBuffer);
                this.stashBuffer = this.sonic.flush();
            }  
        }

    }
    
    pop(){
        let buf = this.playBuffer.shift();

        if(this.playbuffer.length < this.playBufLen && this.stashBuffer.length >= this.processLen){
            let blockBuffer = null;
            blockBuffer = this.stashBuffer.subarray(0, this.processLen);
            let remainBuf = this.stashBuffer.subarray(this.processLen, this.stashBuffer.length);
            this.stashBuffer = remainBuf;
            this.playbuffer.push(blockBuffer);
        }

        return buf;
    }

    flushTempBuf(){

    }

    getLength(){
        this.playBuffer.length;
    }

}