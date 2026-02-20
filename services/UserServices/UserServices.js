const mongoose = require('mongoose')
const User = require('../../models/UserModel/UserModel.js');
const JWT = require('../../utils/JWT');
const WechatUtil = require('../../utils/wechatUtil');

const userServices = {
    // 普通登录
    login: async (username, password) => {
        const user = await User.findOne({ username });
        if (user === null) {
            return null;
        }
        if (user.password !== password) {
            return null;
        }
        return user;
    },

    // 普通注册
    register: async (username, password) => {
        const user = await User.findOne({ username });
        if (user) {
            return null;
        }
        const newUser = new User({
            username,
            password
        })
        await newUser.save();
        return newUser;
    },

    /**
     * 微信手机号登录
     * @param {string} code - 微信登录code
     * @param {string} phoneNumberCode - 手机号授权code
     * @param {string} nickName - 用户昵称
     * @param {string} avatarUrl - 用户头像
     * @returns {Promise<object>} - 用户信息
     */
    phoneLogin: async (code, phoneNumberCode, nickName, avatarUrl) => {
        try {
            // 1. 通过code获取openid和session_key
            const { openid, unionid } = await WechatUtil.code2Session(code);

            // 2. 通过phoneNumberCode获取手机号
            const phoneInfo = await WechatUtil.getPhoneNumberByCode(phoneNumberCode);
            const phoneNumber = phoneInfo.phoneNumber;

            // 3. 查找是否已存在该openid的用户
            let user = await User.findOne({ openid });

            if (user) {
                // 用户已存在，更新用户信息
                if (phoneNumber) user.phoneNumber = phoneNumber;
                if (nickName) user.nickName = nickName;
                if (avatarUrl) user.avatarUrl = avatarUrl;
                await user.save();
            } else {
                // 4. 如果不存在，检查是否已有该手机号的用户
                user = await User.findOne({ phoneNumber });

                if (user) {
                    // 已有该手机号的用户，更新openid和其他信息
                    user.openid = openid;
                    if (unionid) user.unionid = unionid;
                    if (nickName) user.nickName = nickName;
                    if (avatarUrl) user.avatarUrl = avatarUrl;
                    user.userType = 'weixin';
                    await user.save();
                } else {
                    // 5. 创建新用户
                    user = new User({
                        openid,
                        unionid,
                        phoneNumber,
                        nickName: nickName || '微信用户',
                        avatarUrl,
                        userType: 'weixin'
                    });
                    await user.save();
                }
            }

            return user;
        } catch (error) {
            console.error('微信手机号登录失败:', error);
            throw error;
        }
    }
}

module.exports = userServices;




