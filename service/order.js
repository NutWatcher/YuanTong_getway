let mysql = require( 'mysql');
let masterDb = require('../util/MasterDB');
let db = require('../util/DB');
let UploadService = require('./upload');
class Order_Service {
    waybillNo;
    constructor() {
    }
    static add(orderList){
        return new Promise(async (resolve, reject) => {
            let Conn = null;
            try {
                let sqlTempStr, sqlStr, values;
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
                    values = [initState, tempDingDan.id, tempDingDan.dingdan_id, tempDingDan.yundan_id,
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
                if (Conn != null) {
                    await db.rollbackTransactionsPromise(Conn);
                }
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
    static setOrderUploadError(order, remark, timeStamp){}
    static startOrderUpload(){
        console.log("startOrderUpload");
        return new Promise(async (resolve, reject) => {
            let uploadAction = false;
            try {
                let res , sqlTempStr, sqlStr, values;
                sqlTempStr = "select * from config where id = 2 ;";
                values = [];
                sqlStr = mysql.format(sqlTempStr, values);
                console.log(sqlStr);
                res = await db.queryDbPromise(sqlStr);
                //console.log(res);

                let orderQueue = res[0].value;
                sqlTempStr = "SELECT * FROM `order` where id = ?;";
                values = [orderQueue];
                sqlStr = mysql.format(sqlTempStr, values);
                //console.log(sqlStr);
                res = await db.queryDbPromise(sqlStr);
                //console.log(res);
                if (res.length === 0){
                    return resolve(uploadAction);
                }

                // need upload
                console.log(sqlStr);
                let order = res[0];
                let platform = "1";
                let resChunk = await UploadService.uploadOrder([order], platform);
                let status = 400;
                if (resChunk.status !== 200){
                    status = 404;
                }
                console.log(resChunk.chunks);
                let temp_chunk = JSON.parse(resChunk.chunks);
                if (temp_chunk.data === undefined){
                    status = 910;
                }
                else if (temp_chunk.data.data === undefined){
                    status = 910 ;
                }
                else if (temp_chunk.data.data[0].error === true){
                    status = 900;
                }
                else if (temp_chunk.data.data[0].error === false){
                    status = 4;
                }

                if(status === 900){
                    if (temp_chunk.data.data[0].remark.indexOf("重复订单") === 0){
                        status = 801 ;
                    }
                    else if (temp_chunk.data.data[0].remark.indexOf("YTO exception on saving datas：圆通数据保存异常,请检查数据中是否有乱码字") === 0){
                        status = 802 ;
                    }
                    else {
                        this.setOrderUploadError(order.dingdanhao, temp_chunk.data.data[0].remark|| "", temp_chunk.data.data[0].timestamp || "");
                    }
                }


                sqlTempStr = "UPDATE `order` SET `state`= ? WHERE `id`= ?;";
                values = [status, order.id];
                sqlStr = mysql.format(sqlTempStr, values);
                await db.queryDbPromise(sqlStr);

                //更新master order 状态
                /** @namespace order.master_db_id */

                let masterOrderId = order.master_db_id;
                sqlTempStr = "SELECT * FROM tb_order_status_name where express_id = ? and status_code = ?;";
                let tempExpressId = 5 ;
                if (status === 4 || status === 404){ tempExpressId = 0; }
                values = [tempExpressId , status];
                console.log(JSON.stringify(values));
                sqlStr = mysql.format(sqlTempStr, values);
                let resStatus = await masterDb.queryDbPromise(sqlStr);
                console.log(resStatus[0]);
                let masterStatus = 3;
                if (resStatus[0]){
                    masterStatus = resStatus[0].id ? resStatus[0].id : 3;
                }
                console.log(masterStatus);
                sqlTempStr = "UPDATE `tb_slave_order_status` SET `status_id`= ? WHERE `order_id`= ?;";
                values = [masterStatus, masterOrderId];
                sqlStr = mysql.format(sqlTempStr, values);
                await masterDb.queryDbPromise(sqlStr);

                if (status === 4) {
                    if (temp_chunk.data.data[0].orderNo === order.dingdanhao) {
                        let yundanhao = temp_chunk.data.data[0].waybillNo;
                        sqlTempStr = "UPDATE `order` SET `yundanhao`= ? WHERE `id`= ?;";
                        values = [yundanhao, order.id];
                        sqlStr = mysql.format(sqlTempStr, values);
                        await db.queryDbPromise(sqlStr);

                        sqlTempStr = "UPDATE `tb_slave_order` SET `yundan_id`= ?  WHERE `id`= ? ;";
                        values = [yundanhao, masterOrderId];
                        sqlStr = mysql.format(sqlTempStr, values);
                        await masterDb.queryDbPromise(sqlStr);
                    }
                }

                //let orderQueue = res[0].value;
                sqlTempStr = "UPDATE `config` SET `value`= ? WHERE `id`='2';";
                values = [ parseInt(orderQueue) + 1 ];
                sqlStr = mysql.format(sqlTempStr, values);
                await db.queryDbPromise(sqlStr);

                uploadAction = true;
                return resolve(uploadAction);
            }
            catch(e){
                console.log(`report ${e.stack}`);
                reject(e);
            }
        });
    }
}

module.exports = Order_Service;