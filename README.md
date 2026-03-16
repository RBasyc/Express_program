# 实验室耗材管理系统 API

基于 Node.js 和 Express.js 构建的实验室耗材管理系统后端服务，使用 JWT 进行身份验证，MongoDB 作为数据库。

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
- 支持 MCP 工具调用

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

## 服务架构

本系统采用**双服务架构**：

### 主服务 (端口 3000)
- 用户认证与授权
- 库存 CRUD 操作
- 出入库流水管理
- 实验室管理
- AI 聊天接口

### MCP 服务 (端口 3001) - 独立部署
- AI 工具接口
- 库存智能查询
- 数据分析服务

```
┌─────────────┐
│   前端/H5   │
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
┌──────┐  ┌──────┐
│3000  │  │ 3001 │
│主服务│  │ MCP  │
└──────┘  └──────┘
```

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
- **USE_MCP_QUERY**: 是否启用 MCP 查询（默认：false）
- **MCP_HTTP_URL**: MCP HTTP 服务器地址（默认：`http://localhost:3001`）

### 2. MCP 服务配置（可选）

如果需要使用 AI 智能查询功能，需要启动 MCP 服务：

```bash
cd ../mcp
npm install
npm start
```

MCP 服务将在 `http://localhost:3001` 上运行。

### 3. 默认配置

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

主服务将在 http://localhost:3000 上运行。

### 启动完整系统（主服务 + MCP 服务）

**终端 1 - 启动主服务**：
```bash
cd no1_express
npm run dev
```

**终端 2 - 启动 MCP 服务**（可选）：
```bash
cd mcp
npm start
```

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
GET /adminapi/inventory/stats
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
POST /ai/chat
Content-Type: application/json
Authorization: <token>

{
  "message": "查询实验室有哪些试剂即将过期？",
  "conversationHistory": []
}
```

**功能说明**：
- 支持自然语言库存查询
- 自动调用 MCP 工具获取数据
- 返回结构化的 AI 回复

## MCP 工具接口（独立服务）

如果启动了 MCP 服务（端口 3001），可使用以下工具：

| 工具端点 | 功能 | 参数 |
|---------|------|------|
| `/tools/inventory-summary` | 库存统计摘要 | `labName` |
| `/tools/expired-items` | 已过期耗材 | `labName`, `limit` (默认5) |
| `/tools/expiring-items` | 即将过期耗材 | `labName`, `days` (默认30), `limit` (默认10) |
| `/tools/low-stock-items` | 库存不足耗材 | `labName` |
| `/tools/out-of-stock-items` | 缺货耗材 | `labName` |
| `/tools/search-inventory` | 搜索耗材 | `labName`, `keyword` |
| `/tools/check-item` | 检查耗材可用性 | `labName`, `itemName` |
| `/tools/purchase-suggestions` | 采购建议 | `labName` |

**MCP 服务健康检查**：
```
GET /health
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
- ✅ MCP 工具接口支持
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

## 部署建议

### 生产环境配置

1. **使用进程管理器**（如 PM2）：
```bash
npm install -g pm2
pm2 start app.js --name lab-inventory-api
pm2 startup
pm2 save
```

2. **配置 Nginx 反向代理**：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **启用 HTTPS**（使用 Let's Encrypt）

### Docker 部署（可选）

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 故障排查

### 问题 1: MongoDB 连接失败
```bash
# 检查 MongoDB 是否运行
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl status mongodb
```

### 问题 2: MCP 服务不可用
```bash
# 检查 MCP 服务状态
curl http://localhost:3001/health

# 查看日志
cd ../mcp
npm start
```

### 问题 3: AI 功能不工作
- 检查 `DEEPSEEK_API_KEY` 是否配置
- 检查 API Key 是否有效
- 查看 AI 服务日志

## 许可证

[ISC](LICENSE)

## 作者

RBasyc

---

**注意**：本系统仅用于学习和参考，生产环境使用前请务必完善安全措施。
