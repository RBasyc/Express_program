const aiChatServices = require('../../services/AiChatServices/AiChatServices.js');
const JWT = require('../../utils/JWT');

/**
 * AI 聊天控制器
 * 负责 HTTP 请求处理和响应格式化
 */
const AiChatController = {
    /**
     * AI 聊天接口
     * POST /ai/chat
     */
    chat: async (req, res) => {
        try {
            // 从 token 中获取用户信息
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const labName = payload?.labName;

            console.log('📝 AI 聊天请求 - labName:', labName);

            if (!labName) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '用户未关联实验室'
                });
            }

            const { message, conversationHistory } = req.body;

            // 验证必填字段
            if (!message || typeof message !== 'string') {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '请输入有效的消息内容'
                });
            }

            // 限制消息长度（防止 token 滥用）
            if (message.length > 2000) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '消息长度不能超过2000字符'
                });
            }

            // 验证对话历史格式
            if (conversationHistory && !Array.isArray(conversationHistory)) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '对话历史格式错误'
                });
            }

            // 调用 AI 服务
            const result = await aiChatServices.chat({
                message,
                conversationHistory: conversationHistory || []
            }, labName);

            if (!result.success) {
                return res.status(500).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } catch (error) {
            console.error('AI 聊天错误:', error);
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || 'AI 服务暂时不可用'
            });
        }
    },

    /**
     * 获取配置状态（用于调试）
     * GET /ai/config
     */
    getConfig: async (req, res) => {
        try {
            const validation = aiChatServices.validateConfig();

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: {
                    configured: validation.valid,
                    errors: validation.errors
                }
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取配置失败'
            });
        }
    }
};

module.exports = AiChatController;
