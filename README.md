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

### 实验计划管理 ⭐ 新增
- 实验计划 CRUD 操作
- 计划列表分页查询
- 计划状态管理（根据日期自动判断）
- 耗材清单关联管理
- 创建计划时自动扣减库存
- 删除计划时自动归还库存

### 耗材共享协作 ⭐ 新增
- 发布共享需求（我需要/我富余）
- 需求大厅列表查询
- 分类筛选（全部/我需要/我富余）
- 获取发布者联系方式
- 管理我的共享信息

### 实验室管理
- 实验室信息管理
- 实验室搜索与查询
- 实验室创建与审核

### AI 智能助手
- 集成 DeepSeek AI
- 自然语言库存查询
- 实验计划自动生成
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
- 实验计划管理 ⭐
- 耗材共享管理 ⭐
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
│   ├── index.js                    # 路由聚合器
│   ├── UserRoute/
│   │   └── UserRoute.js           # 用户路由
│   ├── InventoryRoute/
│   │   └── InventoryRoute.js      # 库存路由
│   ├── TransactionRoute/
│   │   └── TransactionRoute.js   # 库存流水路由
│   ├── LabRoute/
│   │   └── LabRoute.js            # 实验室路由
│   ├── ExperimentPlanRoute/        # 实验计划路由 ⭐ 新增
│   │   └── ExperimentPlanRoute.js
│   ├── ShareRequestRoute/          # 耗材共享路由 ⭐ 新增
│   │   └── ShareRequestRoute.js
│   └── AiChatRoute/
│       └── AiChatRoute.js         # AI 聊天路由
├── controller/                     # 控制器层
│   ├── UserController/
│   │   └── UserController.js      # 用户控制器
│   ├── InventoryController/
│   │   └── InventoryController.js # 库存控制器
│   ├── TransactionController/
│   │   └── TransactionController.js # 流水控制器
│   ├── LabController/
│   │   └── LabController.js       # 实验室控制器
│   ├── ExperimentPlanController/    # 实验计划控制器 ⭐ 新增
│   │   └── ExperimentPlanController.js
│   ├── ShareRequestController/     # 耗材共享控制器 ⭐ 新增
│   │   └── ShareRequestController.js
│   └── AiChatController/
│       └── AiChatController.js    # AI 控制器
├── services/                       # 服务层
│   ├── UserServices/
│   │   └── UserServices.js        # 用户服务
│   ├── InventoryServices/
│   │   └── InventoryServices.js   # 库存服务
│   ├── TransactionServices/
│   │   └── TransactionServices.js # 流水服务
│   ├── LabServices/
│   │   └── LabServices.js         # 实验室服务
│   ├── ExperimentPlanServices/      # 实验计划服务 ⭐ 新增
│   │   └── ExperimentPlanServices.js
│   ├── ShareRequestServices/        # 耗材共享服务 ⭐ 新增
│   │   └── ShareRequestServices.js
│   └── AiChatServices/
│       ├── AiChatServices.js      # AI 聊天服务
│       └── DeepSeekService.js     # DeepSeek API 封装
├── models/                         # 数据模型层
│   ├── index.js                    # 模型导出索引
│   ├── UserModel/
│   │   └── UserModel.js           # 用户模型
│   ├── InventoryModel/
│   │   └── InventoryModel.js      # 库存模型
│   ├── LabModel/
│   │   └── LabModel.js            # 实验室模型
│   ├── ExperimentPlanModel/         # 实验计划模型 ⭐ 新增
│   │   └── ExperimentPlanModel.js
│   ├── ShareRequestModel/           # 耗材共享模型 ⭐ 新增
│   │   └── ShareRequestModel.js
│   └── TransactionModel/
│       └── TransactionModel.js    # 流水模型
└── utils/                          # 工具类
    ├── JWT.js                      # JWT 工具函数
    ├── mongoDB.js                  # MongoDB 连接工具
    └── promptTemplates.js          # AI 提示词模板
```

## 前置要求

- Node.js (v14 或更高版本)
- MongoDB (本地或远程实例)

## 安装

1. 克隆仓库
```bash
git clone <repository-url>
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

**功能说明**：
- 使用原子 `$inc` 操作确保并发安全
- 自动创建 Transaction 记录
- 自动记录操作人、时间等信息
- 出库前检查库存是否充足

#### 10. 删除耗材
```
DELETE /adminapi/inventory/delete/:id
```

### 实验计划管理 ⭐ 新增

> 所有实验计划接口都需要在请求头中包含有效的 JWT token

#### 1. 获取实验计划列表
```
GET /adminapi/experiment-plan/list?page=1&pageSize=10&status=&keyword=
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页数量，默认 10 |
| status | String | 否 | 状态筛选 |
| keyword | String | 否 | 关键词搜索（标题、类型） |

**返回数据结构**：
```json
{
  "errCode": "0",
  "data": {
    "total": 10,
    "items": [...],
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

#### 2. 获取实验计划详情
```
GET /adminapi/experiment-plan/detail/:id
```

**功能说明**：
- 自动 populate 耗材库存信息（name, quantity, unit, status, expiryDate）
- 验证实验室权限

#### 3. 创建实验计划
```
POST /adminapi/experiment-plan/add
Content-Type: application/json
Authorization: <token>

{
  "title": "Western Blot 实验",
  "experimentType": "蛋白实验",
  "experimentDate": "2025-03-20",
  "description": "检测蛋白表达水平",
  "itemsNeeded": [
    {
      "name": "胰蛋白酶",
      "quantity": 5,
      "unit": "瓶",
      "specification": "500ml",
      "category": "试剂"
    }
  ]
}
```

**功能说明**：
- 自动根据耗材名称匹配库存
- 自动扣减库存数量
- 记录消耗出库流水（consume_out）
- 自动填充库存状态信息

#### 4. 更新实验计划
```
PUT /adminapi/experiment-plan/update/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "status": "in_progress"
}
```

#### 5. 更新实验进度
```
PUT /adminapi/experiment-plan/progress/:id
Content-Type: application/json

{
  "progress": 50,
  "status": "in_progress"
}
```

#### 6. 删除实验计划
```
DELETE /adminapi/experiment-plan/delete/:id
Authorization: <token>
```

**注意**：前端应先归还所有耗材，再删除计划

#### 7. 获取实验计划统计
```
GET /adminapi/experiment-plan/statistics
Authorization: <token>
```

**返回数据**：
```json
{
  "errCode": "0",
  "data": {
    "total": 20,
    "pending": 5,
    "in_progress": 8,
    "completed": 7
  }
}
```

### 耗材共享管理 ⭐ 新增

> 所有耗材共享接口都需要在请求头中包含有效的 JWT token

#### 1. 获取共享需求列表
```
GET /adminapi/share-request/list?page=1&pageSize=10&requestType=&keyword=
Authorization: <token>
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页数量，默认 10 |
| requestType | String | 否 | 类型筛选（request/share）|
| keyword | String | 否 | 关键词搜索 |

#### 2. 获取我的共享列表
```
GET /adminapi/share-request/my-shares
Authorization: <token>
```

#### 3. 获取发布者联系方式
```
GET /adminapi/share-request/contact/:id
Authorization: <token>
```

**返回数据**：
```json
{
  "errCode": "0",
  "data": {
    "fullContact": "张三 - 手机: 138xxxxxxx, 邮箱: xxx@xx.com"
  }
}
```

#### 4. 发布共享需求
```
POST /adminapi/share-request/add
Content-Type: application/json
Authorization: <token>

{
  "title": "求购胰蛋白酶",
  "requestType": "request",
  "itemName": "胰蛋白酶",
  "quantity": "10瓶",
  "expectedTime": "2025-03-20",
  "description": "紧急需要用于实验"
}
```

**requestType 类型**：
- `request` - 我需要（求购）
- `share` - 我富余（可转让）

#### 5. 删除共享需求
```
DELETE /adminapi/share-request/delete/:id
Authorization: <token>
```

### 库存流水记录

#### 获取流水列表
```
GET /adminapi/transaction/list?page=1&pageSize=10&type=&inventoryId=
Authorization: <token>
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页数量，默认 10 |
| type | String | 否 | 操作类型筛选 |
| inventoryId | String | 否 | 关联耗材 ID |

**返回数据**：
```json
{
  "errCode": "0",
  "data": {
    "total": 100,
    "items": [...],
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

#### 获取流水统计
```
GET /adminapi/transaction/statistics
Authorization: <token>
```

**流水记录字段说明**：
- `userName` - 操作人姓名
- `contact` - 操作人联系方式
- `operationTime` - 操作时间戳
- `quantityBefore` - 操作前数量
- `quantityAfter` - 操作后数量
- `remark` - 备注信息

### AI 智能助手

#### AI 聊天
```
POST /ai/chat
Content-Type: application/json
Authorization: <token>

{
  "message": "下周三做 Western Blot，需要胰蛋白酶 5瓶",
  "conversationHistory": []
}
```

**功能说明**：
- 支持自然语言库存查询
- **支持实验计划生成**：返回结构化的实验计划数据
- 自动调用 MCP 工具获取数据
- 返回格式化的 AI 回复

**实验计划生成响应格式**：
```json
{
  "errCode": "0",
  "data": {
    "type": "experiment_plan",
    "summary": "实验计划已生成",
    "parsed_items": [
      {
        "name": "胰蛋白酶",
        "quantity": 5,
        "quantity_str": "5瓶",
        "unit": "瓶"
      }
    ]
  }
}
```

**普通查询响应格式**：
```json
{
  "errCode": "0",
  "data": {
    "type": "text",
    "content": "胰蛋白酶存放在4℃冰箱第二层"
  }
}
```

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

### ExperimentPlan（实验计划）⭐ 新增

**字段说明**：
- `title` - 计划标题（必填）
- `experimentType` - 实验类型（必填）
- `experimentDate` - 实验日期（必填）
- `description` - 实验描述
- `status` - 计划状态（可选）
- `progress` - 进度（0-100，可选）
- `itemsNeeded` - 耗材清单（数组）
  - `name` - 耗材名称
  - `quantity` - 数量
  - `unit` - 单位
  - `specification` - 规格
  - `category` - 分类
  - `inventoryId` - 关联的库存 ID
  - `stockInfo` - 库存状态信息
- `labName` - 所属实验室（必填，自动从 JWT 获取）
- `createdBy` - 创建人 ID（自动从 JWT 获取）
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**状态说明**：
- 状态会根据日期自动判断，无需手动设置
- 未取消的计划根据 `experimentDate` 自动判断为"未开始"或"进行中"

### ShareRequest（耗材共享）⭐ 新增

**字段说明**：
- `title` - 标题（必填）
- `requestType` - 类型（必填）：`request`（我需要）/ `share`（我富余）
- `itemName` - 耗材名称（必填）
- `quantity` - 数量（必填）
- `expectedTime` - 期望时间（必填）
- `description` - 描述
- `status` - 状态：`urgent`（紧急）/ `normal`（一般）
- `publisher` - 发布者（关联到 User）
- `labName` - 所属实验室
- `createdAt` - 创建时间
- `consultCount` - 咨询次数

### Inventory 状态值
- `normal` - 正常
- `low_stock` - 低库存
- `expired` - 已过期
- `expiring_soon` - 即将过期（30天内）
- `out_of_stock` - 缺货

### Transaction 流水类型
- `purchase_in` - 采购入库
- `return_in` - 归还入库
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

### 实验计划业务逻辑 ⭐

#### 创建计划时的库存联动
```javascript
// 1. 匹配耗材名称查找库存
const inventory = await Inventory.findOne({
  name: item.name,
  labName: labName
})

// 2. 扣减库存
await Inventory.findByIdAndUpdate(
  inventory._id,
  { $inc: { quantity: -item.quantity } }
)

// 3. 创建出库流水
await Transaction.create({
  inventoryId: inventory._id,
  type: 'consume_out',
  quantity: -item.quantity,
  // ... 其他字段
})
```

#### 取消计划时的库存归还
```javascript
// 1. 归还所有耗材
for (const item of plan.itemsNeeded) {
  await Inventory.findByIdAndUpdate(
    item.inventoryId,
    { $inc: { quantity: item.quantity } }
  )

  // 2. 创建入库流水
  await Transaction.create({
    inventoryId: item.inventoryId,
    type: 'use_out',
    quantity: item.quantity,
    // ...
  })
}

// 3. 删除计划
await ExperimentPlan.findByIdAndDelete(planId)
```

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
- ✅ **实验计划管理** ⭐ 新增
- ✅ **耗材共享协作** ⭐ 新增
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
