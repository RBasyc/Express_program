const shareRequestServices = require('../../services/ShareRequestServices/ShareRequestServices.js');
const JWT = require('../../utils/JWT');

const ShareRequestController = {
    // 获取共享需求列表
    list: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const { page, pageSize, status, requestType, keyword } = req.query;
            const result = await shareRequestServices.getList({
                page,
                pageSize,
                status,
                requestType,
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
                errorInfo: error.message || '获取共享需求列表失败'
            });
        }
    },

    // 获取我的共享列表
    getMyShares: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labName = payload?.labName;

            const result = await shareRequestServices.getMyShares(userId, labName);

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取我的共享列表失败'
            });
        }
    },

    // 获取共享需求详情
    getDetail: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);

            const { id } = req.params;
            const result = await shareRequestServices.getDetail(id);

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
                errorInfo: error.message || '获取共享需求详情失败'
            });
        }
    },

    // 发布共享需求
    add: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labName = payload?.labName;

            const { title, description, itemName, quantity, expectedTime, requestType, allowContact } = req.body;

            // 验证必填字段
            if (!title || !description || !itemName || !quantity || !expectedTime) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '标题、描述、耗材名称、数量和期望时间为必填项'
                });
            }

            const result = await shareRequestServices.add({
                title,
                description,
                itemName,
                quantity,
                expectedTime,
                requestType: requestType || 'request',
                allowContact: allowContact !== false
            }, userId, labName);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: '发布成功',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '发布共享需求失败'
            });
        }
    },

    // 更新共享需求
    update: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labName = payload?.labName;

            const { id } = req.params;
            const data = req.body;

            const result = await shareRequestServices.update(id, data, userId, labName);

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
                errorInfo: error.message || '更新共享需求失败'
            });
        }
    },

    // 删除共享需求
    delete: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labName = payload?.labName;

            const { id } = req.params;

            const result = await shareRequestServices.delete(id, userId, labName);

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
                errorInfo: error.message || '删除共享需求失败'
            });
        }
    },

    // 咨询共享需求（增加计数）
    consult: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;

            const { id } = req.params;

            const result = await shareRequestServices.consult(id, userId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: '记录成功',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '记录咨询失败'
            });
        }
    },

    // 获取发布者联系方式
    getContact: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);

            const { id } = req.params;

            const result = await shareRequestServices.getContact(id);

            if (!result.success) {
                return res.status(400).send({
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
                errorInfo: error.message || '获取联系方式失败'
            });
        }
    }
};

module.exports = ShareRequestController;
