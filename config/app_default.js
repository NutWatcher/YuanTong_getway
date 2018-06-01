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
    host : "",
    port : "",
    database : "",
    user : "",
    password : "",
    multipleStatements: true,
    connectionLimit : 3
};
exports.dataBase = {
    host : "",
    port : "",
    database : "",
    user : "",
    password : "",
    multipleStatements: true,
    connectionLimit : 1
};