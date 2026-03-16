const express = require('express');
const ExperimentPlanRouter = express.Router();
const ExperimentPlanController = require('../../controller/ExperimentPlanController/ExperimentPlanController.js');

// 获取实验计划列表（分页、筛选）
ExperimentPlanRouter.get('/list', ExperimentPlanController.list);

// 获取实验计划统计数据
ExperimentPlanRouter.get('/statistics', ExperimentPlanController.getStatistics);

// 获取实验计划详情
ExperimentPlanRouter.get('/detail/:id', ExperimentPlanController.getDetail);

// 创建实验计划
ExperimentPlanRouter.post('/add', ExperimentPlanController.add);

// 更新实验计划
ExperimentPlanRouter.put('/update/:id', ExperimentPlanController.update);

// 更新实验进度
ExperimentPlanRouter.put('/progress/:id', ExperimentPlanController.updateProgress);

// 删除实验计划
ExperimentPlanRouter.delete('/delete/:id', ExperimentPlanController.delete);

module.exports = ExperimentPlanRouter;
