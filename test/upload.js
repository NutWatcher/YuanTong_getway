let UploadService = require('../service/upload');
let test = async (orderList) => {
    let resChunk = await UploadService.uploadOrder(orderList, "1");
    console.log(resChunk);
}
let orderList = [
    {
        dingdanhao : "105124314212",

        receiver_name : "刘道平",
        receiver_phone : "13552894357",
        receiver_prov  : "湖南省",
        receiver_city : "娄底市",
        receiver_area : "新化县",
        receiver_address : "上梅租房6栋",

        seller_name : "李欢",
        seller_phone : "13552894357",
        seller_prov : "湖南省",
        seller_city : "娄底市",
        seller_area : "新化县",
        seller_address : "北京上梅租房6栋北京市平谷区北京平谷马坊物流园",

        product : "衣服发发发",
        weight : "1"
    }
];
test(orderList);