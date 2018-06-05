/**
 * Created by lyy on 2015/10/5.
 */
let moment = require('moment');
let mysql = require('mysql');
let dbConfig = require('../config/app.js').dataBase;
console.log(dbConfig);
let pool  = mysql.createPool({
    "host": dbConfig.host,
    "port": dbConfig.port,
    "database": dbConfig.masterDatabase,
    "user": dbConfig.user,
    "password": dbConfig.password,
    "connectionLimit": dbConfig.connectionLimit||5
});

exports.escape = function(data){
    return pool.escape(data) ;
};

var queryDbStream = function (strSqls, cb, endCb) {
    var strSql = "" ;
    for ( var i = 0 ; i < strSqls.length ; i ++ ){
        strSql += strSqls[i] ;
    }
    pool.getConnection(function(err, connection) {
        // Use the connection
        if (err) {
            cb(err);
            return ;
        }
        var query = connection.query(strSql);
        query
            .on('error', function(err) {
                // Handle error, an 'end' event will be emitted after this as well
                if (err) {
                    cb(err);
                    connection.release();
                }
            })
            .on('fields', function(fields, index) {
                // the fields for the result rows that follow
            })
            .on('result', function(row, index) {
                // index refers to the statement this result belongs to (starts at 0)
                if ( cb ){
                    cb("",row,index) ;
                }
            })
            .on('end', function() {
                // all rows have been received
                connection.release();
                endCb();
            });
    });
};
exports.queryDbPromise = function (strSql, connection) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function(err, connection) {
            if (err) {
                console.log(err);
                reject(err);
            }
            connection.query(strSql, (err, res) => {
                // And done with the connection.
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
                connection.release();
            });
        });
    });
};

exports.beginTransactionsPromise = function(connection){
    return new Promise((resolve, reject) => {
        pool.getConnection(function(err, connection) {
            if (err) {
                //console.log("beginTransactionsPromise " + err);

                reject(new Error(err));
            }
            connection.beginTransaction(function(err) {
                if (!err) {
                    //console.log("beginTransaction");
                    resolve(connection);
                } else {

                    reject(new Error(err));
                }
            });
        });
    });

};
exports.tranQueryDbPromise = function (strSql, Connection) {
    return new Promise((resolve, reject) => {
        //console.log(Connection);
        Connection.query( strSql, (err, res) => {
            if (err) {
                //console.log(err);

                err.message += " SQL: " + strSql;
                reject(new Error(err));
            } else {
                resolve(res);
            }
        });
    });
};
exports.commitTransactionsPromise = function(connection){
    return new Promise((resolve, reject) => {
        connection.commit(function(err) {
            if (err) {
                console.log("commitTransactionsPromise " + err);

                reject(new Error(err));
            }
            else {
                resolve("commit true");
                connection.release() ;
            }
        });
    });
};
exports.rollbackTransactionsPromise = function(connection){
    return new Promise((resolve, reject) => {
        connection.rollback(function() {
            connection.release();
            console.log("rollback");
            resolve("rollback true");
        });
    });
};
var queryDb = function (strSql, logInfo, cb) {
    if (cb === undefined){
        cb = logInfo ;
        logInfo =  moment().format('YYYY-MM-DD HH:mm:ss.SSS' + ' ');
    }
    log.info(logInfo+ strSql);
    pool.getConnection(function(err, connection) {
        if (err) {
            cb(err);
            return ;
        }
        connection.query( strSql , function(err, rows) {
            // And done with the connection.
            if (err) {
                cb(err);
                connection.release();
                return;
            }
            cb(err, rows);

            connection.release();
            // Don't use the connection here, it has been returned to the pool.
        });
    });
};
exports.beginTransactions = function(cb){
    pool.getConnection(function(err, connection) {
        if (err) {
            cb(err);
            return ;
        }
        connection.beginTransaction(function(err) {
            if (!err) {
                cb(null, connection);
            } else {
                cb(err);
            }
        });
    });
};
exports.queryTransactions = function(connection, strSql, logInfo, cb){
    if (cb === undefined){
        cb = logInfo ;
        logInfo =  moment().format('YYYY-MM-DD HH:mm:ss.SSS' + ' ');
    }
    log.info(logInfo + strSql);
    connection.query( strSql , function(err, rows) {
        if (err) {
            cb(err);
            return;
        }
        cb(err, rows);
    });
};
exports.endTransactions = function(connection, cb){
    connection.release();
};
exports.queryDb = function (strSql, logInfo, cb) {
    queryDb(strSql,cb);
};
exports.queryDbStream = function (strSql,cb) {
    queryDbStream(strSql,cb);
};