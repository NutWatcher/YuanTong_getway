let App_Config = require('../config/app').app;
let Order_service = require('../service/order');
if (!global.DbQueue) {
    global.DbQueue = {};
    global.DbQueue.startnext = false;
    global.DbQueue.heartbeat = true;
    global.DbQueue.queue = [];
    global.DbQueue.QUEUE_LEN = 5;
    global.DbQueue.firstQueue = []; //优先级最高
}
class LoopService {
    constructor() {
    }
    static PushEmitter(eventEmitter) {
        if (global.DbQueue.queue.length >= global.DbQueue.QUEUE_LEN){
            return eventEmitter.emit("error","后台忙!");
        }
        global.DbQueue.queue.push(eventEmitter) ;
        console.log("队列中有: " + global.DbQueue.queue.length + "个任务");
        if (global.DbQueue.queue.length == 1) {
            QueueService.StartEmitter();
        }
    }
    static EndEmitter(){
        LoopService.StartEmitter();
    }
    static StartEmitter(uploadAction){
        if (uploadAction == true){
            Order_service.startOrderUpload();
        }
        else {
            setTimeout(Order_service.startOrderUpload, App_Config.loopTick);
        }
    }
    static CheckHeartbeat(){
        //console.log("CheckHeartbeat getHeartbeat：" + QueueService.getHeartbeat(this));
        if (global.DbQueue.startnext == true){
            global.DbQueue.startnext = false ;
            return  QueueService.StartEmitter();
        }
        else if (QueueService.getHeartbeat() == false) {
            console.log("心跳丢失");
            QueueService.EndEmitter();
        }
        else if (global.DbQueue.queue.length > 0 && QueueService.getHeartbeat() == true) {
            global.DbQueue.queue[0].emit("heartbeat");
            QueueService.setHeartbeat(false) ;
        }

    }
    static setHeartbeat(){
        global.DbQueue.heartbeat == true ;
    }
    static getHeartbeat(){
        return global.DbQueue.heartbeat;
    }

    static ReceiveHeartbeat(){
        LoopService.setHeartbeat(true) ;
        //console.log("接收心跳 heartbeat：" + QueueService.getHeartbeat());
    }
}
module.exports = LoopService;