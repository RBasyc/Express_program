const mongoose = require('mongoose');

/**
 * 共享需求模型
 * 用于管理实验室间的耗材需求与共享
 */
const shareRequestSchema = new mongoose.Schema({
    // 需求标题
    title: {
        type: String,
        required: [true, '需求标题不能为空'],
        trim: true,
        maxlength: [100, '需求标题最多100个字符']
    },

    // 需求描述
    description: {
        type: String,
        required: [true, '需求描述不能为空'],
        trim: true,
        maxlength: [500, '描述最多500个字符']
    },

    // 耗材名称
    itemName: {
        type: String,
        required: [true, '耗材名称不能为空'],
        trim: true,
        maxlength: [100, '耗材名称最多100个字符']
    },

    // 需求数量
    quantity: {
        type: String,
        required: [true, '需求数量不能为空'],
        trim: true,
        maxlength: [20, '数量最多20个字符']
    },

    // 期望时间
    expectedTime: {
        type: String,
        required: [true, '期望时间不能为空'],
        trim: true,
        maxlength: [50, '期望时间最多50个字符'],
        comment: '如：3天内、1周内等'
    },

    // 需求状态
    status: {
        type: String,
        enum: {
            values: ['urgent', 'normal', 'completed', 'cancelled'],
            message: '状态只能是 urgent, normal, completed 或 cancelled'
        },
        default: 'normal',
        comment: 'urgent:紧急, normal:普通, completed:已完成, cancelled:已取消'
    },

    // 需求类型
    requestType: {
        type: String,
        enum: {
            values: ['request', 'share'],
            message: '类型只能是 request 或 share'
        },
        default: 'request',
        comment: 'request:寻求帮助, share:提供共享'
    },

    // 所属实验室（发布者实验室）
    labName: {
        type: String,
        required: [true, '实验室名称不能为空'],
        trim: true,
        maxlength: [100, '实验室名称最多100个字符'],
        index: true,
        comment: '发布者所属实验室名称'
    },

    // 发布用户
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        comment: '发布需求的用户ID'
    },

    // 发布用户名（冗余字段，提高查询性能）
    publisherName: {
        type: String,
        required: true,
        trim: true,
        comment: '发布用户名（nickName或realName）'
    },

    // 联系方式（冗余字段，用于快速展示）
    contact: {
        type: String,
        required: true,
        trim: true,
        comment: '发布者联系方式（手机号或邮箱）'
    },

    // 咨询人数统计
    consultCount: {
        type: Number,
        default: 0,
        min: [0, '咨询人数不能为负数'],
        comment: '统计有多少人咨询过此需求'
    },

    // 是否可联系（用于隐私控制）
    allowContact: {
        type: Boolean,
        default: true,
        comment: '是否允许其他人联系'
    }
}, {
    timestamps: true, // 自动管理 createdAt 和 updatedAt
    versionKey: '__v',
    collection: 'share_requests'
});

// 索引优化
shareRequestSchema.index({ labName: 1, createdAt: -1 });
shareRequestSchema.index({ status: 1, createdAt: -1 });
shareRequestSchema.index({ requestType: 1, createdAt: -1 });
shareRequestSchema.index({ publisher: 1, createdAt: -1 });

// 虚拟字段：状态文本
shareRequestSchema.virtual('statusText').get(function() {
    const statusMap = {
        urgent: '紧急',
        normal: '进行中',
        completed: '已完成',
        cancelled: '已取消'
    };
    return statusMap[this.status] || this.status;
});

// 虚拟字段：相对发布时间
shareRequestSchema.virtual('relativeTime').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    // 超过7天显示具体日期
    return this.createdAt.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
    });
});

module.exports = mongoose.model('ShareRequest', shareRequestSchema);
