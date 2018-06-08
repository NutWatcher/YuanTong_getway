let App_Config = require('../config/app').app;
let Order_service = require('../service/order');
class Loop_Service {
    constructor() {
    }
    static InitEmitter(){
        Loop_Service.StartEmitter(true);
    }
    static async StartEmitter(){
        await Loop_Service.Loop();
        Loop_Service.StartEmitter();
    }
    static async Loop(){
        console.log("Loop In");
        return new Promise(async (resolve) => {
            try {
                let uploadAction = await Order_service.startOrderUpload();
                if (uploadAction === true) {
                    console.log("uploadAction : " + uploadAction);
                    return resolve();
                }
                else {
                    setTimeout(resolve, App_Config.loopTick);
                }
            }
            catch (e){
                console.log(e.stack);
                setTimeout(resolve, App_Config.loopTick);
            }
        });
    }
}
module.exports = Loop_Service;