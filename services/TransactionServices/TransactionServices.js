const { Inventory, User } = require('../../models/index.js');
const Transaction = require('../../models/TransactionModel/TransactionModel.js');

/**
 * 出入库业务服务
 * 使用原子操作保证并发安全
 */
const transactionServices = {
    /**
     * 入库操作（采购入库、归还入库）
     * @param {Object} data - 入库数据
     * @param {String} data.inventoryId - 耗材ID
     * @param {String} data.type - 入库类型: purchase_in(采购入库), return_in(归还入库)
     * @param {Number} data.quantity - 入库数量（必须大于0）
     * @param {String} data.remark - 备注
     * @param {String} data.operator - 操作人ID
     * @param {String} data.labName - 实验室名称
     */
    stockIn: async function(data) {
        const { inventoryId, type, quantity, remark, operator, labName } = data;

        // 参数验证
        if (!inventoryId || !type || !quantity || !operator || !labName) {
            throw new Error('缺少必填参数');
        }

        if (quantity <= 0) {
            throw new Error('入库数量必须大于0');
        }

        if (!['purchase_in', 'return_in'].includes(type)) {
            throw new Error('无效的入库类型');
        }

        // 获取当前库存
        const currentInventory = await Inventory.findById(inventoryId);
        if (!currentInventory) {
            throw new Error('耗材不存在');
        }

        // 验证实验室权限
        if (currentInventory.labName !== labName) {
            throw new Error('无权操作其他实验室的耗材');
        }

        // 获取用户信息（用户名和联系方式）
        const user = await User.findById(operator);
        const userName = user?.nickName || user?.realName || '未知用户';
        const contact = user?.phone || user?.email || '未提供联系方式';

        // 使用 MongoDB 原子操作 $inc 更新库存（并发安全）
        const updatedInventory = await Inventory.findOneAndUpdate(
            { _id: inventoryId },
            {
                $inc: { quantity: quantity }
            },
            { returnDocument: 'after' }
        ).populate('createdBy', 'nickName realName')
          .populate('updatedBy', 'nickName realName');

        // 记录流水
        const transaction = await Transaction.create({
            inventoryId,
            type,
            quantity,
            quantityBefore: currentInventory.quantity,
            quantityAfter: updatedInventory.quantity,
            remark,
            operator,
            userName,
            contact,
            operationTime: new Date(),
            labName
        });

        return {
            success: true,
            data: {
                inventory: updatedInventory,
                transaction
            }
        };
    },

    /**
     * 出库操作（消耗出库、领用出库）
     * @param {Object} data - 出库数据
     * @param {String} data.inventoryId - 耗材ID
     * @param {String} data.type - 出库类型: consume_out(消耗出库), use_out(领用出库)
     * @param {Number} data.quantity - 出库数量（必须大于0）
     * @param {String} data.remark - 备注
     * @param {String} data.operator - 操作人ID
     * @param {String} data.labName - 实验室名称
     */
    stockOut: async function(data) {
        const { inventoryId, type, quantity, remark, operator, labName } = data;

        // 参数验证
        if (!inventoryId || !type || !quantity || !operator || !labName) {
            throw new Error('缺少必填参数');
        }

        if (quantity <= 0) {
            throw new Error('出库数量必须大于0');
        }

        if (!['consume_out', 'use_out'].includes(type)) {
            throw new Error('无效的出库类型');
        }

        // 获取当前库存
        const currentInventory = await Inventory.findById(inventoryId);
        if (!currentInventory) {
            throw new Error('耗材不存在');
        }

        // 验证实验室权限
        if (currentInventory.labName !== labName) {
            throw new Error('无权操作其他实验室的耗材');
        }

        // 检查库存是否足够
        if (currentInventory.quantity < quantity) {
            throw new Error(`库存不足: 当前库存 ${currentInventory.quantity}, 需要 ${quantity}`);
        }

        // 获取用户信息（用户名和联系方式）
        const user = await User.findById(operator);
        const userName = user?.nickName || user?.realName || '未知用户';
        const contact = user?.phone || user?.email || '未提供联系方式';

        // 使用 MongoDB 原子操作 $inc 减少库存（并发安全）
        const updatedInventory = await Inventory.findOneAndUpdate(
            { _id: inventoryId },
            {
                $inc: { quantity: -quantity }
            },
            { returnDocument: 'after' }
        ).populate('createdBy', 'nickName realName')
          .populate('updatedBy', 'nickName realName');

        // 记录流水
        const transaction = await Transaction.create({
            inventoryId,
            type,
            quantity: -quantity,
            quantityBefore: currentInventory.quantity,
            quantityAfter: updatedInventory.quantity,
            remark,
            operator,
            userName,
            contact,
            operationTime: new Date(),
            labName
        });

        return {
            success: true,
            data: {
                inventory: updatedInventory,
                transaction
            }
        };
    },

    /**
     * 查询流水记录
     * @param {String} inventoryId - 耗材ID（可选）
     * @param {String} labName - 实验室名称
     * @param {Object} options - 查询选项
     * @param {Number} options.page - 页码
     * @param {Number} options.pageSize - 每页数量
     * @param {String} options.type - 操作类型（可选）
     */
    getTransactions: async function(inventoryId, labName, options = {}) {
        const { page = 1, pageSize = 20, type } = options;

        // 构建查询条件
        const query = {};
        if (inventoryId) {
            query.inventoryId = inventoryId;
        }
        if (labName) {
            query.labName = labName;
        }
        if (type) {
            query.type = type;
        }

        // 计算分页
        const skip = (page - 1) * pageSize;
        const limit = parseInt(pageSize);

        // 执行查询
        const [total, transactions] = await Promise.all([
            Transaction.countDocuments(query),
            Transaction.find(query)
                .sort({ operationTime: -1 })
                .skip(skip)
                .limit(limit)
                .populate('inventoryId', 'name code unit')
                .populate('operator', 'nickName realName')
        ]);

        return {
            success: true,
            data: {
                total,
                transactions,
                page: parseInt(page),
                pageSize: limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * 删除流水记录（仅管理员或本人可删除）
     * @param {String} transactionId - 流水记录ID
     * @param {String} userId - 操作人ID
     * @param {String} role - 用户角色
     */
    deleteTransaction: async function(transactionId, userId, role) {
        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            throw new Error('流水记录不存在');
        }

        // 只有管理员或记录创建者可以删除
        if (role !== 'admin' && transaction.operator.toString() !== userId) {
            throw new Error('无权删除他人的流水记录');
        }

        await Transaction.findByIdAndDelete(transactionId);

        return {
            success: true,
            message: '删除成功'
        };
    }
};

module.exports = transactionServices;
