var fs = require('fs');
var http = require('http');
var crypto = require('crypto');
var querystring = require('querystring');
var moment = require('moment');
class ExpressYuanTong_Service {
    constructor() {
    }
    static signature(arr = []){
        let secret = global.APPCONFIG.yuanTong_secret;
        let appId = global.APPCONFIG.yuanTong_appId;
        let nowDate = moment();
        let timestamp = nowDate.format("YYYY-MM-DD HH:mm:ss");
        let format = "json";
        let tempArr = arr ;
        tempArr.push("appKey" + appId );
        tempArr.push("format" + format );
        tempArr.push("timestamp" + timestamp );
        tempArr.sort();
        console.log(tempArr);
        let rawStr = secret;
        for (let i = 0 ;i < tempArr.length ; i ++ ){
            rawStr += tempArr[i];
        }
        rawStr += secret ;
        console.log(rawStr);
        let md5 = crypto.createHash('md5');
        md5.update(rawStr, 'utf8');
        let secret_md5 = md5.digest('hex');
        let res = {
            appKey: appId,
            format: "json",
            timestamp: timestamp,
            sign: secret_md5,
            time:nowDate.format("YYYY-MM-DD")
        };
        console.log(res);
        return res ;
    }
    static getToken() {
        return new Promise(async (resolve, reject) => {
            //console.log("ExpressYuanTong_Service getToken" );
            try {
                var secret = global.APPCONFIG.yuanTong_secret;
                var appId = global.APPCONFIG.yuanTong_appId;
                var post_data = {
                    "secret": secret,
                    "appid": appId
                };
                post_data = querystring.stringify(post_data);
                var options = {
                    host:global.APPCONFIG.yuanTong_ip,
                    port:global.APPCONFIG.yuanTong_port,
                    path:global.APPCONFIG.yuanTong_tokenPath + '?' + post_data,
                    method: 'GET',
                    headers: {
                    }
                };
                var chunks = new Buffer('');
                var req = http.request(options, function(res) {
                    console.log('STATUS: ' + res.statusCode);
                    //console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        chunks = chunks.concat(chunk);
                    });
                    res.on('end', async function () {
                        //      resolve(chunks.toString());
                        console.log("------------" + chunks.toString());
                        let token = JSON.parse(chunks.toString()) ;
                        if (token.result != 1){
                            return resolve({
                                success:false ,
                                msg:"获取token出错，错误代码：" + token.error_code.toString(),
                                result:{}
                            })
                        }
                        else {
                            return resolve({
                                success:true ,
                                msg:"",
                                result:{
                                    token: token.token
                                }
                            })
                        }
                    });
                });
                //30秒超时处理
                req.setTimeout(30000, function() {
                    console.log("圆通超时");
                    if (req.res) {
                        req.res.emit("abort");
                    }
                    req.abort();
                });
                req.on('error', function(e) {
                    console.log('ExpressYuanTong_Service getToken problem with request: ' + e.message);
                    reject(e);
                });
                console.log(post_data);
                req.end();
            }
            catch(e){
                console.log("ExpressYuanTong_Service getToken error");
                console.log(e.stack);
                reject(e);
            }
            finally{
            }
        });
    }
    static getBalance() {
        return new Promise(async (resolve, reject) => {
            console.log("ExpressYuanTong_Service getBalance" );
            try {
                let resSign =  ExpressYuanTong_Service.signature([]);

                let post_data ={
                    appKey: resSign.appKey,
                    format: "json",
                    timestamp: resSign.timestamp,
                    sign: resSign.sign,
                };
                post_data = querystring.stringify(post_data);
                post_data= post_data.replace(resSign.time + "%20", resSign.time+"+");
                console.log(post_data);
                var options = {
                    host:global.APPCONFIG.yuanTong_host,
                    path:global.APPCONFIG.yuanTong_balancePath ,
                    method: 'post',
                    headers: {
                        'Content-Type':"application/x-www-form-urlencoded;charset=utf-8",
                        "Content-Length": post_data.length
                    }
                };
                var chunks = new Buffer('');
                var req = http.request(options, function(res) {
                    console.log('STATUS: ' + res.statusCode);
                    //console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        chunks = chunks.concat(chunk);
                    });
                    res.on('end', async function () {
                        resolve(chunks.toString());
                    });
                });

                //30秒超时处理
                req.setTimeout(30000, function() {
                    console.log("圆通超时");
                    if (req.res) {
                        req.res.emit("abort");
                    }
                    req.abort();
                });
                req.on('error', function(e) {
                    console.log('ExpressYuanTong_Service getBalance problem with request: ' + e.message);
                    reject(e);
                });
                req.write(post_data);
                req.end();

            }
            catch(e){
                console.log("ExpressYuanTong_Service getBalance error");
                console.log(e.stack);
                reject(e);
            }
            finally{
            }
        });
    }
    static getInfo(orders) {
        return new Promise(async (resolve, reject) => {
            console.log("ExpressYuanTong_Service getInfo" );
            console.log(orders );
            try {
                let resToken = await ExpressYuanTong_Service.getToken();
                if(resToken.success == false){
                    return resolve(resToken) ;
                }

                var post_data = {
                    "token": resToken.result.token,
                    "data":JSON.stringify(orders)
                };
                post_data = querystring.stringify(post_data);
                console.log(post_data);
                var options = {
                    host:global.APPCONFIG.yuanTong_ip,
                    port:global.APPCONFIG.yuanTong_port,
                    path:global.APPCONFIG.yuanTong_searchPath,
                    method: 'POST',
                    headers: {
                        'Content-Type':"application/x-www-form-urlencoded;charset=utf-8",
                        "Content-Length": post_data.length
                    }
                };
                var chunks = new Buffer('');
                var req = http.request(options, function(res) {
                    //console.log('STATUS: ' + res.statusCode);
                    //console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        chunks = chunks.concat(chunk);

                    });
                    res.on('end', async function () {
                        resolve(chunks.toString());
                    });
                });
                req.setTimeout(30000, function() {
                    console.log("圆通超时");
                    if (req.res) {
                        req.res.emit("abort");
                    }
                    req.abort();
                });
                req.on('error', function(e) {
                    console.log('ExpressYuanTong_Service getInfo problem with request: ' + e.message);
                    reject(e);
                });
                req.write(post_data);
                req.end();

            }
            catch(e){
                console.log("ExpressYuanTong_Service getInfo error");
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
    static uploadOrder(orders, Platform) {
        return new Promise(async (resolve, reject) => {
            console.log("ExpressYuanTong_Service uploadOrder" );
            try {
                //console.log(orders);
                let order_data = [];
                for (let i = 0 ; i < orders.length ; i ++){
                    let temp_data ;
                    if(!isNaN(orders[i].reciever_phone)){
                        orders[i].reciever_phone = (parseInt(orders[i].reciever_phone) + 10000).toString();
                    }
                    else{
                        orders[i].OfficePhone = orders[i].reciever_phone ;
                        orders[i].reciever_phone = "";
                    }
                    if(!isNaN(orders[i].seller_phone)){
                        orders[i].seller_phone = (parseInt(orders[i].seller_phone) + 10000).toString();
                    }
                    else{
                        orders[i].SendCellPhone = orders[i].seller_phone ;
                        orders[i].seller_phone = "";
                    }
                    let tempWeight = orders[i].weight;
                    console.log(tempWeight);
                    tempWeight = tempWeight.replace(/\s+/g, "")==""?0.5:tempWeight;
                    console.log(tempWeight);
                    tempWeight = isNaN(tempWeight) ? 0.5 : tempWeight ;
                    console.log(tempWeight);
                    temp_data = {
                        "Platform": Platform ,
                        "OrderNo" : orders[i].dingdan_id ,
                        "Contact" : orders[i].reciever_name ,
                        "OfficePhone": orders[i].OfficePhone ,
                        "CellPhone" : orders[i].reciever_phone ,
                        "State" : orders[i].reciever_prov  ,
                        "City" : orders[i].reciever_city ,
                        "District" : orders[i].reciever_area ,
                        "Address" : orders[i].reciever_address ,

                        "SendContact" : orders[i].seller_name ,
                        "SendOfficePhone" : orders[i].seller_phone ,
                        "SendCellPhone": orders[i].SendCellPhone ,
                        "SendState" : orders[i].seller_prov ,
                        "SendCity" : orders[i].seller_city ,
                        "SendDistrict" : orders[i].seller_area ,
                        "SendAddress" :  orders[i].seller_address ,

                        "ProductTitle" : orders[i].goods_name,
                        "Weight" : tempWeight.toString()
                    };
                    order_data.push(temp_data);
                }
                let resSign =  ExpressYuanTong_Service.signature(["orders"+JSON.stringify(order_data),"logiType4"]);
                let post_data ={
                    orders:JSON.stringify(order_data),
                    logiType:"4",
                    appKey: resSign.appKey,
                    format: "json",
                    timestamp: resSign.timestamp,
                    sign: resSign.sign,
                };
                console.log(post_data);
                post_data = querystring.stringify(post_data);
                console.log(post_data);
                var options = {
                    host:global.APPCONFIG.yuanTong_host,
                    path:global.APPCONFIG.yuanTong_orderUpPath,
                    method: 'POST',
                    headers: {
                        'Content-Type':"application/x-www-form-urlencoded;charset=utf-8",
                        "Content-Length": post_data.length
                    }
                };
                var chunks = new Buffer('');
                var req = http.request(options, function(res) {
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
                req.setTimeout(120000, function() {
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