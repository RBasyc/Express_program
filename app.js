const express = require('express')
const app = express()
const cros = require('cors')
const port = 3000

const mongoDB = require('./utils/mongoDB')
const JWT = require('./utils/JWT')
mongoDB.createConnection()


const UserRouter = require('./routes/UserRoute/UserRoute')

app.use(express.json())
app.use(cros())
app.use('/user', UserRouter)

app.use((req, res, next) => {
  //如果token有效，next()
  //如果token过期了，返回401错误
  // 登录接口白名单：不需要token验证
  const whiteList = ['/user/login']
  if (whiteList.includes(req.url)) {
    next()
    return;
  }
  const authorization = req.headers['authorization']
  if (!authorization) {
    res.status(401).send({ errCode: "-1", errorInfo: "未提供token" })
    return;
  }
  const token = authorization.split(" ")[1]
  if (token) {
    var payload = JWT.verify(token)
    if (payload) {
      const newToken = JWT.generate({
        _id: payload._id,
        username: payload.username
      }, "1d")
      res.header("Authorization", newToken)
      next()
    }
    else {
      res.status(401).send({ errCode: "-1", errorInfo: "token过期" })
    }
  }
})

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