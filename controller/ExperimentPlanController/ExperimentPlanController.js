const experimentPlanServices = require('../../services/ExperimentPlanServices/ExperimentPlanServices.js');
const JWT = require('../../utils/JWT');

const ExperimentPlanController = {
    // 获取实验计划列表
    list: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const { page, pageSize, status, keyword } = req.query;
            const result = await experimentPlanServices.getList({
                page,
                pageSize,
                status,
                keyword
            }, labName);

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取实验计划列表失败'
            });
        }
    },

    // 获取实验计划详情
    getDetail: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const { id } = req.params;
            const result = await experimentPlanServices.getDetail(id, labName);

            if (!result.success) {
                return res.status(404).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取实验计划详情失败'
            });
        }
    },

    // 创建实验计划
    add: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labName = payload?.labName;

            const { title, experimentDate, description, itemsNeeded, remarks, responsiblePerson } = req.body;

            // 验证必填字段
            if (!title || !experimentDate) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '实验标题和日期为必填项'
                });
            }

            const result = await experimentPlanServices.add({
                title,
                experimentDate,
                description,
                itemsNeeded: itemsNeeded || [],
                remarks,
                responsiblePerson
            }, userId, labName);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: '创建成功',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '创建实验计划失败'
            });
        }
    },

    // 更新实验计划
    update: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labName = payload?.labName;

            const { id } = req.params;
            const data = req.body;

            const result = await experimentPlanServices.update(id, data, userId, labName);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: '更新成功',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '更新实验计划失败'
            });
        }
    },

    // 更新实验进度
    updateProgress: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const { id } = req.params;
            const { progress, status } = req.body;

            if (typeof progress !== 'number' || progress < 0 || progress > 100) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '进度必须在0-100之间'
                });
            }

            const result = await experimentPlanServices.updateProgress(id, progress, status, labName);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: '更新成功',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '更新实验进度失败'
            });
        }
    },

    // 删除实验计划
    delete: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const { id } = req.params;

            const result = await experimentPlanServices.delete(id, labName);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: '删除成功'
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '删除实验计划失败'
            });
        }
    },

    // 获取统计数据
    getStatistics: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const statistics = await experimentPlanServices.getStatistics(labName);

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: statistics
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取统计数据失败'
            });
        }
    }
};

module.exports = ExperimentPlanController;
