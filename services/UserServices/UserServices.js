const mongoose = require('mongoose')
const User = require('../../models/UserModel/UserModel.js');
const JWT = require('../../utils/JWT');

const userServices = {
    login: async (nickName, password) => {

        const user = await User.findOne({ nickName, password });

        if (user === null) {
            return null;
        }
        if (user.nickName !== nickName || user.password !== password) {
            return null;
        }
        return user;
    },
    register: async (nickName, password) => {
        const user = await User.create({
            nickName,
            password
        })
        return user;
    },
    updateProfile: async (_id, realName, email, phone, avatar) => {
        const updatedUser = await User.findOneAndUpdate(
            { _id }, // 将字符串_id转换为ObjectId
            { realName, phone, avatar, email }, // 更新的字段
            { returnDocument: 'after' } // 返回更新后的用户信息
        );
        return updatedUser;
    },
}

module.exports = userServices;




