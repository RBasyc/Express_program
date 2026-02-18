let express = require('express');
let UserRoute = express.Router();
const UserController = require('../../controller/UserController/UserController.js');

UserRoute.post('/login', UserController.login);

module.exports = UserRoute;
