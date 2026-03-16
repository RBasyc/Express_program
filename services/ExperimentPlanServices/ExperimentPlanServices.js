const { ExperimentPlan, User, Inventory } = require('../../models/index.js');

const experimentPlanServices = {
    // 获取实验计划列表
    getList: async (params = {}, labName) => {
        const { page = 1, pageSize = 10, status, keyword } = params;

        // 构建查询条件
        const query = {};
        if (status && status !== 'undefined' && status !== '') {
            query.status = status;
        }
        if (keyword && keyword !== 'undefined' && keyword !== '') {
            const regex = new RegExp(keyword, 'i');
            query.$or = [
                { title: regex },
                { experimentType: regex },
                { description: regex }
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
            ExperimentPlan.countDocuments(query),
            ExperimentPlan.find(query)
                .sort({ experimentDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'nickName realName avatar')
                .populate('itemsNeeded.inventoryId', 'name quantity unit status expiryDate')
        ]);

        return {
            total,
            items,
            page: parseInt(page),
            pageSize: limit,
            totalPages: Math.ceil(total / limit)
        };
    },

    // 获取实验计划详情
    getDetail: async (id, labName) => {
        const plan = await ExperimentPlan.findById(id)
            .populate('createdBy', 'nickName realName avatar phone email')
            .populate('itemsNeeded.inventoryId', 'name quantity unit status expiryDate');

        if (!plan) {
            return { success: false, message: '实验计划不存在' };
        }

        // 验证实验室权限
        if (plan.labName !== labName) {
            return { success: false, message: '无权查看其他实验室的实验计划' };
        }

        return { success: true, data: plan };
    },

    // 创建实验计划
    add: async (data, userId, labName) => {
        const user = await User.findById(userId);
        if (!user) {
            return { success: false, message: '用户不存在' };
        }

        // 如果提供了耗材列表，尝试匹配库存
        const itemsNeeded = await Promise.all((data.itemsNeeded || []).map(async (item) => {
            // 尝试根据耗材名称查找库存
            const inventory = await Inventory.findOne({
                name: item.name,
                labName: labName
            });

            // 如果找到库存，检查库存状态
            let status = 'sufficient';
            if (inventory) {
                item.inventoryId = inventory._id;

                // 判断库存状态
                if (inventory.quantity === 0) {
                    status = 'insufficient';
                } else if (inventory.quantity <= inventory.minQuantity) {
                    status = 'insufficient';
                }

                // 检查是否即将过期
                if (inventory.expiryDate) {
                    const now = new Date();
                    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    if (inventory.expiryDate < now) {
                        status = 'expiring';
                    } else if (inventory.expiryDate < thirtyDaysLater) {
                        status = 'expiring';
                    }
                }
            }

            return {
                ...item,
                status
            };
        }));

        const plan = await ExperimentPlan.create({
            ...data,
            itemsNeeded,
            labName: labName,
            createdBy: userId
        });

        return { success: true, data: plan };
    },

    // 更新实验计划
    update: async (id, data, userId, labName) => {
        // 检查计划是否存在
        const existingPlan = await ExperimentPlan.findById(id);
        if (!existingPlan) {
            return { success: false, message: '实验计划不存在' };
        }

        // 验证实验室权限
        if (existingPlan.labName !== labName) {
            return { success: false, message: '无权修改其他实验室的实验计划' };
        }

        // 如果更新了耗材列表，重新计算库存状态
        if (data.itemsNeeded) {
            const itemsNeeded = await Promise.all(data.itemsNeeded.map(async (item) => {
                const inventory = await Inventory.findOne({
                    name: item.name,
                    labName: labName
                });

                let status = 'sufficient';
                if (inventory) {
                    item.inventoryId = inventory._id;

                    if (inventory.quantity === 0) {
                        status = 'insufficient';
                    } else if (inventory.quantity <= inventory.minQuantity) {
                        status = 'insufficient';
                    }

                    if (inventory.expiryDate) {
                        const now = new Date();
                        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                        if (inventory.expiryDate < now) {
                            status = 'expiring';
                        } else if (inventory.expiryDate < thirtyDaysLater) {
                            status = 'expiring';
                        }
                    }
                }

                return {
                    ...item,
                    status
                };
            }));
            data.itemsNeeded = itemsNeeded;
        }

        const updatedPlan = await ExperimentPlan.findOneAndUpdate(
            { _id: id },
            data,
            { returnDocument: 'after' }
        ).populate('createdBy', 'nickName realName')
         .populate('itemsNeeded.inventoryId', 'name quantity unit status');

        return { success: true, data: updatedPlan };
    },

    // 更新实验进度
    updateProgress: async (id, progress, status, labName) => {
        const plan = await ExperimentPlan.findById(id);
        if (!plan) {
            return { success: false, message: '实验计划不存在' };
        }

        // 验证实验室权限
        if (plan.labName !== labName) {
            return { success: false, message: '无权修改其他实验室的实验计划' };
        }

        // 自动更新状态
        let newStatus = plan.status;
        if (progress === 0) {
            newStatus = 'pending';
        } else if (progress === 100) {
            newStatus = 'completed';
        } else if (progress > 0 && progress < 100) {
            newStatus = 'ongoing';
        }

        // 如果手动指定了状态，使用手动指定的状态
        if (status) {
            newStatus = status;
        }

        const updatedPlan = await ExperimentPlan.findOneAndUpdate(
            { _id: id },
            { progress: progress, status: newStatus },
            { returnDocument: 'after' }
        );

        return { success: true, data: updatedPlan };
    },

    // 删除实验计划
    delete: async (id, labName) => {
        const plan = await ExperimentPlan.findById(id);
        if (!plan) {
            return { success: false, message: '实验计划不存在' };
        }

        // 验证实验室权限
        if (plan.labName !== labName) {
            return { success: false, message: '无权删除其他实验室的实验计划' };
        }

        await ExperimentPlan.findByIdAndDelete(id);
        return { success: true, message: '删除成功' };
    },

    // 获取统计数据
    getStatistics: async (labName) => {
        const query = labName ? { labName } : {};

        const [totalCount, ...statusCounts] = await Promise.all([
            ExperimentPlan.countDocuments(query),
            ExperimentPlan.countDocuments({ ...query, status: 'pending' }),
            ExperimentPlan.countDocuments({ ...query, status: 'ongoing' }),
            ExperimentPlan.countDocuments({ ...query, status: 'completed' })
        ]);

        // 获取即将开始的实验（未来3天内）
        const now = new Date();
        const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const upcomingPlans = await ExperimentPlan.find({
            ...query,
            experimentDate: { $gte: now, $lte: threeDaysLater },
            status: { $in: ['pending', 'ongoing'] }
        }).sort({ experimentDate: 1 }).limit(5);

        return {
            total: totalCount,
            pending: statusCounts[0],
            ongoing: statusCounts[1],
            completed: statusCounts[2],
            upcoming: upcomingPlans.length
        };
    }
};

module.exports = experimentPlanServices;
