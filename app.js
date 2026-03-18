const express = require('express')
const app = express()
const cros = require('cors')
const port = 3000

// 加载环境变量配置
const config = require('./utils/config')

const mongoDB = require('./utils/mongoDB')
mongoDB.createConnection()

// 导入模型以确保 mongoose 正确注册
const { User, Inventory, Lab, Transaction, ExperimentPlan, ShareRequest, LabMember, LabMemberLog } = require('./models/index')

const UserRouter = require('./routes/UserRoute/UserRoute')
const UploadRouter = require('./routes/UserRoute/UploadRouter')
const InventoryRouter = require('./routes/InventoryRoute/InventoryRoute')
const LabRouter = require('./routes/LabRoute/LabRoute')
const TransactionRouter = require('./routes/TransactionRoute/TransactionRoute')
const AiChatRouter = require('./routes/AiChatRoute/AiChatRoute')
const ExperimentPlanRouter = require('./routes/ExperimentPlanRoute/ExperimentPlanRoute')
const ShareRequestRouter = require('./routes/ShareRequestRoute/ShareRequestRoute')
const LabMemberRouter = require('./routes/LabMemberRoute/LabMemberRoute')
const StatisticsRouter = require('./routes/StatisticsRoute/StatisticsRoute')

app.use(express.json())
app.use(cros({
    origin: ['http://localhost:10086', 'http://192.168.67.48:10086', /^http:\/\/192\.168\.\d+\.\d+:10086$/],
    credentials: true
}))

// 静态文件服务 - 放在 JWT 中间件之前
app.use('/public', express.static('public'))


const JWT = require('./utils/JWT')
// JWT 验证中间件 - 放在路由之前
app.use((req, res, next) => {
    // 登录、注册、上传接口、实验室搜索/创建白名单：不需要token验证
    const whiteList = [
        '/user/login',
        '/user/register',
        '/user/check-nickname',
        '/upload',
        '/lab/search',    // 实验室搜索（注册时使用）
        '/lab/list',      // 实验室列表（注册时使用）
        '/lab/create'     // 实验室创建（注册时使用）
    ]
    if (whiteList.some(path => req.path.startsWith(path.replace(/^\/user/, '/user')) ||
                                   req.path.startsWith(path.replace(/^\/upload/, '/upload')) ||
                                   req.path.startsWith(path.replace(/^\/lab/, '/lab')))) {
        next()
        return
    }

    const authorization = req.headers['authorization']
    if (!authorization) {
        res.status(401).send({ errCode: "-1", errorInfo: "未提供token" })
        return
    }



    const token = authorization
    if (token) {
        var payload = JWT.verify(token)
        if (payload) {
            const newToken = JWT.generate({
                _id: payload._id,
                username: payload.username,
                nickName: payload.nickName,
                labName: payload.labName
            }, "1d")
            res.header("Authorization", newToken)
            next()
        }
        else {
            res.status(401).send({ errCode: "-1", errorInfo: "token过期" })
        }
    } else {
        res.status(401).send({ errCode: "-1", errorInfo: "token格式错误" })
    }
})

app.use('/user', UserRouter)
app.use('/upload', UploadRouter)
app.use('/adminapi/inventory', InventoryRouter)
app.use('/lab', LabRouter)
app.use('/adminapi/transaction', TransactionRouter)
app.use('/ai', AiChatRouter)
app.use('/adminapi/experiment-plan', ExperimentPlanRouter)
app.use('/adminapi/share-request', ShareRequestRouter)
app.use('/adminapi/lab-member', LabMemberRouter)
app.use('/adminapi/statistics', StatisticsRouter)

app.use(function (req, res, next) {
    const err = new Error('Not Found')
    err.status = 404
    next(err);
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        errCode: '-1',
        errorInfo: err.message || 'Internal Server Error',
        stack: req.app.get('env') === 'development' ? err.stack : undefined
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports = app;