# AI 聊天功能测试指南

## 功能概述

AI 聊天功能已成功接入 DeepSeek API，支持以下核心功能：

1. **实验计划解析**：将非结构化实验文本转化为结构化耗材需求
2. **库存智能预警**：分析库存状态，提供过期和低库存预警
3. **采购建议生成**：基于库存和实验计划生成采购清单
4. **Token 成本控制**：优化的 prompt 设计，控制 API 调用成本

## 使用前配置

### 1. 配置 DeepSeek API Key

编辑 `no1_express/.env` 文件，将您的 DeepSeek API Key 填入：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**获取 API Key**：
1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制 API Key 到 `.env` 文件

### 2. 启动后端服务

```bash
cd no1_express
npm run dev
```

服务将在 `http://localhost:3000` 启动

### 3. 启动前端服务

```bash
cd no-nutui
npm run dev:weapp
```

使用微信开发者工具打开项目

## 测试步骤

### 后端 API 测试

#### 1. 检查配置状态

```bash
curl http://localhost:3000/ai/config
```

预期响应：
```json
{
  "errCode": "0",
  "errorInfo": "success",
  "data": {
    "configured": true,
    "errors": []
  }
}
```

#### 2. 测试聊天接口（需要 token）

```bash
# 先登录获取 token
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{"nickName":"test","password":"123456"}'

# 使用返回的 token 测试 AI 聊天
curl -X POST http://localhost:3000/ai/chat \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "帮我看看有没有即将过期的试剂",
    "conversationHistory": []
  }'
```

### 前端功能测试

#### 1. 测试实验计划解析

**输入**：
```
下周开始做 Western Blot 实验，需要准备：
- RIPA裂解液 50mL
- BCA蛋白定量试剂盒 1盒
- 胰蛋白酶 3瓶
```

**预期输出**：
- AI 返回结构化的耗材清单
- 包含耗材名称、规格、数量、分类

#### 2. 测试库存预警

**输入**：
```
帮我看看有没有即将过期的试剂
```

**预期输出**：
- 显示已过期耗材列表
- 显示即将过期耗材列表（剩余天数）
- 显示低库存耗材
- 提供使用建议

#### 3. 测试采购建议

**输入**：
```
根据库存情况给我一个采购清单
```

**预期输出**：
- 按优先级排序的采购清单
- 建议采购数量
- 采购原因
- 预估成本

#### 4. 测试错误处理

**测试场景**：
- 网络断开时发送消息
- 后端服务未启动时发送消息
- API Key 配置错误时发送消息

**预期输出**：
- 显示友好的错误提示
- 提供排查建议

## API 端点说明

### POST /ai/chat

**请求头**：
```
Authorization: <JWT_TOKEN>
Content-Type: application/json
```

**请求体**：
```json
{
  "message": "用户消息内容",
  "conversationHistory": [
    {"role": "user", "content": "历史消息1"},
    {"role": "assistant", "content": "历史回复1"}
  ]
}
```

**响应**：
```json
{
  "errCode": "0",
  "errorInfo": "success",
  "data": {
    "response": {
      "type": "inventory_analysis",
      "alerts": {...},
      "recommendations": [...],
      "summary": "库存状况总结"
    },
    "usage": {
      "prompt_tokens": 1500,
      "completion_tokens": 300,
      "total_tokens": 1800
    }
  }
}
```

### GET /ai/config

检查 AI 服务配置状态（用于调试）

### GET /ai/history

获取聊天历史（暂未实现，返回空数组）

## 常见问题

### 1. API Key 未配置

**错误信息**：`DeepSeek API Key 未配置，请在 .env 文件中设置 DEEPSEEK_API_KEY`

**解决方法**：
1. 检查 `.env` 文件是否存在
2. 确认 `DEEPSEEK_API_KEY` 已设置真实值
3. 重启后端服务

### 2. API 密钥无效

**错误信息**：`API密钥无效或已过期，请检查 DEEPSEEK_API_KEY 配置`

**解决方法**：
1. 检查 API Key 是否正确复制
2. 确认 API Key 未过期
3. 访问 DeepSeek 平台检查账户状态

### 3. 网络连接失败

**错误信息**：`无法连接到 DeepSeek 服务，请检查网络连接`

**解决方法**：
1. 检查服务器网络连接
2. 确认可以访问 `https://api.deepseek.com`
3. 检查防火墙设置

### 4. Token 超限

**错误信息**：`API调用频率超限，请稍后重试`

**解决方法**：
1. 等待一段时间后重试
2. 检查 DeepSeek 账户配额
3. 考虑升级账户套餐

## Token 优化说明

本实现已进行以下优化以控制成本：

1. **System Prompt 优化**：约 1200 tokens
2. **上下文控制**：仅保留最近 6 轮对话
3. **JSON 响应**：要求 AI 返回结构化数据，减少输出
4. **意图预判**：仅查询需要的库存数据

**预计成本**：
- 每次调用约 1500-3000 tokens
- DeepSeek 定价：¥0.001/1K tokens（输入），¥0.002/1K tokens（输出）
- 单次调用成本：约 ¥0.003-¥0.006

## 文件结构

### 后端新增文件
```
no1_express/
├── .env                          # 环境变量配置（需手动配置 API Key）
├── utils/
│   └── config.js                 # 配置读取工具
├── utils/
│   └── promptTemplates.js        # Prompt 模板管理
├── services/AiChatServices/
│   ├── DeepSeekService.js        # DeepSeek API 封装
│   └── AiChatServices.js         # AI 聊天业务逻辑
├── controller/AiChatController/
│   └── AiChatController.js       # AI 聊天控制器
└── routes/AiChatRoute/
    └── AiChatRoute.js            # AI 聊天路由
```

### 前端修改文件
```
no-nutui/src/pages/ai-chat/
└── ai-chat.vue                   # AI 聊天页面（已集成真实 API）
```

## 后续优化建议

1. **对话历史持久化**：将对话历史保存到数据库
2. **流式响应**：实现 SSE 或 WebSocket，提升用户体验
3. **缓存机制**：对常见问题实现缓存，减少 API 调用
4. **用户限流**：防止恶意调用导致费用激增
5. **多模型支持**：架构支持切换到其他 AI 模型

## 技术支持

如有问题，请检查：
1. 后端服务日志：`no1_express/` 目录下运行日志
2. 前端控制台：微信开发者工具 Console
3. 网络请求：微信开发者工具 Network 标签

## 更新日志

**2025-03-11**：
- ✅ 完成 DeepSeek API 集成
- ✅ 实现实验计划解析功能
- ✅ 实现库存智能预警功能
- ✅ 实现采购建议生成功能
- ✅ 优化 Token 使用，控制成本
- ✅ 完善错误处理和降级方案
