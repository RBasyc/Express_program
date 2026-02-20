let express = require('express');
let UserRoute = express.Router();
const UserController = require('../../controller/UserController/UserController.js');

// 普通登录
UserRoute.post('/login', UserController.login);

// 微信手机号登录
UserRoute.post('/phone/login', UserController.phoneLogin);

module.exports = UserRoute;
