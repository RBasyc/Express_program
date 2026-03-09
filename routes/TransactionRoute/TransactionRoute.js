const express = require('express');
const TransactionRouter = express.Router();
const TransactionController = require('../../controller/TransactionController/TransactionController.js');

/**
 * 出入库操作路由
 */

// 入库操作（采购入库、归还入库）
TransactionRouter.post('/stock-in', TransactionController.stockIn);

// 出库操作（消耗出库、领用出库）
TransactionRouter.post('/stock-out', TransactionController.stockOut);

// 查询流水记录（支持分页、类型筛选）
TransactionRouter.get('/records', TransactionController.getTransactions);

// 删除流水记录
TransactionRouter.delete('/records/:id', TransactionController.deleteTransaction);

module.exports = TransactionRouter;
