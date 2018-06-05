let mysql = require( 'mysql');
let masterDb = require('../util/MasterDB');
let db = require('../util/MasterDB');
let OrderService = require('../service/order');
let AddMasterOrder = async (orderList) => {
    let sqlTempStr, sqlStr, values;
    let initState = "5";
    sqlTempStr = "INSERT INTO `tb_slave_order` " +
        "(`task_id`, `slave_id`, `dingdan_id`, `yundan_id`, " +
        "`seller_name`, `seller_phone`, `seller_prov`, `seller_city`, `seller_area`, `seller_address`, " +
        "`reciever_name`, `reciever_phone`, `reciever_prov`, `reciever_city`, `reciever_area`, `reciever_address`, " +
        "`post_id`, `weight`, `goods_name`) " +
        "VALUES ('1', '1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    for (let i = 0 ; i < orderList.length ; i ++ ) {
        let tempDingDan = orderList[i];
        //console.log(tempDingDan);
        values = [tempDingDan.dingdan_id, "",
            tempDingDan.seller_name, tempDingDan.seller_phone,
            tempDingDan.seller_prov, tempDingDan.seller_city, tempDingDan.seller_area, tempDingDan.seller_address,

            tempDingDan.reciever_name, tempDingDan.reciever_phone,
            tempDingDan.reciever_prov, tempDingDan.reciever_city, tempDingDan.reciever_area, tempDingDan.reciever_address,
            "",
            tempDingDan.goods_name, tempDingDan.weight
        ];
        sqlStr = mysql.format(sqlTempStr, values);
        console.log(sqlStr);
        await masterDb.queryDbPromise(sqlStr);
    }

    for (let i = 0 ; i < orderList.length ; i ++ ) {
        sqlTempStr = "SELECT * FROM tb_slave_order where dingdan_id = ?;";
        values = [orderList[i].dingdan_id];
        sqlStr = mysql.format(sqlTempStr, values);
        console.log(sqlStr);
        let res = await db.queryDbPromise(sqlStr);
        orderList[i].dingdan_db_id = res[0].id;
        orderList[i].yundan_id = "";

        sqlTempStr = "INSERT INTO `tb_slave_order_status` (`order_id`, `status_id`) VALUES (? , ?);";
        values = [res[0].id, 53];
        sqlStr = mysql.format(sqlTempStr, values);
        console.log(sqlStr);
        await db.queryDbPromise(sqlStr);
    }
    AddQueue(orderList);
};
let AddQueue = async (orderList) => {
    let resChunk = await OrderService.add(orderList );
    console.log(resChunk);
};
let orderList = [
    {
        dingdan_id : "335124314212",
        seller_name : "李欢",
        seller_phone : "13552894357",
        seller_prov : "湖南省",
        seller_city : "娄底市",
        seller_area : "新化县",
        seller_address : "北京上梅租房6栋北京市平谷区北京平谷马坊物流园",
        reciever_name : "刘道平",
        reciever_phone : "13552894357",
        reciever_prov  : "湖南省",
        reciever_city : "娄底市",
        reciever_area : "新化县",
        reciever_address : "上梅租房6栋",
        goods_name : "衣服发发发",
        weight : "1"
    },
    {
        dingdan_id : "345124314212",
        seller_name : "李欢",
        seller_phone : "13552894357",
        seller_prov : "湖南省",
        seller_city : "娄底市",
        seller_area : "新化县",
        seller_address : "北京上梅租房6栋北京市平谷区北京平谷马坊物流园",
        reciever_name : "刘道平",
        reciever_phone : "13552894357",
        reciever_prov  : "湖南省",
        reciever_city : "娄底市",
        reciever_area : "新化县",
        reciever_address : "上梅租房6栋",
        goods_name : "衣服发发发",
        weight : "1"
    }
];

AddMasterOrder(orderList);