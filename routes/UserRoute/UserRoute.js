let express = require('express');
let UserRoute = express.Router();
const UserController = require('../../controller/UserController/UserController.js');

// 普通登录
UserRoute.post('/login', UserController.login);

module.exports = UserRoute;
