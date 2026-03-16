const express = require('express');
const ShareRequestRouter = express.Router();
const ShareRequestController = require('../../controller/ShareRequestController/ShareRequestController.js');

// 获取共享需求列表（分页、筛选）
ShareRequestRouter.get('/list', ShareRequestController.list);

// 获取我的共享列表
ShareRequestRouter.get('/my-shares', ShareRequestController.getMyShares);

// 获取共享需求详情
ShareRequestRouter.get('/detail/:id', ShareRequestController.getDetail);

// 发布共享需求
ShareRequestRouter.post('/add', ShareRequestController.add);

// 更新共享需求
ShareRequestRouter.put('/update/:id', ShareRequestController.update);

// 删除共享需求
ShareRequestRouter.delete('/delete/:id', ShareRequestController.delete);

// 咨询共享需求（增加计数）
ShareRequestRouter.post('/consult/:id', ShareRequestController.consult);

// 获取发布者联系方式
ShareRequestRouter.get('/contact/:id', ShareRequestController.getContact);

module.exports = ShareRequestRouter;
