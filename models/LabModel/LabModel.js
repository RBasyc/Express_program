const mongoose = require('mongoose')

const LabSchema = new mongoose.Schema({
  labName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
    comment: '实验室名称（必填，唯一）'
  },
  university: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    comment: '所属大学（必填）'
  },
  managerName: {
    type: String,
    trim: true,
    maxlength: 50,
    comment: '实验室负责人姓名'
  },
  managerContact: {
    type: String,
    trim: true,
    maxlength: 20,
    comment: '负责人联系方式'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    comment: '实验室状态'
  }
}, {
  timestamps: true, // 自动管理 createdAt 和 updatedAt
  versionKey: '__v', // 版本控制字段名
  collection: 'labs' // 指定集合名称
})

// 索引 (labName已通过unique:true自动创建索引，此处无需重复定义)
LabSchema.index({ university: 1 })
LabSchema.index({ status: 1 })

module.exports = mongoose.model('Lab', LabSchema)
