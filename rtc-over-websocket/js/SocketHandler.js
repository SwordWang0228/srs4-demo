
class SocketHandler {
    constructor(socket,delayDet,handlermap){
        this.socket = socket;
        this.socketId = socket.id;
        this.userName = null;
        this.delayDet = delayDet;
        this.handlermap = handlermap;
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

            //console.log(this.handlermap.size);
            this.handlermap.forEach((value,key)=>{
                if(key == value.socketId && key != this.socketId){
                    value.sendAudioMessage(msg.data,this.socketId);
                }
                
            });
            
        });
    
        this.socket.on('SyncReqest', (msg) => {

            this.delayDet.updateTimestamp(msg.sts,undefined, this.getTimestamp());

            let syncRespone = {
                sts:this.getTimestamp()
            };
            this.socket.emit('SyncResponse', syncRespone);
    
        });
    }

    destroy(){

    }

    sendAudioMessage(data,socketId){

        let audioMsg = {
            sts:this.getTimestamp(),
            dts:this.delayDet.getRemoteTime(this.getTimestamp()),
            sn: 1,
            data: data,
            id:socketId
          };
        this.socket.emit('audio', audioMsg);
    }

    getTimestamp() {
        return Date.now();
    }


}
module.exports = SocketHandler;