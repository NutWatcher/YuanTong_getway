/**
 * Created by lyy on 2016/7/13.
 */
require("babel/register");
var ExpressYunDa_Service = require('./upload');
var order = [
    {
        "dingdan_id": "355dd550000112131",
        "seller_name": "李欢",
        "seller_phone": "13552894357",
        "seller_prov": "北京",
        "seller_city": "北京",
        "seller_area": "11区",
        "seller_address": "北京北京市平谷区北京平谷马坊物流园",
        "reciever_name": "刘道平",
        "reciever_phone": "13087386315",
        "reciever_prov": "湖南省",
        "reciever_city": "娄底市",
        "reciever_area": "新化县",
        "reciever_address": "上梅镇周家坝廉租房6栋",
        "goods_name": "衣服发发发",
        "weight": "19.51"
    }
];


/*ExpressYunDa_Service.getToken().then(function (data) {
    console.log(data);
});*/
var cc = [];
var dingdan = "1051281114211";
for (var i = 0; i < 1; i++) {
    dingdan = (parseInt(dingdan) + 1).toString();
    cc.push({
        "dingdan_id": dingdan,
        "seller_name": "李欢",
        "seller_phone": "13552904357",
        "seller_prov": "北京",
        "seller_city": "北京",
        "seller_area": "北京",
        "seller_address": "北京上梅租房6栋北京市平谷区北京平谷马坊物流园",
        "reciever_name": "刘道平",
        "reciever_phone": "1318738",
        "reciever_prov": "湖省",
        "reciever_city": "娄底市",
        "reciever_area": "新化县",
        "reciever_address": "上梅租房6栋",
        "goods_name": "衣服发发发",
        "weight": "1"
    });
}
//console.log(cc);
/*ExpressYunDa_Service.getInfo([{"order_no":"105874136"},{"order_no":"105874137"}]).then(function (data) {
    console.log(data);
})*/
// cc=[{
//     "dingdan_id": '12365842623235446666',
//     "seller_name": "张健",
//     "seller_phone": "18315656589",
//     "seller_prov": "浙江省",
//     "seller_city": "杭州市",
//     "seller_area": "余杭区",
//     "seller_address": "西溪景苑",
//     "reciever_name": "陈柏鹏",
//     "reciever_phone": "13375699654",
//     "reciever_prov": "浙江省",
//     "reciever_city": "杭州市",
//     "reciever_area": "余杭区",
//     "reciever_address": "乐富海邦园",
//     "goods_name": "安卓数据线",
//     "weight": "1.0"
// }];
var parseXML=function(param){
    try {
        console.log(param);
        var yundanhao = "未分配";
        var codeReg = /<code>.*<\/code>/g;
        var code = codeReg.exec(param);
        if (code === null) {
            code = "405";
        }
        else {
            code = code[0].replace("<code>", "").replace("</code>", "");
        }
        var reasonReg = /<reason>.*<\/reason>/g;
        var reason = reasonReg.exec(param);
        if (reason === null) {
            reason = "";
        }
        else {
            reason = reason[0].replace("<reason>", "").replace("</reason>", "");
        }
        if (code === '200'){
            var mailReg = /<mailNo>.*<\/mailNo>/g;
            yundanhao = mailReg.exec(param);
            if (yundanhao === null) {
                yundanhao = "";
            }
            else {
                yundanhao = yundanhao[0].replace("<mailNo>", "").replace("</mailNo>", "");
            }
        }
    }
    catch (e){
        console.log(e);
    }
    return {code:code, reason:reason, yundanhao:yundanhao} ;
}
ExpressYunDa_Service.uploadOrder(cc).then(function (data) {
    var res = parseXML(data);
    console.log(res);
    console.log(data);
});

//
// ExpressYunDa_Service.getBalance().then(function (data) {
//  console.log(data);
//  });
//
