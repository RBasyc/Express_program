const statisticsServices = require('../../services/StatisticsServices/StatisticsServices.js');
const JWT = require('../../utils/JWT');

const StatisticsController = {
    // 获取概览指标
    getOverview: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const result = await statisticsServices.getOverviewMetrics(labName);

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取概览数据失败'
            });
        }
    },

    // 获取分类统计
    getCategoryBreakdown: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const result = await statisticsServices.getCategoryBreakdown(labName);

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取分类统计失败'
            });
        }
    },

    // 获取趋势数据
    getTrend: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;
            const { days = 30 } = req.query;

            const result = await statisticsServices.getTrendData(labName, parseInt(days));

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取趋势数据失败'
            });
        }
    },

    // 获取交易汇总
    getTransactionSummary: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const result = await statisticsServices.getTransactionSummary(labName);

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取交易汇总失败'
            });
        }
    },

    // 获取Top消耗品
    getTopConsumed: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;
            const { limit = 10 } = req.query;

            const result = await statisticsServices.getTopConsumedItems(labName, parseInt(limit));

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取消耗排行失败'
            });
        }
    }
};

module.exports = StatisticsController;
