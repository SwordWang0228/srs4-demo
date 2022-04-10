
class SocketHandler {
    constructor(socket,delayDet,handlermap){
        this.socket = socket;
        this.socketId = socket.id;
        this.userName = null;
        this.delayDet = delayDet;
        this.handlermap = handlermap;
        this.isSync = false;
        this.SyncTimer = undefined;
    }

    init(){
        if(this.socket == null){
            console.log("init error,socket is null.")
            return;
        }
        this.socket.on('disconnect', () => {
            console.log('user disconnected', this.socketId);
            if(this.handlermap.has(this.socket.id)){
                this.handlermap.delete(this.socket.id);
            }

            this.isSync = false;

            //广播断开
            let msg = {
                id:this.socketId
              };
            this.socket.broadcast.emit('audio-break', msg);

        });
    
        this.socket.on('login', (body) => {
            this.userName = body.userName;
            console.log('user login', this.userName);
    
        })
    
        this.socket.on('audio', (msg) => {
            this.delayDet.updateTimestamp(msg.sts,msg.dts, this.getTimestamp());
            let delay = this.delayDet.getDelay();
            //console.log("远端估计时间:"+ msg.dts + ", 实际时间:"+this.getTimestamp()+",计算平均延迟:"+delay+",即时延迟:" + (this.getTimestamp()-msg.dts)/2);
            this.handlermap.forEach((value,key)=>{
                if(key == value.socketId && key != this.socketId){
                    value.sendAudioMessage(msg.data,this.socketId,delay,msg.samplerate,this.userName);
                }
                
            });
            
        });
    
        this.socket.on('SyncReqest', (msg) => {
            this.isSync = true;

            this.delayDet.updateTimestamp(msg.sts,undefined, this.getTimestamp());

            let syncRespone = {
                sts:this.getTimestamp()
            };
            this.socket.emit('SyncResponse', syncRespone);

            if(this.SyncTimer != undefined){
                clearInterval(SyncTimer);
                this.SyncTimer = setInterval(function () { this.sendSync() }, 500);
            }
    
        });
    }

    destroy(){

    }

    sendAudioMessage(data,socketId,delay,samplerate,userName){
        if(this.isSync == false){
            return;
        }
        let audioMsg = {
            sts:this.getTimestamp(),
            dts:this.delayDet.getRemoteTime(this.getTimestamp()),
            samplerate: samplerate,
            data: data,
            id:socketId,
            name:userName,
            delay:delay
          };
        this.socket.emit('audio', audioMsg);

        if(this.SyncTimer != undefined){
            clearInterval(SyncTimer);
            this.SyncTimer = setInterval(function () { this.sendSync() }, 500);
        }
    }

    sendSync(){
        let syncMsg = {
            sts:this.getTimestamp(),
          };
        this.socket.emit('sync', syncMsg);
    }

    getTimestamp() {
        return Date.now();
    }


}
module.exports = SocketHandler;