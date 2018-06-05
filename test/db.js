let mysql = require( 'mysql');
let masterDb = require('../util/MasterDB');
let test = async() => {
    console.log("in");
    try {
        let cc = await masterDb.queryDbPromise("SELECT * FROM tb_slave_order;");
    }catch (e){}
    console.log("in1");
    let res = await masterDb.queryDbPromise("SELECT * FROM tb_slave_order;");
    console.log(res);
};
test();
// var connection = mysql.createConnection({
//     host:"127.0.0.1",
//     port:"3334",
//     database: "test_getway_order",
//     user: "root",
//     password: "p12cHANgepwD",
// });
// connection.connect();
// connection.query( 'SELECT * FROM tb_slave_order;', function (err, rows) {
//     if (err) {
//         console.log(err);
//     }
//
//     console.log(rows.length);
// });