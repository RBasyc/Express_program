const transactionServices = require('../../services/TransactionServices/TransactionServices.js');
const JWT = require('../../utils/JWT');

const TransactionController = {
    /**
     * 入库操作
     */
    stockIn: async (req, res) => {
        try {
            // 从 token 获取用户信息
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labName = payload?.labName;
            const role = payload?.role;

            const { inventoryId, type, quantity, remark } = req.body;

            // 参数验证
            if (!inventoryId || !type || !quantity) {
                return res.status(400).json({
                    errCode: '-1',
                    errorInfo: '缺少必填参数：inventoryId, type, quantity'
                });
            }

            if (quantity <= 0) {
                return res.status(400).json({
                    errCode: '-1',
                    errorInfo: '入库数量必须大于0'
                });
            }

            if (!['purchase_in', 'return_in'].includes(type)) {
                return res.status(400).json({
                    errCode: '-1',
                    errorInfo: '入库类型只能是: purchase_in(采购入库) 或 return_in(归还入库)'
                });
            }

            // 调用服务层
            const result = await transactionServices.stockIn({
                inventoryId,
                type,
                quantity,
                remark,
                operator: userId,
                labName
            });

            res.status(200).json({
                errCode: '0',
                errorInfo: '入库成功',
                data: result.data
            });

        } catch (error) {
            res.status(500).json({
                errCode: '-1',
                errorInfo: error.message || '入库失败'
            });
        }
    },

    /**
     * 出库操作
     */
    stockOut: async (req, res) => {
        try {
            // 从 token 获取用户信息
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labName = payload?.labName;

            const { inventoryId, type, quantity, remark } = req.body;

            // 参数验证
            if (!inventoryId || !type || !quantity) {
                return res.status(400).json({
                    errCode: '-1',
                    errorInfo: '缺少必填参数：inventoryId, type, quantity'
                });
            }

            if (quantity <= 0) {
                return res.status(400).json({
                    errCode: '-1',
                    errorInfo: '出库数量必须大于0'
                });
            }

            if (!['consume_out', 'use_out'].includes(type)) {
                return res.status(400).json({
                    errCode: '-1',
                    errorInfo: '出库类型只能是: consume_out(消耗出库) 或 use_out(领用出库)'
                });
            }

            // 调用服务层
            const result = await transactionServices.stockOut({
                inventoryId,
                type,
                quantity,
                remark,
                operator: userId,
                labName
            });

            res.status(200).json({
                errCode: '0',
                errorInfo: '出库成功',
                data: result.data
            });

        } catch (error) {
            // 处理库存不足错误
            if (error.message.includes('库存不足')) {
                return res.status(400).json({
                    errCode: 'INSUFFICIENT_STOCK',
                    errorInfo: error.message
                });
            }

            res.status(500).json({
                errCode: '-1',
                errorInfo: error.message || '出库失败'
            });
        }
    },

    /**
     * 查询流水记录
     */
    getTransactions: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            const { inventoryId, page, pageSize, type } = req.query;

            const result = await transactionServices.getTransactions(
                inventoryId,
                labName,
                { page, pageSize, type }
            );

            res.status(200).json({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });

        } catch (error) {
            res.status(500).json({
                errCode: '-1',
                errorInfo: error.message || '查询流水记录失败'
            });
        }
    },

    /**
     * 删除流水记录
     */
    deleteTransaction: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const role = payload?.role;

            const { id } = req.params;

            const result = await transactionServices.deleteTransaction(id, userId, role);

            res.status(200).json({
                errCode: '0',
                errorInfo: '删除成功'
            });

        } catch (error) {
            res.status(500).json({
                errCode: '-1',
                errorInfo: error.message || '删除失败'
            });
        }
    }
};

module.exports = TransactionController;
