const { Inventory, Transaction } = require('../../models/index.js');

const statisticsServices = {
    // 获取概览指标
    getOverviewMetrics: async (labName) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const baseQuery = labName ? { labName } : {};

        const [
            totalItems,
            totalValue,
            alertCount,
            monthlyOperations
        ] = await Promise.all([
            // 总物品数
            Inventory.countDocuments(baseQuery),

            // 总库存价值
            Inventory.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: { $multiply: ['$quantity', '$price'] }
                        }
                    }
                }
            ]),

            // 预警数量
            Inventory.countDocuments({
                ...baseQuery,
                status: { $in: ['low_stock', 'expired', 'expiring_soon', 'out_of_stock'] }
            }),

            // 本月操作数
            Transaction.countDocuments({
                ...baseQuery,
                operationTime: { $gte: startOfMonth }
            })
        ]);

        return {
            totalItems,
            totalValue: totalValue[0]?.total || 0,
            alertCount,
            monthlyOperations
        };
    },

    // 获取分类统计
    getCategoryBreakdown: async (labName) => {
        const categories = ['试剂', '耗材', '仪器', '其他'];

        const categoryStats = await Inventory.aggregate([
            { $match: labName ? { labName } : {} },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalValue: {
                        $sum: { $multiply: ['$quantity', '$price'] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 确保所有分类都存在
        const result = {};
        categories.forEach(cat => {
            const found = categoryStats.find(s => s._id === cat);
            result[cat] = {
                count: found?.count || 0,
                totalValue: found?.totalValue || 0
            };
        });

        return result;
    },

    // 获取趋势数据（最近N天）
    getTrendData: async (labName, days = 30) => {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // 生成日期数组
        const dates = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            dates.push(dateStr);
        }

        const trendData = await Transaction.aggregate([
            {
                $match: {
                    ...(labName ? { labName } : {}),
                    operationTime: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: { format: '%Y-%m-%d', date: '$operationTime' }
                        },
                        type: {
                            $cond: [
                                { $in: ['$type', ['purchase_in', 'return_in']] },
                                'in',
                                'out'
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.date',
                    operations: {
                        $push: {
                            type: '$_id.type',
                            count: '$count'
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 格式化结果供前端使用
        return dates.map(date => {
            const dayData = trendData.find(t => t._id === date);
            return {
                date,
                in: dayData?.operations.find(o => o.type === 'in')?.count || 0,
                out: dayData?.operations.find(o => o.type === 'out')?.count || 0
            };
        });
    },

    // 获取交易汇总（本周）
    getTransactionSummary: async (labName) => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0是周日，1是周一...
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // 回退到周一
        startOfWeek.setHours(0, 0, 0, 0);

        const transactionTypes = ['purchase_in', 'return_in', 'consume_out', 'use_out', 'adjust'];

        const summary = await Transaction.aggregate([
            {
                $match: {
                    ...(labName ? { labName } : {}),
                    operationTime: { $gte: startOfWeek }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: { $abs: '$quantity' } }
                }
            }
        ]);

        const result = {};
        transactionTypes.forEach(type => {
            const found = summary.find(s => s._id === type);
            result[type] = {
                count: found?.count || 0,
                totalQuantity: found?.totalQuantity || 0
            };
        });

        return result;
    },

    // 获取Top消耗品（本月）
    getTopConsumedItems: async (labName, limit = 10) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const topItems = await Transaction.aggregate([
            {
                $match: {
                    ...(labName ? { labName } : {}),
                    operationTime: { $gte: startOfMonth },
                    type: { $in: ['consume_out', 'use_out'] }
                }
            },
            {
                $group: {
                    _id: '$inventoryId',
                    totalConsumed: { $sum: { $abs: '$quantity' } },
                    operationCount: { $sum: 1 }
                }
            },
            { $sort: { totalConsumed: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'inventory',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'item'
                }
            },
            {
                $project: {
                    inventoryId: '$_id',
                    name: { $arrayElemAt: ['$item.name', 0] },
                    code: { $arrayElemAt: ['$item.code', 0] },
                    category: { $arrayElemAt: ['$item.category', 0] },
                    unit: { $arrayElemAt: ['$item.unit', 0] },
                    totalConsumed: 1,
                    operationCount: 1
                }
            }
        ]);

        return topItems;
    }
};

module.exports = statisticsServices;
