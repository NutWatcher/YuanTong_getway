let fs = require('fs');
let http = require('http');
let crypto = require('crypto');
let querystring = require('querystring');
let moment = require('moment');

let db = require('../util/DB');
let UploadService = require('./upload');
let LoopService = require('../util/Loop');
class Order_Service {
    constructor() {
    }
    static add(orderList){
        return new Promise(async (resolve, reject) => {
            try {
                let res = {} , sqlTempStr, sqlStr, values;
                sqlTempStr = "select * from tb_express where id= ? ";
                values = [express_id];
                sqlStr = mysql.format(sqlTempStr, values);
                res = await db.queryDbPromise(sqlStr);
                resolve(res);
            }
            catch(e){
                console.log("report " + e.stack);
                reject(e);
            }
            finally{
            }
        });
    }
    static startOrderUpload(){
        return new Promise(async (resolve, reject) => {
            let uploadAction = false;
            try {
                let res = {} , sqlTempStr, sqlStr, values;
                sqlTempStr = "select * from config where id = 2 ;";
                values = [];
                sqlStr = mysql.format(sqlTempStr, values);
                res = await db.queryDbPromise(sqlStr);

                let orderQueue = res[0].value;
                sqlTempStr = "select * from order where id = ? ;";
                values = [orderQueue];
                sqlStr = mysql.format(sqlTempStr, values);
                res = await db.queryDbPromise(sqlStr);
                if (res.length == 0){
                    return resolve();
                }

                // need upload
                let order = res[0];
                //todo platform
                let platform = 1;
                let resChunk = await UploadService.uploadOrder([order], platform);
                let status = 400;
                if (resChunk.status != 200){
                    status = 404;
                }
                console.log(resChunk.chunks);
                let temp_chunk = JSON.parse(resChunk.chunks);
                if (temp_chunk.IsError == undefined) {
                    status = 10;
                }
                else {
                    status = temp_chunk.Code;
                }
                sqlTempStr = "UPDATE `order` SET `state`= ? WHERE `id`= ?;";
                values = [status, order.id];
                sqlStr = mysql.format(sqlTempStr, values);
                await db.queryDbPromise(sqlStr);

                let orderQueue = res[0].value;
                sqlTempStr = "UPDATE `config` SET `value`= ? WHERE `id`='2';";
                values = [ parseInt(orderQueue) + 1 ];
                sqlStr = mysql.format(sqlTempStr, values);
                await db.queryDbPromise(sqlStr);

                uploadAction = true;
                return resolve();
            }
            catch(e){
                console.log(`report ${e.stack}`);
                reject(e);
            }
            finally{
                LoopService.EndEmitter(uploadAction);
            }
        });
    }
}

module.exports = Order_Service;