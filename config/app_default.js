exports.app ={
    "sitePort": 3000,
    "loopTick" : 10000,
    "dev": {
        yuanTong_secret: '',
        yuanTong_appId: '',//md5 加密完成后
        yuanTong_host: '',
        yuanTong_port: '',
        yuanTong_tokenPath: '/v1/token',
        yuanTong_orderUpPath: '/Api/V1/OrderSubmit',
        yuanTong_balancePath: '/Api/V1/BalanceGet',
        yuanTong_searchPath: '/v1/fail/post'
    },
    product : {
        yuanTong_secret: '',
        yuanTong_appId: '',//md5 加密完成后
        yuanTong_host: '',
        yuanTong_port: '',
        yuanTong_tokenPath: '/v1/token',
        yuanTong_orderUpPath: '/Api/V1/OrderSubmit',
        yuanTong_balancePath: '/Api/V1/BalanceGet',
        yuanTong_searchPath: '/v1/fail/post'
    }
};
exports.dataBase = {
    host : "120.0.0.1",
    port : "",
    database: "test_getway_yuantong",
    masterDatabase : "test_getway_order",
    user: "",
    password: "",
    multipleStatements: true,
    connectionLimit : 2
};