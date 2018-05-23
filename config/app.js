exports.app ={
    "sitePort": 3000,
    "table": {
        "create":"CREATE TABLE if not exists `tb_user_relation` ( " +
        " `id` int(11) NOT NULL AUTO_INCREMENT,`user_id` int(11) NOT NULL,`father_id` int(11) NOT NULL,`create_time` datetime DEFAULT NULL, " +
        " PRIMARY KEY (`id`), KEY `father` (`father_id`) " +
        " ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;",
        "drop": ""
    }
};