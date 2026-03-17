const mongoose = require('mongoose');

/**
 * 实验计划模型
 * 用于管理实验室的实验计划，关联耗材需求和库存状态
 */
const experimentPlanSchema = new mongoose.Schema({
    // 计划标题
    title: {
        type: String,
        required: [true, '实验标题不能为空'],
        trim: true,
        maxlength: [100, '实验标题最多100个字符']
    },

    // 实验日期
    experimentDate: {
        type: Date,
        required: [true, '实验日期不能为空'],
        comment: '计划进行的实验日期'
    },

    // 实验状态
    status: {
        type: String,
        enum: {
            values: ['pending', 'ongoing', 'completed'],
            message: '状态只能是 pending, ongoing 或 completed'
        },
        default: 'pending',
        comment: 'pending:待开始, ongoing:进行中, completed:已完成'
    },

    // 进度百分比 (0-100)
    progress: {
        type: Number,
        min: [0, '进度不能小于0'],
        max: [100, '进度不能大于100'],
        default: 0,
        comment: '实验完成进度百分比'
    },

    // 所需耗材列表
    itemsNeeded: [{
        // 耗材名称
        name: {
            type: String,
            required: true,
            trim: true
        },
        // 需求数量
        quantity: {
            type: String,
            required: true,
            trim: true
        },
        // 库存状态
        status: {
            type: String,
            enum: ['sufficient', 'insufficient', 'expiring'],
            default: 'sufficient',
            comment: 'sufficient:充足, insufficient:不足, expiring:即将过期'
        },
        // 关联的库存ID（可选，用于实时查询库存）
        inventoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            comment: '关联的库存项ID'
        }
    }],

    // 实验描述
    description: {
        type: String,
        trim: true,
        maxlength: [500, '描述最多500个字符']
    },

    // 实验备注
    remarks: {
        type: String,
        trim: true,
        maxlength: [500, '备注最多500个字符']
    },

    // 所属实验室（数据隔离关键字段）
    labName: {
        type: String,
        required: [true, '实验室名称不能为空'],
        trim: true,
        maxlength: [100, '实验室名称最多100个字符'],
        index: true,
        comment: '所属实验室名称（必填，用于数据隔离）'
    },

    // 创建用户
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        comment: '创建计划的用户ID'
    },

    // 负责人（可选）
    responsiblePerson: {
        type: String,
        trim: true,
        maxlength: [50, '负责人姓名最多50个字符']
    }
}, {
    timestamps: true, // 自动管理 createdAt 和 updatedAt
    versionKey: '__v',
    collection: 'experiment_plans'
});

// 索引优化
experimentPlanSchema.index({ labName: 1, experimentDate: -1 });
experimentPlanSchema.index({ createdBy: 1, experimentDate: -1 });
experimentPlanSchema.index({ status: 1, experimentDate: 1 });
experimentPlanSchema.index({ 'itemsNeeded.inventoryId': 1 });

// 虚拟字段：格式化的实验日期 (YYYY-MM-DD)
experimentPlanSchema.virtual('formattedDate').get(function() {
    if (!this.experimentDate) return '';
    const date = new Date(this.experimentDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
});

module.exports = mongoose.model('ExperimentPlan', experimentPlanSchema);
