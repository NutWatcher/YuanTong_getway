let express = require('express');
let router = express.Router();

let OrderService = require('../service/order');
router.post('/pushOrder', async (req, res) => {
    try {
        console.log("pushOrder");
        /** @namespace req.body.orderList */
        let orderList = JSON.parse(req.body.orderList);
        console.log(orderList);
        /** @namespace req.body.orderUUID */
        let orderUUID = req.body.orderUUID || "UUID";
        console.log("orderUUID " + orderUUID);
        let resAdd = await OrderService.add(orderList);
        if (resAdd.success === true){
            return res.json({
                code: 1001,
                msg: '加入队列成功!',
                result: {}
            });
        }
        else {
            return res.json({
                code: 4004,
                msg: '出错了..加入队列失败！' + res.msg,
                result: {}
            });
        }
    }
    catch (e) {
        console.log(e.stack);
        return res.json({
            code: 4004,
            msg: '出错了..重新生成物流失败！' + e.toString(),
            result: {}
        });
    } finally {
    }
});
router.post('/pullOrder', async (req, res) => {
    try {
        console.log("pullOrder");
        let infoList = OrderService.getState(req.body.orderList) ;
        let infoSet = new Set();
        let resList = [];
        for (let i = 0 ; i < infoList.length; i ++){
            if (infoSet.has(infoList[i].dingdanhao)){
                continue ;
            }
            infoSet.add(infoList[i].dingdanhao);
            resList.push({
                dingdanhao: infoList[i].dingdanhao,
                state: infoList[i].state
            })
        }
        return res.json({
            code: 1001,
            msg: '获取成功！',
            result: resList
        });
    }
    catch (e) {
        console.log(e.stack);
        return res.json({
            code: 4004,
            msg: '出错了..获取订单信息出错！' + e.toString(),
            result: []
        });
    } finally {
    }
});
module.exports = router;