const inventoryServices = require('../../services/InventoryServices/InventoryServices.js');
const JWT = require('../../utils/JWT');

const InventoryController = {
    // 获取库存列表
    list: async (req, res) => {
        try {
            const { page, pageSize, category, status, keyword } = req.query;
            const result = await inventoryServices.getList({
                page,
                pageSize,
                category,
                status,
                keyword
            });

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取库存列表失败'
            });
        }
    },

    // 添加耗材
    add: async (req, res) => {
        try {
            // 从token中获取用户信息
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;

            const { name, code, category, specification, unit, quantity, minQuantity, maxQuantity, price, supplier, purchaseDate, expiryDate, location, remarks } = req.body;

            // 验证必填字段
            if (!name || !code || !category || !unit || !price) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '耗材名称、编码、分类、单位和单价为必填项'
                });
            }

            const result = await inventoryServices.add({
                name,
                code,
                category,
                specification,
                unit,
                quantity: quantity || 0,
                minQuantity: minQuantity || 10,
                maxQuantity,
                price,
                supplier,
                purchaseDate: purchaseDate || new Date(),
                expiryDate,
                location,
                remarks
            }, userId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: '添加成功',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '添加耗材失败'
            });
        }
    },

    // 更新耗材
    update: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;

            const { id } = req.params;
            const data = req.body;

            const result = await inventoryServices.update(id, data, userId);

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
                errorInfo: error.message || '更新耗材失败'
            });
        }
    },

    // 删除耗材
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await inventoryServices.delete(id);

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
                errorInfo: error.message || '删除耗材失败'
            });
        }
    },

    // 搜索耗材
    search: async (req, res) => {
        try {
            const { keyword } = req.query;

            if (!keyword) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '请输入搜索关键词'
                });
            }

            const items = await inventoryServices.search(keyword);

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: {
                    items,
                    total: items.length
                }
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '搜索耗材失败'
            });
        }
    },

    // 获取预警耗材列表
    getAlertItems: async (req, res) => {
        try {
            const items = await inventoryServices.getAlertItems();

            // 按预警类型分组
            const alertGroups = {
                expired: items.filter(item => item.status === 'expired'),
                expiring_soon: items.filter(item => item.status === 'expiring_soon'),
                out_of_stock: items.filter(item => item.status === 'out_of_stock'),
                low_stock: items.filter(item => item.status === 'low_stock')
            };

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: {
                    items,
                    total: items.length,
                    alertGroups,
                    summary: {
                        expired: alertGroups.expired.length,
                        expiring_soon: alertGroups.expiring_soon.length,
                        out_of_stock: alertGroups.out_of_stock.length,
                        low_stock: alertGroups.low_stock.length
                    }
                }
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取预警耗材失败'
            });
        }
    },

    // 获取耗材详情
    getDetail: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await inventoryServices.getDetail(id);

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
                errorInfo: error.message || '获取耗材详情失败'
            });
        }
    },

    // 更新库存数量
    updateQuantity: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;

            const { id } = req.params;
            const { quantity } = req.body;

            if (typeof quantity !== 'number') {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '库存数量必须是数字'
                });
            }

            const result = await inventoryServices.updateQuantity(id, quantity, userId);

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
                errorInfo: error.message || '更新库存数量失败'
            });
        }
    },

    // 获取统计数据
    getStatistics: async (req, res) => {
        try {
            const statistics = await inventoryServices.getStatistics();

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

module.exports = InventoryController;
