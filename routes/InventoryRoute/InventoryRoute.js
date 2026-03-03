const express = require('express');
const InventoryRouter = express.Router();
const InventoryController = require('../../controller/InventoryController/InventoryController.js');

// 获取库存列表 (支持分页、分类筛选、状态筛选、关键词搜索)
InventoryRouter.get('/list', InventoryController.list);

// 搜索耗材
InventoryRouter.get('/search', InventoryController.search);

// 获取预警耗材列表 (过期、低库存等)
InventoryRouter.get('/alerts', InventoryController.getAlertItems);

// 获取耗材详情
InventoryRouter.get('/detail/:id', InventoryController.getDetail);

// 获取统计数据
InventoryRouter.get('/statistics', InventoryController.getStatistics);

// 添加耗材
InventoryRouter.post('/add', InventoryController.add);

// 更新耗材
InventoryRouter.put('/update/:id', InventoryController.update);

// 更新库存数量
InventoryRouter.put('/quantity/:id', InventoryController.updateQuantity);

// 删除耗材
InventoryRouter.delete('/delete/:id', InventoryController.delete);

module.exports = InventoryRouter;
