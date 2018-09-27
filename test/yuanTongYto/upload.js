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
    yuanTong_appId:"K21000119",
    yuanTong_secret:"u2Z1F7Fh",
    yuanTong_ip: '58.32.246.71',
    yuanTong_port: '8000',
    yuanTong_orderUpPath: '/CommonOrderModeBPlusServlet.action',
    yuanTong_balancePath: '/Api/V1/BalanceGet',
    //yuanTong_searchPath: '/v1/fail/post'
};
class ExpressYuanTong_Service {
    constructor() {
    }
    static encryption(param, keySecret) {
        let signString = param + keySecret ;
        let md5 = crypto.createHash('md5');
        let password = md5.update(signString).digest('base64');
        console.log(password);
        return password ;
    }
    static concatXML(param){
        let str = "";
        for (let key in param){
            let v = param[key];
            if ( typeof (param[key]) == "object"){
                v = this.concatXML(v) ;
            }
            str += "<" + key + ">" + v + "</" + key + ">";
        }
        return str ;
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
                        "clientID": global.APPCONFIG.yuanTong_appId,
                        "logisticProviderID": "YTO",
                        "customerId": global.APPCONFIG.yuanTong_appId,
                        "txLogisticID" : orders[i].dingdan_id ,
                        "tradeNo": "1",
                        "orderType": "1",
                        "serviceType": "1",

                        "sender":{
                            "name": orders[i].seller_name ,
                            "mobile":orders[i].seller_phone ,
                            "prov": orders[i].seller_prov ,
                            "city": orders[i].seller_city  + "," + orders[i].seller_area ,
                            "address": orders[i].seller_address ,
                        },
                        "receiver":{
                            "name": orders[i].reciever_name ,
                            "mobile":orders[i].reciever_phone ,
                            "prov": orders[i].reciever_prov ,
                            "city": orders[i].reciever_city  + "," + orders[i].reciever_area ,
                            "address": orders[i].reciever_address ,
                        },
                        "itemName": orders[i].goods_name ,
                        "number": 1,
                    };
                    orderList.push(temp_data);
                }
                orderList = orderList[0];
                let xml =  "<RequestOrder>" + this.concatXML(orderList) + "</RequestOrder>";
                console.log(xml);
                let post_data = {
                    logistics_interface: encodeURIComponent(xml),
                    data_digest: this.encryption(xml, global.APPCONFIG.yuanTong_secret),
                    clientId: global.APPCONFIG.yuanTong_appId,
                    type: "offline"
                };

                console.log(post_data);
                post_data = querystring.stringify(post_data);
                console.log(post_data);
                let options = {
                    host:global.APPCONFIG.yuanTong_ip,
                    port:global.APPCONFIG.yuanTong_port,
                    path:global.APPCONFIG.yuanTong_orderUpPath,
                    method: 'POST',
                    headers: {
                        'Content-Type': "application/x-www-form-urlencoded",
                        "Content-Length" : post_data.length
                    }
                };
                console.log(options);
                let chunks = [];
                let size = 0;
                let req = http.request(options, function(res) {
                    console.log('STATUS: ' + res.statusCode);
                    console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        chunks.push(chunk);
                        size += chunk.length;

                    });
                    res.on('end', async function () {
                        let data = null;
                        switch(chunks.length) {
                            case 0: data = new Buffer(0);
                                break;
                            case 1: data = chunks[0];
                                break;
                            default:
                                data = new Buffer(size);
                                for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
                                    let chunk = chunks[i];
                                    chunk.copy(data, pos);
                                    pos += chunk.length;
                                }
                                break;
                        }
                        resolve(data.toString());
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