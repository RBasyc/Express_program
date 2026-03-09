const mongoose = require('mongoose');

/**
 * 出入库流水记录模型
 * 用于记录所有库存变动，支持并发控制和审计追溯
 */
const transactionSchema = new mongoose.Schema({
    // 关联的耗材ID
    inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true,
        index: true
    },

    // 操作类型
    type: {
        type: String,
        required: true,
        enum: ['purchase_in', 'return_in', 'consume_out', 'use_out', 'adjust'],
        comment: '采购入库、归还入库、消耗出库、领用出库、调整'
    },

    // 变更数量（正数为入库，负数为出库）
    quantity: {
        type: Number,
        required: true
    },

    // 变更前数量
    quantityBefore: {
        type: Number,
        required: true
    },

    // 变更后数量
    quantityAfter: {
        type: Number,
        required: true
    },

    // 操作原因/备注
    remark: {
        type: String,
        trim: true,
        maxlength: 500,
        comment: '操作备注说明'
    },

    // 操作用户ID
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // 操作用户名
    userName: {
        type: String,
        required: true,
        trim: true,
        comment: '操作用户名（nickName）'
    },

    // 联系方式（手机号）
    contact: {
        type: String,
        required: true,
        trim: true,
        comment: '操作人联系方式'
    },

    // 操作时间
    operationTime: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
        comment: '操作时间'
    },

    // 实验室
    labName: {
        type: String,
        required: true,
        index: true
    }
}, {
    collection: 'transactions'
});

// 索引优化
transactionSchema.index({ inventoryId: 1, operationTime: -1 });
transactionSchema.index({ operator: 1, operationTime: -1 });
transactionSchema.index({ type: 1, operationTime: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
