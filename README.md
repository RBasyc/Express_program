# Express 认证 API

基于 Node.js 和 Express.js 构建的简单用户认证 API，使用 JWT 进行身份验证，MongoDB 作为数据库。

## 功能特性

- 用户登录功能
- JWT（JSON Web Token）基于的身份验证
- Token 自动刷新机制
- MongoDB 数据持久化
- MVC 架构模式
- CORS 跨域支持

## 技术栈

- **Node.js** - JavaScript 运行时环境
- **Express.js 5.2.1** - Web 应用框架
- **MongoDB 7.1.0** - NoSQL 数据库
- **Mongoose 9.2.1** - MongoDB ODM
- **jsonwebtoken 9.0.3** - JWT 实现
- **cors 2.8.6** - 跨域资源共享中间件

## 项目结构

```
no1_express/
├── app.js                     # 应用入口文件
├── package.json              # 项目配置和依赖
├── mongoDB.js                # MongoDB 连接工具
├── routes/                   # 路由层
│   └── UserRoute/
│       └── UserRoute.js      # 用户路由
├── controller/               # 控制器层
│   └── UserController/
│       └── UserController.js # 用户控制器
├── services/                 # 服务层
│   └── UserServices/
│       └── UserServices.js   # 用户服务
├── models/                   # 数据模型层
│   └── UserModel/
│       └── UserModel.js      # 用户模型
└── utils/                    # 工具类
    └── JWT.js                # JWT 工具函数
```

## 前置要求

- Node.js (v14 或更高版本)
- MongoDB (本地或远程实例)

## 安装

1. 克隆仓库
```bash
git clone https://github.com/RBasyc/Express_program.git
cd no1_express
```

2. 安装依赖
```bash
npm install
```

3. 确保 MongoDB 正在运行
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongodb
# 或
mongod
```

## 配置

默认配置如下（可在 `mongoDB.js` 中修改）：

- **数据库地址**: mongodb://localhost:27017
- **数据库名称**: test
- **服务端口**: 3000
- **JWT 密钥**: basyc

## 使用

启动服务器：

```bash
npm start
```

服务器将在 http://localhost:3000 上运行。

## API 端点

### 用户登录

**请求**
```
POST /adminapi/user/login
Content-Type: application/json

{
  "username": "用户名",
  "password": "密码"
}
```

**成功响应**
```
200 OK
Authorization: <jwt_token>

{
  "errCode": "0",
  "errorInfo": "登录成功"
}
```

**错误响应**
```
400 Bad Request

{
  "errCode": "-1",
  "errorInfo": "用户名或密码错误"
}
```

### 受保护的路由

所有其他端点都需要在请求头中包含有效的 JWT token：

```
Authorization: Bearer <token>
```

Token 会在每次有效请求后自动刷新。

## 开发说明

这是一个基础项目，目前仅实现了用户登录功能。可以考虑扩展以下功能：

- 用户注册
- 密码加密（使用 bcrypt）
- 密码重置
- 基于角色的访问控制（RBAC）
- 单元测试
- 环境变量配置
- 日志记录

## 许可证

[ISC](LICENSE)

## 作者

RBasyc

## 许可证

ISC
