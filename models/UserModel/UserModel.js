const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  nickName: {
    type: String,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  password: {
    type: String,
    minlength: [6, '密码至少6个字符']
  },
  realName: {
    type: String,
    trim: true,
    maxlength: [50, '真实姓名最多50个字符']
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, '请填写有效的邮箱地址']
  },
  phone: {
    type: String,
    unique: true,
    match: [/^1[3-9]\d{9}$/, '请填写有效的手机号']
  },
  labId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'manager', 'user'],
      message: '角色只能是 admin, manager 或 user'
    },
    default: 'user',
    required: true
  },
  avatar: {
    type: String,
    default: 'default-avatar.png',
    validate: {
      validator: function(v) {
        // 简单的URL验证
        return /^(http|https):\/\/[^ "]+$|^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|gif)$/.test(v);
      },
      message: '请提供有效的头像URL或文件名'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true // 创建后不可修改
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: '状态只能是 active 或 inactive'
    },
    default: 'active',
    required: true
  }
}, {
  timestamps: true, // 自动管理 createdAt 和 updatedAt
  versionKey: '__v', // 版本控制字段名
  collection: 'users' // 指定集合名称
});
// 移除手动设置的 createdAt 和 updatedAt，使用 timestamps
userSchema.set('timestamps', {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// // 保存前更新 updatedAt 字段
// userSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// // 更新前自动更新 updatedAt
// userSchema.pre('findOneAndUpdate', function(next) {
//   this.set({ updatedAt: new Date() });
//   next();
// });

const User = mongoose.model('User', userSchema)
module.exports = User;