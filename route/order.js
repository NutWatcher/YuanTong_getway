var express = require('express');
var router = express.Router();
router.post('/pushOrder', async (req, res, next) => {
    try {
        console.log("pushOrder");
    }
    catch (e) {
        console.log(e.stack);
        return res.json({
            code: 4004,
            msg: '出错了..重新生成物流失败！' + e.toString(),
            result: []
        });
    } finally {
    }
});
router.post('/pullOrder', async (req, res, next) => {
    try {
        console.log("pullOrder");
    }
    catch (e) {
        console.log(e.stack);
        return res.json({
            code: 4004,
            msg: '出错了..重新生成物流失败！' + e.toString(),
            result: []
        });
    } finally {
    }
});
