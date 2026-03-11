# 实验室耗材管理系统 API

基于 Node.js 和 Express.js 构建的实验室耗材管理系统，使用 JWT 进行身份验证，MongoDB 作为数据库。

## 功能特性

- 用户认证与授权
  - 用户登录功能
  - JWT（JSON Web Token）基于的身份验证
  - Token 自动刷新机制
  - 实验室隔离（多实验室数据隔离）
- 库存管理
  - 耗材增删改查
  - 分页查询与筛选
  - 关键词搜索
  - 扫码快速查询
  - 库存预警（过期、低库存等）
  - 库存统计分析
  - 自动状态更新
- 数据持久化与架构
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
├── app.js                          # 应用入口文件
├── package.json                    # 项目配置和依赖
├── mongoDB.js                      # MongoDB 连接工具
├── routes/                         # 路由层
│   ├── UserRoute/
│   │   └── UserRoute.js           # 用户路由
│   └── InventoryRoute/
│       └── InventoryRoute.js      # 库存路由
├── controller/                     # 控制器层
│   ├── UserController/
│   │   └── UserController.js      # 用户控制器
│   └── InventoryController/
│       └── InventoryController.js # 库存控制器
├── services/                       # 服务层
│   ├── UserServices/
│   │   └── UserServices.js        # 用户服务
│   └── InventoryServices/
│       └── InventoryServices.js   # 库存服务
├── models/                         # 数据模型层
│   ├── UserModel/
│   │   └── UserModel.js           # 用户模型
│   └── InventoryModel/
│       └── InventoryModel.js      # 库存模型
└── utils/                          # 工具类
    └── JWT.js                      # JWT 工具函数
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

### 1. 环境变量配置

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下配置：

- **MONGODB_URI**: MongoDB 连接字符串（默认：`mongodb://localhost:27017/test`）
- **JWT_SECRET**: JWT 签名密钥（生产环境必须使用强密钥）
- **DEEPSEEK_API_KEY**: DeepSeek AI API 密钥（可选，用于 AI 聊天功能）

### 2. 默认配置

如未配置环境变量，将使用以下默认值：

- **数据库地址**: mongodb://localhost:27017
- **数据库名称**: test
- **服务端口**: 3000
- **JWT 密钥**: dev-secret-do-not-use-in-production（仅用于开发）

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

---

### 库存管理 API

> 所有库存管理接口都需要在请求头中包含有效的 JWT token：
> ```
> Authorization: <token>
> ```

#### 1. 获取库存列表

**请求**
```
GET /adminapi/inventory/list?page=1&pageSize=10&category=试剂&keyword=测试
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页数量，默认 10 |
| category | String | 否 | 分类筛选（试剂/耗材/仪器/其他） |
| status | String | 否 | 状态筛选 |
| keyword | String | 否 | 关键词搜索 |

**响应**
```json
{
  "errCode": "0",
  "errorInfo": "success",
  "data": {
    "total": 150,
    "items": [...],
    "page": 1,
    "pageSize": 10,
    "totalPages": 15
  }
}
```

#### 2. 获取库存统计数据

**请求**
```
GET /adminapi/inventory/statistics
```

**响应**
```json
{
  "errCode": "0",
  "errorInfo": "success",
  "data": {
    "total": 150,
    "categories": {
      "试剂": 45,
      "耗材": 60,
      "仪器": 30,
      "其他": 15
    }
  }
}
```

#### 3. 搜索耗材

**请求**
```
GET /adminapi/inventory/search?keyword=乙醇
```

**响应**
```json
{
  "errCode": "0",
  "errorInfo": "success",
  "data": {
    "items": [...],
    "total": 5
  }
}
```

#### 4. 扫码查询耗材

**请求**
```
GET /adminapi/inventory/by-code?code=RE001
```

**响应**
```json
{
  "errCode": "0",
  "errorInfo": "success",
  "data": {
    "_id": "...",
    "code": "RE001",
    "name": "无水乙醇",
    ...
  }
}
```

#### 5. 获取预警耗材列表

**请求**
```
GET /adminapi/inventory/alerts
```

**响应**
```json
{
  "errCode": "0",
  "errorInfo": "success",
  "data": {
    "items": [...],
    "total": 10,
    "alertGroups": {
      "expired": [...],
      "expiring_soon": [...],
      "out_of_stock": [...],
      "low_stock": [...]
    },
    "summary": {
      "expired": 2,
      "expiring_soon": 3,
      "out_of_stock": 1,
      "low_stock": 4
    }
  }
}
```

#### 6. 获取耗材详情

**请求**
```
GET /adminapi/inventory/detail/:id
```

**响应**
```json
{
  "errCode": "0",
  "errorInfo": "success",
  "data": {
    "_id": "...",
    "name": "无水乙醇",
    "code": "RE001",
    ...
  }
}
```

#### 7. 添加耗材

**请求**
```
POST /adminapi/inventory/add
Content-Type: application/json

{
  "name": "无水乙醇",
  "code": "RE001",
  "category": "试剂",
  "specification": "500ml",
  "unit": "瓶",
  "quantity": 10,
  "minQuantity": 5,
  "maxQuantity": 50,
  "price": 25.00,
  "supplier": "某某化工",
  "purchaseDate": "2025-01-01",
  "expiryDate": "2027-01-01",
  "location": "A区01架",
  "remarks": "易燃液体"
}
```

**必填字段**
- name（名称）
- code（编码）
- category（分类）
- unit（单位）
- price（单价）

#### 8. 更新耗材

**请求**
```
PUT /adminapi/inventory/update/:id
Content-Type: application/json

{
  "quantity": 8,
  "remarks": "已更新备注"
}
```

#### 9. 更新库存数量

**请求**
```
PUT /adminapi/inventory/quantity/:id
Content-Type: application/json

{
  "quantity": 15
}
```

#### 10. 删除耗材

**请求**
```
DELETE /adminapi/inventory/delete/:id
```

### 受保护的路由

所有库存管理端点都需要在请求头中包含有效的 JWT token：

```
Authorization: <token>
```

Token 会在每次有效请求后自动刷新。

## 开发说明

本系统采用 MVC 三层架构设计，实现了以下核心功能：

- ✅ 用户认证与授权
- ✅ 库存完整 CRUD 操作
- ✅ 实验室数据隔离
- ✅ 智能库存状态管理（自动检测过期、低库存等）
- ✅ 库存统计与分析

### 可考虑扩展的功能

- 用户注册功能
- 密码加密（使用 bcrypt）
- 密码重置
- 基于角色的访问控制（RBAC）
- 单元测试
- 环境变量配置（使用 dotenv）
- 日志记录（使用 winston）
- 数据导入导出
- 库存流水记录

## 许可证

[ISC](LICENSE)

## 作者

RBasyc

## 许可证

ISC