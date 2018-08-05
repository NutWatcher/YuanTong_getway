let ApiConfig = require('../config/app.js').app.dev;

let fs = require('fs');
let http = require('http');
let crypto = require('crypto');
let querystring = require('querystring');
let moment = require('moment');
var buffertools = require('buffertools');
buffertools.extend();
class ExpressYuanTong_Service {
    constructor() {
    }
    static createSHA(methodType, parmas, keySecret) {
        let signString = `POST&${encodeURIComponent('/')}&`;
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
        let hmac = crypto.createHmac('sha1', ApiConfig.yuanTong_secret+"&" );
        hmac.update(signString);
        console.log("签名加密");
        let res = hmac.digest('base64');
        console.log(res);

        return res
    }
    static uploadOrder(orders, Platform = "1") {
        return new Promise(async (resolve, reject) => {
            console.log("ExpressYuanTong_Service uploadOrder" );
            try {
                //console.log(orders);
                let order_data = [];
                for (let i = 0 ; i < orders.length ; i ++){
                    let temp_data ;
                    if(!isNaN(orders[i].receiver_phone)){
                        orders[i].receiver_phone = (parseInt(orders[i].receiver_phone) + 10000).toString();
                    }
                    if(!isNaN(orders[i].seller_phone)){
                        orders[i].seller_phone = (parseInt(orders[i].seller_phone) + 10000).toString();
                    }
                    let tempWeight = orders[i].weight;
                   // console.log(tempWeight);
                    tempWeight = tempWeight.replace(/\s+/g, "")==""?0.5:tempWeight;
                   // console.log(tempWeight);
                    tempWeight = isNaN(tempWeight) ? 0.5 : tempWeight ;
                  //  console.log(tempWeight);
                    temp_data = {
                        "order_no" : orders[i].dingdanhao ,
                        "platform": Platform ,

                        "sendContact" : orders[i].seller_name ,
                        "sendCellPhone": orders[i].seller_phone ,
                        "sendState" : orders[i].seller_prov ,
                        "sendCity" : orders[i].seller_city ,
                        "sendDistrict" : orders[i].seller_area ,
                        "sendAddress" :  orders[i].seller_address ,

                        "contact" : orders[i].receiver_name ,
                        "cellPhone" : orders[i].receiver_phone ,
                        "state" : orders[i].receiver_prov  ,
                        "city" : orders[i].receiver_city ,
                        "district" : orders[i].receiver_area ,
                        "address" : orders[i].receiver_address ,

                        "weight" : tempWeight.toString(),
                        "productTitle" : orders[i].product,
                    };
                    order_data.push(temp_data);
                }
                let temp_data = {
                    appkey: ApiConfig.yuanTong_appId,
                    interfaceType: '1',
                    logisticsType: '1',
                    orders:JSON.stringify(order_data),
                    timestamp: new Date().getTime()
                };
                let post_data = {
                    appkey: temp_data.appkey,
                    logisticsType: temp_data.logisticsType,
                    interfaceType: temp_data.interfaceType,
                    orders: temp_data.orders,
                    timestamp: temp_data.timestamp,
                    sign: this.createSHA('POST', temp_data, true)
                };
                console.log(post_data);
                post_data = JSON.stringify(post_data);
                let options = {
                    host:ApiConfig.yuanTong_host,
                    port:ApiConfig.yuanTong_port,
                    path:ApiConfig.yuanTong_orderUpPath,
                    method: 'POST',
                    headers: {
                        'Content-Type': "application/json;charset=UTF-8"
                    }
                };
                console.log(options);
                let chunks = new Buffer('');
                let req = http.request(options, function(res) {
                    console.log('STATUS: ' + res.statusCode);
                    console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        chunks = chunks.concat(chunk);
                    });
                    res.on('end', async function () {
                        resolve({
                            status:res.statusCode,
                            chunks:chunks.toString()
                        });
                    });
                });
                req.setTimeout(10000, function() {
                    console.log("圆通超时");
                    if (req.res) {
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