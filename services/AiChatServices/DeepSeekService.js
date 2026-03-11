const axios = require('axios');
const config = require('../../utils/config');

/**
 * DeepSeek API 服务封装
 * 负责与 DeepSeek API 进行通信
 *
 * 新增功能：支持调用 MCP HTTP 服务器的工具
 */
class DeepSeekService {
    constructor() {
        this.apiBaseUrl = config.deepseek.apiBaseUrl;
        this.apiKey = config.deepseek.apiKey;
        this.model = config.deepseek.model;
        this.maxTokens = config.deepseek.maxTokens;
        this.temperature = config.deepseek.temperature;
    }

    /**
     * 调用 DeepSeek Chat API
     * @param {Array} messages - 对话历史 [{role: 'user'|'assistant', content: '...'}]
     * @param {Object} options - 可选配置
     * @returns {Promise<Object>} API 响应
     */
    async chat(messages, options = {}) {
        try {
            // 检查 API Key
            if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
                return {
                    success: false,
                    error: 'DeepSeek API Key 未配置，请在 .env 文件中设置 DEEPSEEK_API_KEY'
                };
            }

            const response = await axios.post(
                `${this.apiBaseUrl}/chat/completions`,
                {
                    model: this.model,
                    messages: messages,
                    max_tokens: options.maxTokens || this.maxTokens,
                    temperature: options.temperature || this.temperature,
                    stream: false
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    timeout: 30000 // 30秒超时
                }
            );

            return {
                success: true,
                data: {
                    content: response.data.choices[0].message.content,
                    usage: response.data.usage,
                    finishReason: response.data.choices[0].finish_reason
                }
            };
        } catch (error) {
            console.error('DeepSeek API 调用失败:', error.response?.data || error.message);

            // 错误处理
            if (error.response?.status === 401) {
                return {
                    success: false,
                    error: 'API密钥无效或已过期，请检查 DEEPSEEK_API_KEY 配置'
                };
            } else if (error.response?.status === 429) {
                return {
                    success: false,
                    error: 'API调用频率超限，请稍后重试'
                };
            } else if (error.response?.status === 400) {
                return {
                    success: false,
                    error: '请求参数错误：' + (error.response.data?.error?.message || '未知错误')
                };
            } else if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    error: 'API请求超时，请稍后重试'
                };
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    error: '无法连接到 DeepSeek 服务，请检查网络连接'
                };
            }

            return {
                success: false,
                error: error.message || 'AI服务暂时不可用'
            };
        }
    }

    /**
     * 估算 token 消耗
     * @param {string} text - 输入文本
     * @returns {number} 估算的 token 数量
     */
    estimateTokens(text) {
        if (!text) return 0;
        // 中文约1字符=0.5token，英文约1字符=0.25token
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const otherChars = text.length - chineseChars;
        return Math.ceil(chineseChars * 0.5 + otherChars * 0.25);
    }

    /**
     * 构建带上下文的对话消息
     * @param {string} systemPrompt - 系统提示词
     * @param {string} userMessage - 用户消息
     * @param {Array} conversationHistory - 对话历史
     * @param {number} maxHistoryLength - 最大历史条数
     * @returns {Array} 格式化的消息数组
     */
    buildMessages(systemPrompt, userMessage, conversationHistory = [], maxHistoryLength = 6) {
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // 添加最近的对谈历史（控制上下文长度）
        const recentHistory = conversationHistory.slice(-maxHistoryLength);
        messages.push(...recentHistory);

        // 添加当前用户消息
        messages.push({ role: 'user', content: userMessage });

        return messages;
    }

    /**
     * 验证配置是否正确
     * @returns {Object} 验证结果
     */
    validateConfig() {
        const errors = [];

        if (!this.apiKey) {
            errors.push('DEEPSEEK_API_KEY 未配置');
        } else if (this.apiKey === 'your_deepseek_api_key_here') {
            errors.push('DEEPSEEK_API_KEY 仍为默认值，请设置真实的 API Key');
        }

        if (!this.apiBaseUrl) {
            errors.push('DEEPSEEK_API_BASE_URL 未配置');
        }

        if (!this.model) {
            errors.push('DEEPSEEK_MODEL 未配置');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 调用 MCP HTTP 服务器的工具
     * @param {string} toolName - 工具名称
     * @param {Object} params - 工具参数
     * @returns {Promise<Object>} 工具执行结果
     */
    async callMcpTool(toolName, params) {
        const MCP_BASE_URL = process.env.MCP_HTTP_URL || 'http://localhost:3001';

        try {
            const response = await axios.get(`${MCP_BASE_URL}/tools/${toolName}`, {
                params: params,
                timeout: 5000 // 5秒超时
            });

            return response.data;
        } catch (error) {
            console.error(`MCP 工具调用失败 (${toolName}):`, error.message);
            return {
                success: false,
                error: `MCP 工具调用失败: ${error.message}`
            };
        }
    }

    /**
     * 检查 MCP HTTP 服务器是否可用
     * @returns {Promise<boolean>} 服务器是否可用
     */
    async checkMcpServerHealth() {
        const MCP_BASE_URL = process.env.MCP_HTTP_URL || 'http://localhost:3001';

        try {
            const response = await axios.get(`${MCP_BASE_URL}/health`, {
                timeout: 2000
            });
            return response.data?.status === 'ok';
        } catch (error) {
            console.warn('MCP HTTP 服务器不可用:', error.message);
            return false;
        }
    }
}

// 导出单例
module.exports = new DeepSeekService();
