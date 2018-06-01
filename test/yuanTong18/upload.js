/**
 * Created by lyy on 2016/7/13.
 */
/**
 * Created by 扬洋 on 2015/12/2.
 */
var fs = require('fs');
var http = require('http');
var crypto = require('crypto');
var querystring = require('querystring');
var moment = require('moment');
global.APPCONFIG={
    yuanTong_appId:"7e64bb14128a042acedfdf1c93a7804b",
    yuanTong_secret:"e9c498b6756f31d8e911f4197353a5c3",
    yuanTong_ip: '182.61.29.51',
    yuanTong_port: '8089',
    //yuanTong_tokenPath: '/v1/token',
    yuanTong_orderUpPath: '/Api/V1/OrderSubmit',
    yuanTong_balancePath: '/Api/V1/BalanceGet',
    //yuanTong_searchPath: '/v1/fail/post'
};
class ExpressYuanTong_Service {
    constructor() {
    }
    static createSHA(methodType, parmas, keySecret) {
        let signString = `POST&${encodeURIComponent('/')}&`
        for (let item in parmas) {
            if (item !== 'timestamp') {
                if (item === 'orders') {
                    signString += encodeURIComponent(`${item}=${encodeURIComponent(parmas[item])}&`)
                } else {
                    signString += encodeURIComponent(`${item}=${parmas[item]}&`)
                }
            } else {
                signString += encodeURIComponent(`${item}=${parmas[item]}`)
            }
        }
        console.log("签名字串");
        console.log(signString);
        var hmac = crypto.createHmac('sha1', global.APPCONFIG.yuanTong_secret+"&" );
        hmac.update(signString);
        console.log("签名加密");
        var res = hmac.digest('base64');
        console.log(res);

        return res
    }
    static getBalance() {
        return new Promise(async (resolve, reject) => {
            console.log("ExpressYuanTong_Service getBalance" );
            try {
                var temp_data = {
                    appkey: global.APPCONFIG.yuanTong_appId,
                    format: 'json',
                    timestamp: new Date().getTime()
                };
                var post_data = {
                    appkey: temp_data.appkey,
                    format: temp_data.format,
                    timestamp: temp_data.timestamp,
                    sign: this.createSHA('POST', temp_data, true)
                };
                console.log(post_data);
                post_data = JSON.stringify(post_data);
                var options = {
                    host:global.APPCONFIG.yuanTong_ip,
                    port:global.APPCONFIG.yuanTong_port,
                    path:global.APPCONFIG.yuanTong_balancePath,
                    method: 'POST',
                    headers: {
                        'Content-Type': "application/json",
                    }
                };
                var chunks = new Buffer('');
                var req = http.request(options, function(res) {
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        chunks = chunks.concat(chunk);
                    });
                    res.on('end', async function () {
                        resolve(chunks.toString());
                    });
                });
                req.on('error', function(e) {
                    console.log('ExpressYuanTong_Service uploadOrder problem with request: ' + e.message);
                    reject(e);
                });
                req.write(post_data);
                req.end();
            }
            catch(e){
                console.log("ExpressYuanTong_Service uploadOrder error");
                console.log(e.stack);
                let err = new Error(e.name);
                err.message = e.message ;
                err.stack += e.stack;
                reject(err);
            }
            finally{
            }
        });
    }
    static uploadOrder(orders) {
        return new Promise(async (resolve, reject) => {
            console.log("ExpressYuanTong_Service uploadOrder" );
            try {
                console.log('-----------');
                var orderList = [];
                for (let i = 0 ; i < orders.length ; i ++){
                    let temp_data ;
                    temp_data = {
                        "order_no" : orders[i].dingdan_id ,
                        "platform": '1',

                        "sendContact" : orders[i].seller_name ,
                        "sendCellPhone" : orders[i].seller_phone ,
                        "sendState" : orders[i].seller_prov ,
                        "sendCity" : orders[i].seller_city ,
                        "sendDistrict" : orders[i].seller_area ,
                        "sendAddress" :  orders[i].seller_address ,

                        "contact" : orders[i].reciever_name ,
                        "cellPhone" : orders[i].reciever_phone ,
                        "state" : orders[i].reciever_prov  ,
                        "city" : orders[i].reciever_city ,
                        "district" : orders[i].reciever_area ,
                        "address" : orders[i].reciever_address ,

                        "weight" : orders[i].weight ,
                        "productTitle" : orders[i].goods_name ,
                    };
                    orderList.push(temp_data);
                }
                var temp_data = {
                    appkey: global.APPCONFIG.yuanTong_appId,
                    interfaceType: '1',
                    logisticsType: '1',
                    orders:JSON.stringify(orderList),
                    timestamp: new Date().getTime()
                };
                var post_data = {
                    appkey: temp_data.appkey,
                    logisticsType: temp_data.logisticsType,
                    interfaceType: temp_data.interfaceType,
                    orders: temp_data.orders,
                    timestamp: temp_data.timestamp,
                    sign: this.createSHA('POST', temp_data, true)
                };
                console.log(post_data);
                post_data = JSON.stringify(post_data);
                var options = {
                    host:global.APPCONFIG.yuanTong_ip,
                    port:global.APPCONFIG.yuanTong_port,
                    path:global.APPCONFIG.yuanTong_orderUpPath,
                    method: 'POST',
                    headers: {
                        'Content-Type': "application/json;charset=UTF-8"
                    }
                };
                console.log(options);
                var chunks = new Buffer('');
                var req = http.request(options, function(res) {
                    console.log('STATUS: ' + res.statusCode);
                    console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        chunks = chunks.concat(chunk);

                    });
                    res.on('end', async function () {
                        resolve(chunks.toString());
                    });
                });
                req.setTimeout(10000, function() {
                    console.log("timeout received");
                    if (req.res) {
                        console.log("req.res timeout received");
                        req.res.emit("abort");
                    }
                    req.abort();
                });
                req.on('error', function(e) {
                    console.log('ExpressYuanTong_Service uploadOrder problem with request: ' + e.message);
                    reject(e);
                });
                req.write(post_data);
                req.end();

            }
            catch(e){
                console.log("ExpressYuanTong_Service uploadOrder error");
                console.log(e.stack);
                let err = new Error(e.name);
                err.message = e.message ;
                err.stack += e.stack;
                reject(err);
            }
            finally{
            }
        });
    }
}

module.exports = ExpressYuanTong_Service;