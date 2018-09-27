var fs = require('fs');
var http = require('http');
var crypto = require('crypto');
var test = function() {
    var str = `<RequestOrder><clientID>K21000119</clientID><logisticProviderID>YTO</logisticProviderID><customerId >K21000119</customerId><txLogisticID>ccccasd13123123</txLogisticID><tradeNo>1</tradeNo><totalServiceFee>0.0</totalServiceFee><codSplitFee>0.0</codSplitFee><orderType>0</orderType><serviceType>1</serviceType><flag>1</flag><sender><name>寄件人姓名</name><postCode>526238</postCode><phone>021-12345678</phone><mobile>18112345678</mobile><prov>上海</prov><city>上海,青浦区</city><address>华徐公路3029弄28号</address></sender><receiver><name>收件人姓名</name><postCode>0</postCode><phone>0</phone><mobile>1808966676</mobile><prov>上海</prov><city>上海市,青浦区</city><address>华徐公路3029弄28号</address></receiver><sendStartTime>2015-12-12 12:12:12</sendStartTime><sendEndTime>2015-12-12 12:12:12</sendEndTime><goodsValue>1</goodsValue><items><item><itemName>商品</itemName><number>2</number><itemValue>0</itemValue></item></items><insuranceValue>1</insuranceValue><special>1</special><remark>1</remark></RequestOrder>`;
    str = (new Buffer(str)).toString("binary");
    console.log(str);
    str = str + "u2Z1F7Fh";
    var md5 = crypto.createHash('md5');
    var password = md5.update(str).digest('base64');
    console.log(password);
};
test();