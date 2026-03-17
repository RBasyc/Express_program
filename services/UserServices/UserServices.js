const mongoose = require('mongoose')
const User = require('../../models/UserModel/UserModel.js');
const Lab = require('../../models/LabModel/LabModel.js');
const LabMember = require('../../models/LabMemberModel/LabMemberModel.js');
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

        // Get active lab from LabMember
        const activeLabMember = await LabMember.findOne({
            userId: user._id,
            isActive: true,
            status: 'active'
        }).populate('labId');

        // Attach active lab info to user object
        user.activeLabId = activeLabMember?.labId?._id || null;
        user.activeLabName = activeLabMember?.labId?.labName || null;

        return user;
    },
    checkNickname: async (nickName) => {
        const user = await User.findOne({ nickName });
        return user !== null;
    },
    register: async (nickName, password) => {
        // 检查用户是否已存在
        const existingUser = await User.findOne({ nickName });
        if (existingUser) {
            return null;
        }

        // 创建用户（不再需要实验室名称）
        const user = await User.create({
            nickName,
            password
        })
        return user;
    },
    updateProfile: async (_id, realName, email, phone, avatar) => {
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

        // 构建更新对象（移除实验室更新功能）
        const updateData = { realName, phone, avatar, email };

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




