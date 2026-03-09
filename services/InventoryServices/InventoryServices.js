const { Inventory, User } = require('../../models/index.js');
const Transaction = require('../../models/TransactionModel/TransactionModel.js');

const inventoryServices = {
    // 获取库存列表
    getList: async (params = {}, labName) => {
        const { page = 1, pageSize = 10, category, status, keyword } = params;

        // 构建查询条件
        const query = {};
        if (category && category !== 'undefined' && category !== '') {
            query.category = category;
        }
        if (status && status !== 'undefined' && status !== '') {
            query.status = status;
        }
        if (keyword && keyword !== 'undefined' && keyword !== '') {
            const regex = new RegExp(keyword, 'i');
            query.$or = [
                { name: regex },
                { code: regex },
                { supplier: regex },
                { specification: regex }
            ];
        }
        // 添加实验室过滤
        if (labName) {
            query.labName = labName;
        }

        // 计算分页
        const skip = (page - 1) * pageSize;
        const limit = parseInt(pageSize);

        // 执行查询
        const [total, items] = await Promise.all([
            Inventory.countDocuments(query),
            Inventory.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'nickName realName')
                .populate('updatedBy', 'nickName realName')
        ]);

        return {
            total,
            items,
            page: parseInt(page),
            pageSize: limit,
            totalPages: Math.ceil(total / limit)
        };
    },

    // 添加耗材
    add: async (data, userId, labName) => {
        const item = await Inventory.create({
            ...data,
            labName: labName,
            createdBy: userId,
            updatedBy: userId
        });

        // 自动更新状态
        item.updateStatus();
        await item.save();

        return { success: true, data: item };
    },

    // 更新耗材
    update: async (id, data, userId, labName) => {
        // 检查耗材是否存在
        const existingItem = await Inventory.findById(id);
        if (!existingItem) {
            return { success: false, message: '耗材不存在' };
        }

        // 验证实验室权限
        if (existingItem.labName !== labName) {
            return { success: false, message: '无权修改其他实验室的耗材' };
        }

        const updatedItem = await Inventory.findOneAndUpdate(
            { _id: id },
            {
                ...data,
                updatedBy: userId
            },
            { returnDocument: 'after' }
        ).populate('createdBy', 'nickName realName')
            .populate('updatedBy', 'nickName realName');

        // 更新后会自动触发 pre save 中间件更新状态
        updatedItem.updateStatus();
        await updatedItem.save();

        return { success: true, data: updatedItem };
    },

    // 删除耗材
    delete: async (id, labName) => {
        const item = await Inventory.findById(id);
        if (!item) {
            return { success: false, message: '耗材不存在' };
        }

        // 验证实验室权限
        if (item.labName !== labName) {
            return { success: false, message: '无权删除其他实验室的耗材' };
        }

        await Inventory.findByIdAndDelete(id);
        return { success: true, message: '删除成功' };
    },

    // 搜索耗材
    search: async (keyword, labName) => {
        const regex = new RegExp(keyword, 'i');
        const query = {
            $or: [
                { name: regex },
                { code: regex },
                { category: regex },
                { supplier: regex },
                { specification: regex }
            ]
        };
        if (labName) {
            query.labName = labName;
        }
        return await Inventory.find(query).sort({ createdAt: -1 });
    },

    // 扫码查询耗材（根据编号查询第一条匹配的记录）
    getByCode: async (code, labName) => {
        const query = { code: code.toUpperCase() };
        if (labName) {
            query.labName = labName;
        }
        const item = await Inventory.findOne(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'nickName realName')
            .populate('updatedBy', 'nickName realName');
        return item;
    },

    // 获取预警耗材列表
    getAlertItems: async (labName) => {
        const query = {
            $or: [
                { status: 'low_stock' },
                { status: 'expiring_soon' },
                { status: 'expired' },
                { status: 'out_of_stock' }
            ]
        };
        if (labName) {
            query.labName = labName;
        }
        return await Inventory.find(query).sort({ status: 1, expiryDate: 1 });
    },

    // 获取单个耗材详情
    getDetail: async (id, labName) => {
        const item = await Inventory.findById(id)
            .populate('createdBy', 'nickName realName')
            .populate('updatedBy', 'nickName realName');
        if (!item) {
            return { success: false, message: '耗材不存在' };
        }
        // 验证实验室权限
        if (item.labName !== labName) {
            return { success: false, message: '无权查看其他实验室的耗材' };
        }
        return { success: true, data: item };
    },

    // 批量更新库存数量（支持增加/减少操作，并创建流水记录）
    updateQuantity: async (id, quantity, operation, userId, labName) => {
        const item = await Inventory.findById(id);
        if (!item) {
            return { success: false, message: '耗材不存在' };
        }

        // 验证实验室权限
        if (item.labName !== labName) {
            return { success: false, message: '无权修改其他实验室的耗材' };
        }

        if (quantity <= 0) {
            return { success: false, message: '操作数量必须大于0' };
        }

        // 获取用户信息（用户名和联系方式）
        const user = await User.findById(userId);
        if (!user) {
            return { success: false, message: '用户不存在' };
        }

        const userName = user.nickName || user.realName || '未知用户';
        const contact = user.phone || user.email || '未提供联系方式';

        // 获取当前库存
        const quantityBefore = item.quantity;
        let quantityAfter = quantityBefore;
        let transactionQuantity = quantity;
        let transactionType = '';

        // 根据操作类型计算库存变化
        if (operation === 'add') {
            // 归还入库
            quantityAfter = quantityBefore + quantity;
            transactionType = 'return_in';
        } else if (operation === 'subtract') {
            // 消耗出库
            if (quantityBefore < quantity) {
                return { success: false, message: `库存不足：当前库存 ${quantityBefore}，需要 ${quantity}` };
            }
            quantityAfter = quantityBefore - quantity;
            transactionType = 'consume_out';
            transactionQuantity = -quantity;
        }

        // 使用 MongoDB 原子操作更新库存
        const updatedItem = await Inventory.findOneAndUpdate(
            { _id: id },
            {
                $inc: { quantity: transactionQuantity },
                updatedBy: userId
            },
            { returnDocument: 'after' }
        ).populate('createdBy', 'nickName realName')
          .populate('updatedBy', 'nickName realName');

        // 创建流水记录（包含用户名和联系方式）
        await Transaction.create({
            inventoryId: id,
            type: transactionType,
            quantity: transactionQuantity,
            quantityBefore,
            quantityAfter: updatedItem.quantity,
            operator: userId,
            userName,
            contact,
            operationTime: new Date(),
            labName
        });

        return { success: true, data: updatedItem };
    },

    // 获取统计数据
    getStatistics: async (labName) => {
        const categories = ['试剂', '耗材', '仪器', '其他'];

        // 构建基础查询条件
        const baseQuery = labName ? { labName } : {};

        // 并行查询总数和各分类数量
        const [totalCount, ...categoryCounts] = await Promise.all([
            Inventory.countDocuments(baseQuery),
            ...categories.map(cat => Inventory.countDocuments({ ...baseQuery, category: cat }))
        ]);

        // 组装分类统计数据
        const categoryStats = {};
        categories.forEach((cat, index) => {
            categoryStats[cat] = categoryCounts[index];
        });

        return {
            total: totalCount,
            categories: categoryStats
        };
    }
};

module.exports = inventoryServices;
