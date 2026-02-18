const mongoose = require('mongoose')
const User = require('../../models/UserModel/UserModel.js');
const JWT = require('../../utils/JWT');

const userServices = {
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
    }
}

module.exports = userServices;




