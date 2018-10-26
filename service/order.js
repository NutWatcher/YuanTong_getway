let mysql = require('mysql');
let masterDb = require('../util/MasterDB');
let db = require('../util/DB');
let UploadService = require('./upload');
class Order_Service {
    waybillNo;
    constructor() {}
    static add(orderList, express = '圆通快递') {
        return new Promise(async(resolve, reject) => {
            let Conn = null;
            try {
                let sqlTempStr, sqlStr, values;
                Conn = await db.beginTransactionsPromise();
                let initState = "5";
                sqlTempStr = "INSERT INTO `order` " +
                    " (`state`, `type`, `master_db_id`, `dingdanhao`, `yundanhao`," +
                    " `seller_prov`, `seller_city`, `seller_area`, `seller_address`, `seller_name`, `seller_phone`," +
                    " `receiver_prov`, `receiver_city`, `receiver_area`, `receiver_address`, `receiver_name`, `receiver_phone`," +
                    " `product`, `weight`, `create_time`) VALUES " +
                    "( ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ?, ? , ? , ? , ? , ? , ? , ? , (select sysdate()));";
                for (let i = 0; i < orderList.length; i++) {
                    let tempDingDan = orderList[i];
                    //console.log(tempDingDan);
                    values = [initState, express, tempDingDan.id, tempDingDan.dingdan_id, tempDingDan.yundan_id,
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
            } catch (e) {
                if (Conn != null) {
                    await db.rollbackTransactionsPromise(Conn);
                }
                console.log("report " + e.stack);
                reject(e);
            } finally {}
        });
    }
    static getState(orderList = []) {
        return new Promise(async(resolve, reject) => {
            try {
                let sqlTempStr, sqlStr, values = [];
                sqlTempStr = "SELECT id, state, dingdanhao FROM `order` where dingdanhao in ? order by id desc ;";
                for (let i = 0; i < orderList.length; i++) {
                    values.push(orderList[i].dingdan_id);
                }
                sqlStr = mysql.format(sqlTempStr, values);
                console.log(sqlStr);
                let res = await db.queryDbPromise(sqlStr);
                return resolve(res);
            } catch (e) {
                console.log("report " + e.stack);
                reject(e);
            } finally {}
        });
    }
    static setOrderUploadError(order, remark, timeStamp) {}
    static parseXML(param= ""){
        try {
            console.log(param);
            let yundanhao = "未分配", dingdanhao = "***";
            let shortAddress = "111-111-111-111", consigneeBranchCode = "111111", packageCenterCode = "111111";
            let codeReg = /<code>.*<\/code>/g;
            let code = codeReg.exec(param);
            console.log(code);
            if (code === null) {
                code = "405";
            }
            else {
                console.log(code[0]);
                console.log(code[0].replace("<code>", "").replace("</code>", ""));
                code = code[0].replace("<code>", "").replace("</code>", "");
            }
            let reasonReg = /<reason>.*<\/reason>/g;
            let reason = reasonReg.exec(param);
            if (reason === null) {
                reason = "";
            }
            else {
                reason = reason[0].replace("<reason>", "").replace("</reason>", "");
            }
            if (code === '200'){
                let mailReg = /<mailNo>.*<\/mailNo>/g;
                yundanhao = mailReg.exec(param);
                if (yundanhao === null) {
                    yundanhao = "";
                }
                else {
                    yundanhao = yundanhao[0].replace("<mailNo>", "").replace("</mailNo>", "");
                }

                let dingdanReg = /<txLogisticID>.*<\/txLogisticID>/g;
                dingdanhao = dingdanReg.exec(param);
                if (dingdanhao === null) {
                    dingdanhao = "";
                }
                else {
                    dingdanhao = dingdanhao[0].replace("<txLogisticID>", "").replace("</txLogisticID>", "");
                }

                let shortAddressReg = /<shortAddress>.*<\/shortAddress>/g;
                shortAddress = shortAddressReg.exec(param);
                if (shortAddress !== null) {
                    shortAddress = shortAddress[0].replace("<shortAddress>", "").replace("</shortAddress>", "");
                }
                let consigneeBranchCodeReg = /<consigneeBranchCode>.*<\/consigneeBranchCode>/g;
                consigneeBranchCode = consigneeBranchCodeReg.exec(param);
                if (consigneeBranchCode !== null) {
                    consigneeBranchCode = consigneeBranchCode[0].replace("<consigneeBranchCode>", "").replace("</consigneeBranchCode>", "");
                }
                let packageCenterCodeReg = /<packageCenterCode>.*<\/packageCenterCode>/g;
                packageCenterCode = packageCenterCodeReg.exec(param);
                if (packageCenterCode !== null) {
                    packageCenterCode = packageCenterCode[0].replace("<packageCenterCode>", "").replace("</packageCenterCode>", "");
                }
            }
            return {code:code, reason:reason, yundanhao:yundanhao, dingdanhao:dingdanhao,
                shortAddress:shortAddress, packageCenterCode:packageCenterCode, consigneeBranchCode: consigneeBranchCode} ;
        }
        catch (e){
            console.log(e.stack);
            return {code:"405", reason:e.toString(), yundanhao:"未分配"} ;
        }

    }
    static startOrderUpload() {
        console.log("startOrderUpload");
        return new Promise(async(resolve, reject) => {
            let uploadAction = false;
            try {
                let res, sqlTempStr, sqlStr, values;
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
                if (res.length === 0) {
                    return resolve(uploadAction);
                }

                // need upload
                console.log(sqlStr);
                let order = res[0];
                let resChunk = await UploadService.uploadOrder(order);
                let status = 400;
                if (resChunk.status !== 200) {
                    status = 404;
                }
                console.log(resChunk.chunks);
               // let temp_chunk = JSON.parse(resChunk.chunks);
                let resJSON = this.parseXML(resChunk.chunks);
                console.log(resJSON);
                if (resJSON.code === "405") {
                    status = 910;
                }else if (resJSON.code === "S01") {
                    status = 701;
                }else if (resJSON.code === "S02") {
                    status = 902;
                }else if (resJSON.code === "S03") {
                    status = 903;
                }else if (resJSON.code === "S04") {
                    status = 904;
                }else if (resJSON.code === "S05") {
                    status = 905;
                }else if (resJSON.code === "S06") {
                    status = 906;
                }else if (resJSON.code === "S07") {
                    status = 907;
                }else if (resJSON.code === "S08") {
                    status = 801;
                }else if (resJSON.code === "S09") {
                    status = 803;
                }else if (resJSON.code === "200") {
                    status = 4;
                }
                if (resChunk.status !== 200) {
                    status = 404;
                }


                sqlTempStr = "UPDATE `order` SET `state`= ? WHERE `id`= ?;";
                values = [status, order.id];
                sqlStr = mysql.format(sqlTempStr, values);
                await db.queryDbPromise(sqlStr);

                //更新master order 状态
                /** @namespace order.master_db_id */

                let masterOrderId = order.master_db_id;
                sqlTempStr = "SELECT * FROM tb_order_status_name where express_id = ? and status_code = ?;";
                let tempExpressId = 5;
                if (status === 4 || status === 404) { tempExpressId = 0; }
                values = [tempExpressId, status];
                console.log(JSON.stringify(values));
                sqlStr = mysql.format(sqlTempStr, values);
                let resStatus = await masterDb.queryDbPromise(sqlStr);
                console.log(resStatus[0]);
                let masterStatus = 3;
                if (resStatus[0]) {
                    masterStatus = resStatus[0].id ? resStatus[0].id : 3;
                }
                console.log(masterStatus);
                sqlTempStr = "UPDATE `tb_slave_order_status` SET `status_id`= ? WHERE `order_id`= ?;";
                values = [masterStatus, masterOrderId];
                sqlStr = mysql.format(sqlTempStr, values);
                await masterDb.queryDbPromise(sqlStr);

                if (status === 4) {
                    if (resJSON.dingdanhao === order.dingdanhao) {
                        let yundanhao = resJSON.yundanhao;
                        sqlTempStr = "UPDATE `order` SET `yundanhao`= ? WHERE `id`= ?;";
                        values = [yundanhao, order.id];
                        sqlStr = mysql.format(sqlTempStr, values);
                        await db.queryDbPromise(sqlStr);

                        let shortAddress = resJSON.shortAddress|| "111-111-111-111";
                        let consigneeBranchCode = resJSON.shortAddress|| "111111";
                        let packageCenterCode = resJSON.shortAddress|| "111111";
                        sqlTempStr = "INSERT INTO `order_info` (`order_id`, `dingdanhao`, `yundanhao`, `shortAddress`, `consigneeBranchCode`, `packageCenterCode`) VALUES ( ? , ? , ? , ? , ? , ? );";
                        values = [order.id, order.dingdanhao, yundanhao, shortAddress, consigneeBranchCode, packageCenterCode];
                        sqlStr = mysql.format(sqlTempStr, values);
                        await db.queryDbPromise(sqlStr);

                        sqlTempStr = "UPDATE `tb_slave_order` SET `yundan_id`= ?  WHERE `id`= ? ;";
                        values = [yundanhao, masterOrderId];
                        sqlStr = mysql.format(sqlTempStr, values);
                        await masterDb.queryDbPromise(sqlStr);

                        sqlTempStr = "INSERT INTO `tb_slave_order_extra_yuantong` ( `dingdanhao`, `yundanhao`, `shortAddress`, `consigneeBranchCode`, `packageCenterCode`) VALUES ( ? , ? , ? , ? , ? , ? );";
                        values = [order.dingdanhao, yundanhao, shortAddress, consigneeBranchCode, packageCenterCode];
                        sqlStr = mysql.format(sqlTempStr, values);
                        await masterDb.queryDbPromise(sqlStr);
                    }
                }

                //let orderQueue = res[0].value;
                sqlTempStr = "UPDATE `config` SET `value`= ? WHERE `id`='2';";
                values = [parseInt(orderQueue) + 1];
                sqlStr = mysql.format(sqlTempStr, values);
                await db.queryDbPromise(sqlStr);

                uploadAction = true;
                return resolve(uploadAction);
            } catch (e) {
                console.log(`report ${e.stack}`);
                reject(e);
            }
        });
    }
}

module.exports = Order_Service;