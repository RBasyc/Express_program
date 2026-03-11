const express = require('express');
const AiChatRouter = express.Router();
const AiChatController = require('../../controller/AiChatController/AiChatController.js');

/**
 * AI 聊天路由
 * 基础路径：/ai
 */

// AI 聊天接口
AiChatRouter.post('/chat', AiChatController.chat);

// 获取配置状态（用于调试）
AiChatRouter.get('/config', AiChatController.getConfig);

module.exports = AiChatRouter;
