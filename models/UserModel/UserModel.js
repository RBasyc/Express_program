const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: false
    },
    // 微信相关字段
    openid: {
        type: String,
        unique: true,
        sparse: true // 允许多个null值
    },
    unionid: {
        type: String,
        default: null
    },
    phoneNumber: {
        type: String,
        default: null
    },
    nickName: {
        type: String,
        default: null
    },
    avatarUrl: {
        type: String,
        default: null
    },
    // 用户类型：weixin(微信登录)、normal(普通登录)
    userType: {
        type: String,
        enum: ['weixin', 'normal'],
        default: 'normal'
    }
}, {
    timestamps: true // 添加createdAt和updatedAt字段
})
const User = mongoose.model('User', UserSchema)
module.exports = User;