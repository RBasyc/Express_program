let express = require('express');
let LabRoute = express.Router();
const LabController = require('../../controller/LabController/LabController.js');

// 获取所有实验室列表
LabRoute.get('/list', LabController.getList);

// 获取实验室详情
LabRoute.get('/detail/:labName', LabController.getDetail);

// 搜索实验室
LabRoute.get('/search', LabController.search);

// 创建实验室
LabRoute.post('/create', LabController.create);

// 更新实验室信息
LabRoute.put('/update/:labName', LabController.update);

// 删除实验室
LabRoute.delete('/delete/:labName', LabController.delete);

module.exports = LabRoute;
