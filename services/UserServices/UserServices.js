const mongoose = require('mongoose')
const User = require('../../models/UserModel/UserModel.js');
const Lab = require('../../models/LabModel/LabModel.js');
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
    checkNickname: async (nickName) => {
        const user = await User.findOne({ nickName });
        return user !== null;
    },
    register: async (nickName, password, labName) => {
        if (!labName) {
            throw new Error('实验室名称不能为空');
        }

        // 检查用户是否已存在
        const existingUser = await User.findOne({ nickName });
        if (existingUser) {
            return null;
        }

        // 检查实验室是否存在（不允许自动创建）
        const existingLab = await Lab.findOne({ labName });
        if (!existingLab) {
            throw new Error('实验室不存在，请先创建实验室');
        }

        // 创建用户
        const user = await User.create({
            nickName,
            password,
            labName
        })
        return user;
    },
    updateProfile: async (_id, realName, email, phone, avatar, labName) => {
        // 获取当前用户信息
        const currentUser = await User.findById(_id);
        if (!currentUser) {
            return { success: false, message: '用户不存在' };
        }

        // 如果修改了手机号，检查新手机号是否已被其他用户使用
        if (phone && phone !== currentUser.phone) {
            const existingUser = await User.findOne({
                phone,
                _id: { $ne: _id } // 排除当前用户
            });
            if (existingUser) {
                return { success: false, message: '该手机号已被其他用户使用' };
            }
        }

        // 如果要更新实验室，检查实验室是否存在
        if (labName && labName !== currentUser.labName) {
            const existingLab = await Lab.findOne({ labName });
            if (!existingLab) {
                return { success: false, message: '实验室不存在' };
            }
        }

        // 构建更新对象
        const updateData = { realName, phone, avatar, email };
        if (labName) {
            updateData.labName = labName;
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id }, // 将字符串_id转换为ObjectId
            updateData, // 更新的字段
            { returnDocument: 'after' } // 返回更新后的用户信息
        );

        if (!updatedUser) {
            return { success: false, message: '更新失败' };
        }

        return { success: true, data: updatedUser, message: '更新成功' };
    },
}

module.exports = userServices;




