let ApiConfig = require('../config/app.js').app.dev;

let fs = require('fs');
let http = require('http');
let crypto = require('crypto');
let querystring = require('querystring');
let moment = require('moment');
var buffertools = require('buffertools');
buffertools.extend();
class ExpressYuanTong_Service {
    constructor() {}
    static encryption(param, keySecret) {
        let signString = param + keySecret ;
        let nodeVersion = process.versions.node ;
        if (nodeVersion.indexOf("4") === 0){
            signString = (new Buffer(signString)).toString("binary");
        }
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
    static uploadOrder(order) {
        return new Promise(async (resolve, reject) => {
            console.log("ExpressYuanTong_Service uploadOrder" );
            try {
                console.log('-----------');
                let apiInfo = {
                    yuanTong_appId: ApiConfig.yuanTong_appId,
                    yuanTong_secret: ApiConfig.yuanTong_secret,
                    yuanTong_ip:ApiConfig.yuanTong_ip,
                    yuanTong_port:ApiConfig.yuanTong_port,
                    yuanTong_orderUpPath:ApiConfig.yuanTong_orderUpPath
                };
                if (ApiConfig.account[order.type] != null){
                    apiInfo = {
                        yuanTong_appId: ApiConfig.account[order.type].yuanTong_appId,
                        yuanTong_secret: ApiConfig.account[order.type].yuanTong_secret,
                        yuanTong_ip:ApiConfig.yuanTong_ip,
                        yuanTong_port:ApiConfig.yuanTong_port,
                        yuanTong_orderUpPath:ApiConfig.yuanTong_orderUpPath
                    };
                }
                let temp_data  = {
                    "clientID": apiInfo.yuanTong_appId,
                    "logisticProviderID": "YTO",
                    "customerId": apiInfo.yuanTong_appId,
                    "txLogisticID" : order.dingdanhao ,
                    "tradeNo": "1",
                    "mailNo": order.yundanhao,
                    "orderType": "1",
                    "serviceType": "1",

                    "sender":{
                        "name": order.seller_name ,
                        "mobile":order.seller_phone ,
                        "prov": order.seller_prov ,
                        "city": order.seller_city  + "," + order.seller_area ,
                        "address": order.seller_address ,
                    },
                    "receiver":{
                        "name": order.receiver_name ,
                        "mobile":order.receiver_phone ,
                        "prov": order.receiver_prov ,
                        "city": order.receiver_city  + "," + order.receiver_area ,
                        "address": order.receiver_address ,
                    },
                    "itemName": order.product ,
                    "number": 1,
                };
                //orderList = `<clientID>K21000119</clientID><logisticProviderID>YTO</logisticProviderID><customerId >K21000119</customerId><txLogisticID>ccccasd13123123</txLogisticID><tradeNo>1</tradeNo><totalServiceFee>0.0</totalServiceFee><codSplitFee>0.0</codSplitFee><orderType>0</orderType><serviceType>1</serviceType><flag>1</flag><sender><name>寄件人姓名</name><postCode>526238</postCode><phone>021-12345678</phone><mobile>18112345678</mobile><prov>上海</prov><city>上海,青浦区</city><address>华徐公路3029弄28号</address></sender><receiver><name>收件人姓名</name><postCode>0</postCode><phone>0</phone><mobile>1808966676</mobile><prov>上海</prov><city>上海市,青浦区</city><address>华徐公路3029弄28号</address></receiver><sendStartTime>2015-12-12 12:12:12</sendStartTime><sendEndTime>2015-12-12 12:12:12</sendEndTime><goodsValue>1</goodsValue><items><item><itemName>商品</itemName><number>2</number><itemValue>0</itemValue></item></items><insuranceValue>1</insuranceValue><special>1</special><remark>1</remark>`;
                console.log(temp_data);
                let xml =  "<RequestOrder>" + this.concatXML(temp_data) + "</RequestOrder>";
                console.log(xml);
                let post_data = {
                    logistics_interface: (xml),
                    data_digest: (this.encryption(xml, apiInfo.yuanTong_secret)),
                    clientId: apiInfo.yuanTong_appId,
                    type: "offline"
                };
                console.log(post_data);
                post_data = querystring.stringify(post_data);
                console.log(post_data);
                let options = {
                    host:apiInfo.yuanTong_ip,
                    port:apiInfo.yuanTong_port,
                    path:apiInfo.yuanTong_orderUpPath,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                };
                console.log(options);
                var chunks = new Buffer('');
                let req = http.request(options, function(res) {
                    console.log('STATUS: ' + res.statusCode);
                    console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function(chunk) {
                        chunks = chunks.concat(chunk);
                    });
                    res.on('end', async function() {
                        resolve({
                            status:res.statusCode,
                            chunks:chunks.toString()
                        });
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
                reject(e);
            }
            finally{
            }
        });
    }
}

module.exports = ExpressYuanTong_Service;