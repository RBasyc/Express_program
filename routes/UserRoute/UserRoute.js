let express = require('express');
let UserRoute = express.Router();
const UserController = require('../../controller/UserController/UserController.js');

// 普通登录
UserRoute.post('/login', UserController.login);
// 注册
UserRoute.post('/register', UserController.register);
// 检查昵称是否存在
UserRoute.get('/check-nickname', UserController.checkNickname);

UserRoute.post('/update-profile', UserController.updateProfile);

module.exports = UserRoute;
