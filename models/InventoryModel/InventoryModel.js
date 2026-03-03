const mongoose = require('mongoose')

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '耗材名称不能为空'],
        trim: true,
        maxlength: [100, '耗材名称最多100个字符']
    },
    code: {
        type: String,
        required: [true, '耗材编码不能为空'],
        unique: true,
        trim: true,
        uppercase: true
    },
    category: {
        type: String,
        required: [true, '耗材分类不能为空'],
        enum: {
            values: ['试剂', '耗材', '仪器', '其他'],
            message: '分类只能是 试剂、耗材、仪器 或 其他'
        }
    },
    specification: {
        type: String,
        trim: true,
        maxlength: [50, '规格最多50个字符']
    },
    unit: {
        type: String,
        required: [true, '单位不能为空'],
        enum: {
            values: ['瓶', '盒', '袋', '支', '个', '套', '台', '件', 'kg', 'g', 'L', 'ml', '根', '卷', '其他'],
            message: '请选择有效的单位'
        }
    },
    quantity: {
        type: Number,
        required: [true, '库存数量不能为空'],
        min: [0, '库存数量不能为负数'],
        default: 0
    },
    minQuantity: {
        type: Number,
        required: [true, '最小库存不能为空'],
        min: [0, '最小库存不能为负数'],
        default: 10
    },
    maxQuantity: {
        type: Number,
        min: [0, '最大库存不能为负数']
    },
    price: {
        type: Number,
        required: [true, '单价不能为空'],
        min: [0, '单价不能为负数']
    },
    supplier: {
        type: String,
        trim: true,
        maxlength: [100, '供应商名称最多100个字符']
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        validate: {
            validator: function(v) {
                // 如果有过期日期，必须晚于购买日期
                if (!v) return true;
                return !this.purchaseDate || v > this.purchaseDate;
            },
            message: '过期日期必须晚于购买日期'
        }
    },
    location: {
        type: String,
        trim: true,
        maxlength: [50, '存放位置最多50个字符']
    },
    labName: {
        type: String,
        required: [true, '实验室名称不能为空'],
        trim: true,
        maxlength: [100, '实验室名称最多100个字符'],
        comment: '所属实验室名称'
    },
    status: {
        type: String,
        enum: {
            values: ['normal', 'low_stock', 'expired', 'expiring_soon', 'out_of_stock'],
            message: '状态无效'
        },
        default: 'normal'
    },
    remarks: {
        type: String,
        trim: true,
        maxlength: [500, '备注最多500个字符']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    versionKey: '__v',
    collection: 'inventory'
});

// 索引 (code字段已通过unique:true自动创建索引，此处无需重复定义)
inventorySchema.index({ category: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ labName: 1 });

// 更新状态中间件 - 保存前自动计算状态
inventorySchema.pre('save', function() {
    this.updateStatus();
});

// 实例方法：更新耗材状态
inventorySchema.methods.updateStatus = function() {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 检查是否过期
    if (this.expiryDate && this.expiryDate < now) {
        this.status = 'expired';
    }
    // 检查是否即将过期（30天内）
    else if (this.expiryDate && this.expiryDate < thirtyDaysLater) {
        this.status = 'expiring_soon';
    }
    // 检查库存是否为0
    else if (this.quantity === 0) {
        this.status = 'out_of_stock';
    }
    // 检查低库存
    else if (this.quantity <= this.minQuantity) {
        this.status = 'low_stock';
    }
    // 正常状态
    else {
        this.status = 'normal';
    }
};

// 静态方法：获取需要预警的耗材
inventorySchema.statics.getAlertItems = async function() {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return await this.find({
        $or: [
            { status: 'low_stock' },
            { status: 'expiring_soon' },
            { status: 'expired' },
            { status: 'out_of_stock' }
        ]
    }).sort({ status: 1, expiryDate: 1 });
};

// 静态方法：搜索耗材
inventorySchema.statics.searchItems = async function(keyword) {
    const regex = new RegExp(keyword, 'i');
    return await this.find({
        $or: [
            { name: regex },
            { code: regex },
            { category: regex },
            { supplier: regex },
            { specification: regex }
        ]
    }).sort({ createdAt: -1 });
};

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
