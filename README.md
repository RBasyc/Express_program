# 实验室耗材管理系统 API

基于 Node.js 和 Express.js 构建的实验室耗材管理系统，使用 JWT 进行身份验证，MongoDB 作为数据库。

## 功能特性

### 用户认证与授权
- 用户登录与注册
- JWT（JSON Web Token）基于的身份验证
- Token 自动刷新机制
- 实验室隔离（多实验室数据隔离）

### 库存管理
- 耗材增删改查
- 分页查询与筛选
- 关键词搜索
- 扫码快速查询
- 库存预警（过期、低库存等）
- 库存统计分析
- 自动状态更新
- **库存流水记录** - 完整的出入库操作审计

### 实验室管理
- 实验室信息管理
- 实验室搜索与查询
- 实验室创建与审核

### AI 智能助手
- 集成 DeepSeek AI
- 自然语言库存查询
- 智能数据分析与建议

### 数据持久化与架构
- MongoDB 数据持久化
- MVC 三层架构模式
- CORS 跨域支持

## 技术栈

- **Node.js** - JavaScript 运行时环境
- **Express.js 5.2.1** - Web 应用框架
- **MongoDB 7.1.0** - NoSQL 数据库
- **Mongoose 9.2.1** - MongoDB ODM
- **jsonwebtoken 9.0.3** - JWT 实现
- **cors 2.8.6** - 跨域资源共享中间件
- **axios 1.7.9** - HTTP 客户端（AI API 调用）

## 项目结构

```
no1_express/
├── app.js                          # 应用入口文件
├── package.json                    # 项目配置和依赖
├── .env.example                    # 环境变量模板
├── routes/                         # 路由层
│   ├── UserRoute/
│   │   └── UserRoute.js           # 用户路由
│   ├── InventoryRoute/
│   │   └── InventoryRoute.js      # 库存路由
│   ├── LabRoute/
│   │   └── LabRoute.js            # 实验室路由
│   ├── TransactionRoute/
│   │   └── TransactionRoute.js   # 库存流水路由
│   └── AiChatRoute/
│       └── AiChatRoute.js         # AI 聊天路由
├── controller/                     # 控制器层
│   ├── UserController/
│   │   └── UserController.js      # 用户控制器
│   ├── InventoryController/
│   │   └── InventoryController.js # 库存控制器
│   ├── LabController/
│   │   └── LabController.js       # 实验室控制器
│   ├── TransactionController/
│   │   └── TransactionController.js # 流水控制器
│   └── AiChatController/
│       └── AiChatController.js    # AI 控制器
├── services/                       # 服务层
│   ├── UserServices/
│   │   └── UserServices.js        # 用户服务
│   ├── InventoryServices/
│   │   └── InventoryServices.js   # 库存服务
│   ├── LabServices/
│   │   └── LabServices.js         # 实验室服务
│   ├── TransactionServices/
│   │   └── TransactionServices.js # 流水服务
│   └── AiChatServices/
│       ├── AiChatServices.js      # AI 聊天服务
│       └── DeepSeekService.js     # DeepSeek API 封装
├── models/                         # 数据模型层
│   ├── UserModel/
│   │   └── UserModel.js           # 用户模型
│   ├── InventoryModel/
│   │   └── InventoryModel.js      # 库存模型
│   ├── LabModel/
│   │   └── LabModel.js            # 实验室模型
│   └── TransactionModel/
│       └── TransactionModel.js    # 流水模型
└── utils/                          # 工具类
    ├── JWT.js                      # JWT 工具函数
    ├── mongoDB.js                  # MongoDB 连接工具
    ├── config.js                   # 配置管理
    └── promptTemplates.js          # AI 提示词模板
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
- **JWT_SECRET**: JWT 签名密钥（生产环境必须使用强密钥，至少 32 位）
- **DEEPSEEK_API_KEY**: DeepSeek AI API 密钥（可选，用于 AI 聊天功能）
- **DEEPSEEK_API_BASE_URL**: DeepSeek API 地址（可选）
- **DEEPSEEK_MODEL**: 使用的模型（可选）
- **DEEPSEEK_MAX_TOKENS**: 最大 token 数（可选）

### 2. 默认配置

如未配置环境变量，将使用以下默认值：

- **数据库地址**: mongodb://localhost:27017
- **数据库名称**: test
- **服务端口**: 3000
- **JWT 密钥**: dev-secret-do-not-use-in-production（仅用于开发，生产环境必须更改）

## 使用

### 开发模式（带自动重载）
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

服务器将在 http://localhost:3000 上运行。

## API 端点

### 用户认证

#### 用户登录
```
POST /user/login
Content-Type: application/json

{
  "nickName": "用户名",
  "password": "密码"
}
```

#### 用户注册
```
POST /user/register
Content-Type: application/json

{
  "nickName": "用户名",
  "password": "密码",
  "labName": "实验室名称"
}
```

#### 检查昵称是否可用
```
GET /user/check-nickname?nickName=用户名
```

### 实验室管理

#### 搜索实验室
```
GET /lab/search?keyword=关键词
```

#### 获取实验室列表
```
GET /lab/list?page=1&pageSize=10
```

#### 创建实验室
```
POST /lab/create
Content-Type: application/json

{
  "labName": "实验室名称",
  "university": "所属大学",
  "managerName": "负责人姓名",
  "contact": "联系方式"
}
```

### 库存管理

> 所有库存管理接口都需要在请求头中包含有效的 JWT token：
> ```
> Authorization: <token>
> ```

#### 1. 获取库存列表
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

#### 2. 获取库存统计数据
```
GET /adminapi/inventory/statistics
```

#### 3. 搜索耗材
```
GET /adminapi/inventory/search?keyword=乙醇
```

#### 4. 扫码查询耗材
```
GET /adminapi/inventory/by-code?code=RE001
```

#### 5. 获取预警耗材列表
```
GET /adminapi/inventory/alerts
```

#### 6. 获取耗材详情
```
GET /adminapi/inventory/detail/:id
```

#### 7. 添加耗材
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
```
PUT /adminapi/inventory/update/:id
Content-Type: application/json

{
  "quantity": 8,
  "remarks": "已更新备注"
}
```

#### 9. 更新库存数量（出入库操作）
```
PUT /adminapi/inventory/quantity/:id
Content-Type: application/json

{
  "quantity": 5,
  "operation": "add"
}
```

**操作类型**
- `add`: 入库操作
- `subtract`: 出库操作

#### 10. 删除耗材
```
DELETE /adminapi/inventory/delete/:id
```

### 库存流水记录

#### 获取流水列表
```
GET /adminapi/transaction/list?page=1&pageSize=10
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页数量，默认 10 |
| type | String | 否 | 操作类型筛选 |
| inventoryId | String | 否 | 关联耗材 ID |

#### 获取流水统计
```
GET /adminapi/transaction/statistics
```

### AI 智能助手

#### AI 聊天
```
POST /adminapi/ai/chat
Content-Type: application/json
Authorization: <token>

{
  "message": "查询实验室有哪些试剂即将过期？"
}
```

#### 获取 MCP 工具列表
```
GET /adminapi/ai/mcp/tools
```

## 数据模型

### Inventory 状态值
- `normal` - 正常
- `low_stock` - 低库存
- `expired` - 已过期
- `expiring_soon` - 即将过期（30天内）
- `out_of_stock` - 缺货

### Transaction 流水类型
- `purchase_in` - 采购入库
- `return_in` - 退货入库
- `consume_out` - 消耗出库
- `use_out` - 使用出库

## 开发说明

### MVC 架构

本系统采用 MVC 三层架构设计：

```
routes/          (定义端点，委托给控制器)
  ↓
controller/      (处理请求/响应，调用服务)
  ↓
services/        (业务逻辑，数据库操作)
  ↓
models/          (Mongoose 模式，静态方法)
```

### 实验室数据隔离

**重要**：所有库存操作必须强制执行实验室隔离，使用 JWT payload 中的 `labName`。

```javascript
// 服务层模式
const query = { /* 其他条件 */ };
if (labName) {
    query.labName = labName;  // 始终按 labName 过滤
}
```

### Token 自动刷新

每个有效的请求都会在响应 `Authorization` 头中返回一个新的 token。

### 已实现功能

- ✅ 用户认证与授权
- ✅ 完整的库存 CRUD 操作
- ✅ 实验室数据隔离
- ✅ 智能库存状态管理（自动检测过期、低库存等）
- ✅ 库存统计与分析
- ✅ 库存流水记录与审计
- ✅ 实验室管理
- ✅ AI 智能助手集成
- ✅ 环境变量配置

## 安全建议

1. **生产环境必须更改 JWT_SECRET**
   ```bash
   # 生成强密钥
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **启用密码加密**（使用 bcrypt）

3. **配置 HTTPS**

4. **限制 CORS 来源**

5. **添加速率限制**

## 测试

运行库存流水功能测试：
```bash
node scripts/test-transaction.js
```

测试前需配置环境变量：
```bash
export TEST_USERNAME=your_username
export TEST_PASSWORD=your_password
```

## 许可证

[ISC](LICENSE)

## 作者

RBasyc

---

**注意**：本系统仅用于学习和参考，生产环境使用前请务必完善安全措施。
