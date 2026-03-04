const labServices = require('../../services/LabServices/LabServices.js');

const LabController = {
    // 获取所有实验室列表
    getList: async (req, res) => {
        const result = await labServices.getList();
        if (result.success) {
            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } else {
            res.status(400).send({
                errCode: '-1',
                errorInfo: result.message,
                data: null
            });
        }
    },

    // 获取实验室详情
    getDetail: async (req, res) => {
        const { labName } = req.params;
        const result = await labServices.getDetail(labName);
        if (result.success) {
            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } else {
            res.status(404).send({
                errCode: '-1',
                errorInfo: result.message,
                data: null
            });
        }
    },

    // 创建实验室
    create: async (req, res) => {
        const result = await labServices.create(req.body);
        if (result.success) {
            res.status(201).send({
                errCode: '0',
                errorInfo: result.message,
                data: result.data
            });
        } else {
            res.status(400).send({
                errCode: '-1',
                errorInfo: result.message,
                data: null
            });
        }
    },

    // 更新实验室信息
    update: async (req, res) => {
        const { labName } = req.params;
        const result = await labServices.update(labName, req.body);
        if (result.success) {
            res.status(200).send({
                errCode: '0',
                errorInfo: result.message,
                data: result.data
            });
        } else {
            res.status(400).send({
                errCode: '-1',
                errorInfo: result.message,
                data: null
            });
        }
    },

    // 删除实验室
    delete: async (req, res) => {
        const { labName } = req.params;
        const result = await labServices.delete(labName);
        if (result.success) {
            res.status(200).send({
                errCode: '0',
                errorInfo: result.message,
                data: null
            });
        } else {
            res.status(400).send({
                errCode: '-1',
                errorInfo: result.message,
                data: null
            });
        }
    },

    // 搜索实验室
    search: async (req, res) => {
        const { keyword } = req.query;
        const result = await labServices.search(keyword);
        if (result.success) {
            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } else {
            res.status(400).send({
                errCode: '-1',
                errorInfo: result.message,
                data: null
            });
        }
    }
};

module.exports = LabController;
