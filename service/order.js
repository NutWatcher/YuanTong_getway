let fs = require('fs');
let http = require('http');
let crypto = require('crypto');
let querystring = require('querystring');
let moment = require('moment');

let masterDb = require('../util/MasterDB');
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

                Conn = await db.beginTransactionsPromise();
                let initState = "5";
                sqlTempStr = "INSERT INTO `order` " +
                    " (`state`, `master_db_id`, `dingdanhao`, `yundanhao`," +
                    " `seller_prov`, `seller_city`, `seller_area`, `seller_address`, `seller_name`, `seller_phone`," +
                    " `receiver_prov`, `receiver_city`, `receiver_area`, `receiver_address`, `receiver_name`, `receiver_phone`," +
                    " `product`, `weight`, `create_time`) VALUES " +
                    "( ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ?, ? , ? , ? , ? , ? , ? , ? , (select sysdate()));";
                for (let i = 0 ; i < orderList.length ; i ++ ) {
                    let tempDingDan = orderList[i];
                    //console.log(tempDingDan);
                    values = [initState, tempDingDan.dingdan_db_id, tempDingDan.dingdan_id, tempDingDan.yundan_id,
                        tempDingDan.seller_prov, tempDingDan.seller_city, tempDingDan.seller_area, tempDingDan.seller_address,
                        tempDingDan.seller_name, tempDingDan.seller_phone,
                        tempDingDan.reciever_prov, tempDingDan.reciever_city, tempDingDan.reciever_area, tempDingDan.reciever_address,
                        tempDingDan.reciever_name, tempDingDan.reciever_phone,
                        tempDingDan.goods_name, tempDingDan.weight
                    ];
                    sqlStr = mysql.format(sqlTempStr, values);
                    console.log(sqlStr);
                    await db.tranQueryDbPromise(sqlStr, Conn);
                }
                await db.commitTransactionsPromise(Conn);
                return resolve({
                    "success": true
                });
            }
            catch(e){
                console.log("report " + e.stack);
                reject(e);
            }
            finally{
            }
        });
    }
    static getState(orderList = []){
        return new Promise(async (resolve, reject) => {
            try {
                let sqlTempStr, sqlStr, values = [];
                sqlTempStr = "SELECT id, state, dingdanhao FROM `order` where dingdanhao in ? order by id desc ;";
                for (let i = 0 ; i < orderList.length ; i ++ ) {
                    values.push(orderList[i].dingdan_id);
                }
                sqlStr = mysql.format(sqlTempStr, values);
                console.log(sqlStr);
                let res = await db.queryDbPromise(sqlStr);
                return resolve(res);
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
                    status = 4;
                }
                else {
                    status = temp_chunk.Code;
                }
                sqlTempStr = "UPDATE `order` SET `state`= ? WHERE `id`= ?;";
                values = [status, order.id];
                sqlStr = mysql.format(sqlTempStr, values);
                await db.queryDbPromise(sqlStr);

                //更新master order 状态
                let masterOrderId = order.master_db_id;
                sqlTempStr = "SELECT * FROM tb_order_status_name where express_id = ? and status_code = ?;";
                let tempExpressId = 5 ;
                if (status == 10 || status == 404){ tempExpressId = 0; }
                values = [tempExpressId , status];
                sqlStr = mysql.format(sqlTempStr, values);
                let resStatus = await masterDb.queryDbPromise(sqlStr);
                let masterStatus = resStatus[0].id || 3;
                sqlTempStr = "UPDATE `tb_slave_order_status` SET `status_id`= ? WHERE `id`= ?;";
                values = [masterStatus, masterOrderId];
                sqlStr = mysql.format(sqlTempStr, values);
                await masterDb.queryDbPromise(sqlStr);

                if (temp_chunk.Data[0].OrderNo == order.dingdanhao){
                    let yundanhao = temp_chunk.Data[0].WaybillNo;

                    sqlTempStr = "UPDATE `order` SET `yundanhao`= ? WHERE `id`= ?;";
                    values = [yundanhao, order.id];
                    sqlStr = mysql.format(sqlTempStr, values);
                    await db.queryDbPromise(sqlStr);

                    sqlTempStr = "UPDATE `tb_slave_order` SET `yundan_id`= ?  WHERE `id`= ? ;";
                    values = [yundanhao, masterOrderId];
                    sqlStr = mysql.format(sqlTempStr, values);
                    await masterDb.queryDbPromise(sqlStr);

                }


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