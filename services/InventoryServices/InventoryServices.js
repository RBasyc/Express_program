const Inventory = require('../../models/InventoryModel/InventoryModel.js');

const inventoryServices = {
    // 获取库存列表
    getList: async (params = {}) => {
        const { page = 1, pageSize = 10, category, status, keyword } = params;

        // 构建查询条件
        const query = {};
        if (category) {
            query.category = category;
        }
        if (status) {
            query.status = status;
        }
        if (keyword) {
            const regex = new RegExp(keyword, 'i');
            query.$or = [
                { name: regex },
                { code: regex },
                { supplier: regex },
                { specification: regex }
            ];
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
    add: async (data, userId) => {
        // 检查耗材编码是否已存在
        const existingItem = await Inventory.findOne({ code: data.code });
        if (existingItem) {
            return { success: false, message: '耗材编码已存在' };
        }

        const item = await Inventory.create({
            ...data,
            createdBy: userId,
            updatedBy: userId
        });

        // 自动更新状态
        item.updateStatus();
        await item.save();

        return { success: true, data: item };
    },

    // 更新耗材
    update: async (id, data, userId) => {
        // 检查耗材是否存在
        const existingItem = await Inventory.findById(id);
        if (!existingItem) {
            return { success: false, message: '耗材不存在' };
        }

        // 如果更新了编码，检查新编码是否已被其他耗材使用
        if (data.code && data.code !== existingItem.code) {
            const codeExists = await Inventory.findOne({ code: data.code, _id: { $ne: id } });
            if (codeExists) {
                return { success: false, message: '耗材编码已存在' };
            }
        }

        const updatedItem = await Inventory.findOneAndUpdate(
            { _id: id },
            {
                ...data,
                updatedBy: userId
            },
            { returnDocument: 'after', new: true }
        ).populate('createdBy', 'nickName realName')
         .populate('updatedBy', 'nickName realName');

        // 更新后会自动触发 pre save 中间件更新状态
        updatedItem.updateStatus();
        await updatedItem.save();

        return { success: true, data: updatedItem };
    },

    // 删除耗材
    delete: async (id) => {
        const item = await Inventory.findById(id);
        if (!item) {
            return { success: false, message: '耗材不存在' };
        }

        await Inventory.findByIdAndDelete(id);
        return { success: true, message: '删除成功' };
    },

    // 搜索耗材
    search: async (keyword) => {
        return await Inventory.searchItems(keyword);
    },

    // 获取预警耗材列表
    getAlertItems: async () => {
        return await Inventory.getAlertItems();
    },

    // 获取单个耗材详情
    getDetail: async (id) => {
        const item = await Inventory.findById(id)
            .populate('createdBy', 'nickName realName')
            .populate('updatedBy', 'nickName realName');
        if (!item) {
            return { success: false, message: '耗材不存在' };
        }
        return { success: true, data: item };
    },

    // 批量更新库存数量
    updateQuantity: async (id, quantity, userId) => {
        const item = await Inventory.findById(id);
        if (!item) {
            return { success: false, message: '耗材不存在' };
        }

        if (quantity < 0) {
            return { success: false, message: '库存数量不能为负数' };
        }

        item.quantity = quantity;
        item.updatedBy = userId;
        item.updateStatus();
        await item.save();

        return { success: true, data: item };
    }
};

module.exports = inventoryServices;
