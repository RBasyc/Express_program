const mongoose = require('mongoose')
const User = require('../../models/UserModel/UserModel.js');
const JWT = require('../../utils/JWT');

const userServices = {
    // 普通登录
    login: async (nickName, password) => {
        
        const user = await User.findOne({nickName, password });
        
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
    
}

module.exports = userServices;




