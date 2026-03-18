const express = require('express');
const StatisticsRouter = express.Router();
const StatisticsController = require('../../controller/StatisticsController/StatisticsController.js');

// 获取概览指标
StatisticsRouter.get('/overview', StatisticsController.getOverview);

// 获取分类统计
StatisticsRouter.get('/category', StatisticsController.getCategoryBreakdown);

// 获取趋势数据
StatisticsRouter.get('/trend', StatisticsController.getTrend);

// 获取交易汇总
StatisticsRouter.get('/transaction-summary', StatisticsController.getTransactionSummary);

// 获取Top消耗品
StatisticsRouter.get('/top-consumed', StatisticsController.getTopConsumed);

module.exports = StatisticsRouter;
