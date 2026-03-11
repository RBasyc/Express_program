const DeepSeekService = require('./DeepSeekService');
const { getSystemPrompt } = require('../../utils/promptTemplates');

/**
 * AI 聊天业务服务（优化版 - 智能查询）
 *
 * 核心优化：根据用户问题智能选择查询工具，避免查询大量不必要的数据
 *
 * Token 对比：
 * - 传统方式：5000-10000 tokens（查询所有数据）
 * - 智能查询：500-1500 tokens（只查询需要的数据）
 *
 * 节省：80-90% 的 Token 消耗！
 */
const aiChatServices = {
    /**
     * 处理 AI 聊天请求
     */
    chat: async (params, labName) => {
        const { message, conversationHistory = [] } = params;

        // 1. 分析用户意图，决定使用哪个查询工具
        const intent = await aiChatServices.analyzeIntent(message);

        // 2. 根据意图智能查询（只获取需要的数据）
        let enhancedSystemPrompt = getSystemPrompt();

        if (intent.needsInventoryData && labName) {
            // 使用 MCP HTTP 服务器查询库存
            console.log('📡 使用 MCP HTTP 服务器查询库存...');
            const inventoryData = await aiChatServices.mcpQuery(intent, labName);

            if (inventoryData && !inventoryData.error) {
                // 将查询结果格式化为 AI 可理解的文本
                console.log('✅ MCP 查询成功');
                console.log('📦 库存数据:', JSON.stringify(inventoryData, null, 2));
                const formattedData = aiChatServices.formatInventoryForAI(inventoryData);
                enhancedSystemPrompt += `\n\n## 库存查询结果\n${formattedData}`;
                console.log('📝 注入后的 Prompt 长度:', enhancedSystemPrompt.length);
                console.log('📝 注入的内容预览:', enhancedSystemPrompt.slice(-500));
            } else if (inventoryData?.error) {
                console.error('⚠️⚠️⚠️ MCP 查询失败 ⚠️⚠️⚠️');
                console.error('错误信息:', inventoryData.error);
                console.error('请确保 MCP HTTP 服务器正在运行: cd mcp && npm start');
            }
        }

        // 3. 构建消息（包含对话历史）
        const messages = DeepSeekService.buildMessages(
            enhancedSystemPrompt,
            message,
            conversationHistory,
            6 // 保留最近6轮对话
        );

        // 4. 调用 DeepSeek API
        const apiResponse = await DeepSeekService.chat(messages);

        if (!apiResponse.success) {
            return {
                success: false,
                message: apiResponse.error
            };
        }

        // 5. 尝试解析 AI 返回的 JSON
        let parsedResponse;
        try {
            const content = apiResponse.data.content;
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                             content.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                parsedResponse = JSON.parse(jsonStr);
            } else {
                parsedResponse = {
                    type: 'text',
                    content: content
                };
            }
        } catch (error) {
            console.warn('解析 AI 响应 JSON 失败，返回原始文本:', error.message);
            parsedResponse = {
                type: 'text',
                content: apiResponse.data.content
            };
        }

        return {
            success: true,
            data: {
                response: parsedResponse,
                usage: apiResponse.data.usage,
                rawContent: apiResponse.data.content
            }
        };
    },

    /**
     * 分析用户意图（智能版）
     */
    analyzeIntent: async (message) => {
        if (!message) {
            return { needsInventoryData: false, intentType: 'unknown' };
        }

        const lowerMessage = message.toLowerCase();
        let intentType = 'general_chat';
        let needsInventoryData = false;
        let queryType = 'none';
        let mentionedItems = [];

        // 常见耗材关键词
        const commonItems = ['胰蛋白酶', 'ripa', 'bca', 'pvdf', 'sds', 'pbs', 'edta',
                            '抗体', '试剂盒', '培养基', '离心管', '移液枪头', 'pcr',
                            '酶', '缓冲液', '试剂', '膜', '凝胶'];

        // 检测特定耗材名称
        commonItems.forEach(item => {
            if (lowerMessage.includes(item.toLowerCase())) {
                mentionedItems.push(item);
            }
        });

        // 意图分类（按优先级）
        if (lowerMessage.includes('库存') && (lowerMessage.includes('概况') || lowerMessage.includes('总计') || lowerMessage.includes('多少项'))) {
            queryType = 'summary';
            needsInventoryData = true;
        } else if (lowerMessage.includes('过期') && (lowerMessage.includes('已过') || lowerMessage.includes('已经'))) {
            queryType = 'expired';
            needsInventoryData = true;
        } else if (lowerMessage.includes('过期') && (lowerMessage.includes('即将') || lowerMessage.includes('快要') || lowerMessage.includes('快'))) {
            queryType = 'expiring';
            needsInventoryData = true;
        } else if (lowerMessage.includes('过期')) {
            queryType = 'expiring';
            needsInventoryData = true;
        } else if (lowerMessage.includes('缺货') || lowerMessage.includes('没有') || lowerMessage.includes('用完')) {
            queryType = 'out_of_stock';
            needsInventoryData = true;
        } else if (lowerMessage.includes('不够') || lowerMessage.includes('不足') || lowerMessage.includes('缺少')) {
            queryType = 'low_stock';
            needsInventoryData = true;
        } else if (lowerMessage.includes('采购') || lowerMessage.includes('买') || lowerMessage.includes('补货')) {
            queryType = 'purchase';
            needsInventoryData = true;
        } else if (mentionedItems.length > 0) {
            queryType = 'specific';
            needsInventoryData = true;
        } else if (lowerMessage.includes('还剩') || lowerMessage.includes('有多少') || lowerMessage.includes('够不够')) {
            queryType = 'check';
            needsInventoryData = true;
        } else if (lowerMessage.includes('库存') || lowerMessage.includes('实验')) {
            queryType = 'summary';
            needsInventoryData = true;
        }

        return {
            needsInventoryData,
            intentType,
            queryType,
            mentionedItems
        };
    },

    /**
     * MCP 工具查询 - 使用 MCP HTTP 服务器进行查询
     */
    mcpQuery: async (intent, labName) => {
        // 根据意图调用相应的 MCP 工具
        switch (intent.queryType) {
            case 'summary':
                return await aiChatServices.mcpQueryInventorySummary(labName);
            case 'expired':
                return await aiChatServices.mcpQueryExpiredItems(labName, 5);
            case 'expiring':
                return await aiChatServices.mcpQueryExpiringItems(labName, 30, 10);
            case 'low_stock':
                return await aiChatServices.mcpQueryLowStockItems(labName);
            case 'out_of_stock':
                return await aiChatServices.mcpQueryOutOfStockItems(labName);
            case 'specific':
                if (intent.mentionedItems.length > 0) {
                    return await aiChatServices.mcpSearchInventory(labName, intent.mentionedItems[0]);
                }
                return await aiChatServices.mcpQueryInventorySummary(labName);
            case 'check':
            case 'purchase':
                return await aiChatServices.mcpQueryPurchaseSuggestions(labName);
            default:
                return await aiChatServices.mcpQueryInventorySummary(labName);
        }
    },

    /**
     * MCP: 查询库存摘要
     */
    mcpQueryInventorySummary: async (labName) => {
        const result = await DeepSeekService.callMcpTool('inventory-summary', { labName });
        if (result.success) {
            return {
                queryType: result.queryType,
                data: result.data
            };
        }
        return { error: result.error || 'MCP 查询失败' };
    },

    /**
     * MCP: 查询已过期耗材
     */
    mcpQueryExpiredItems: async (labName, limit) => {
        const result = await DeepSeekService.callMcpTool('expired-items', { labName, limit });
        if (result.success) {
            return {
                queryType: 'expired',
                count: result.items.length,
                items: result.items
            };
        }
        return { error: result.error || 'MCP 查询失败' };
    },

    /**
     * MCP: 查询即将过期耗材
     */
    mcpQueryExpiringItems: async (labName, days, limit) => {
        const result = await DeepSeekService.callMcpTool('expiring-items', { labName, days, limit });
        if (result.success) {
            return {
                queryType: 'expiring',
                count: result.items.length,
                items: result.items
            };
        }
        return { error: result.error || 'MCP 查询失败' };
    },

    /**
     * MCP: 查询库存不足耗材
     */
    mcpQueryLowStockItems: async (labName) => {
        const result = await DeepSeekService.callMcpTool('low-stock-items', { labName });
        if (result.success) {
            return {
                queryType: 'low_stock',
                count: result.items.length,
                items: result.items
            };
        }
        return { error: result.error || 'MCP 查询失败' };
    },

    /**
     * MCP: 查询缺货耗材
     */
    mcpQueryOutOfStockItems: async (labName) => {
        const result = await DeepSeekService.callMcpTool('out-of-stock-items', { labName });
        if (result.success) {
            return {
                queryType: 'out_of_stock',
                count: result.items.length,
                items: result.items
            };
        }
        return { error: result.error || 'MCP 查询失败' };
    },

    /**
     * MCP: 搜索库存
     */
    mcpSearchInventory: async (labName, keyword) => {
        const result = await DeepSeekService.callMcpTool('search-inventory', { labName, keyword });
        if (result.success) {
            return {
                queryType: 'specific',
                count: result.items.length,
                items: result.items
            };
        }
        return { error: result.error || 'MCP 查询失败' };
    },

    /**
     * MCP: 查询采购建议
     */
    mcpQueryPurchaseSuggestions: async (labName) => {
        const result = await DeepSeekService.callMcpTool('purchase-suggestions', { labName });
        if (result.success) {
            return {
                queryType: 'purchase',
                summary: result.summary,
                lowStock: result.lowStock || [],
                expiringSoon: result.expiringSoon || []
            };
        }
        return { error: result.error || 'MCP 查询失败' };
    },

    /**
     * 将查询结果格式化为 AI 可理解的文本
     */
    formatInventoryForAI: (inventoryData) => {
        if (inventoryData.error) {
            return '库存数据获取失败';
        }

        switch (inventoryData.queryType) {
            case 'summary':
                let summaryText = `库存概况：共 ${inventoryData.data.totalItems} 项耗材
- 正常：${inventoryData.data.normalItems} 项
- 已过期：${inventoryData.data.expired} 项
- 即将过期：${inventoryData.data.expiringSoon} 项
- 库存不足：${inventoryData.data.lowStock} 项
- 缺货：${inventoryData.data.outOfStock} 项`;

                // 如果有问题耗材，添加具体信息
                if (inventoryData.data.issueItems && inventoryData.data.issueItems.length > 0) {
                    summaryText += `\n\n🚨 需要注意的耗材：\n`;
                    inventoryData.data.issueItems.forEach((item, index) => {
                        const statusIcon = item.status === '已过期' ? '🔴' :
                                         item.status === '缺货' ? '❌' :
                                         item.status === '库存不足' ? '📉' :
                                         item.status === '即将过期' ? '⚠️' : '✅';
                        summaryText += `${index + 1}. ${statusIcon} ${item.name}：${item.quantity}`;
                        if (item.minQuantity) summaryText += `（最小库存：${item.minQuantity}）`;
                        if (item.expiryDate) summaryText += `，过期：${item.expiryDate}`;
                        summaryText += ` [${item.status}]\n`;
                    });
                }

                return summaryText;

            case 'expired':
                if (inventoryData.count === 0) return '✅ 没有已过期的耗材';
                let expiredText = `🔴 已过期耗材（${inventoryData.count}项）：\n`;
                inventoryData.items.forEach((item, index) => {
                    expiredText += `${index + 1}. ${item.name}：${item.quantity}${item.unit || ''}（${item.expiryDate}）\n`;
                });
                return expiredText;

            case 'expiring':
                if (inventoryData.count === 0) return '✅ 没有即将过期的耗材';
                let expiringText = `⚠️ 即将过期耗材（${inventoryData.count}项）：\n`;
                inventoryData.items.forEach((item, index) => {
                    expiringText += `${index + 1}. ${item.name}：${item.quantity}${item.unit || ''}（${item.daysLeft}天后，${item.expiryDate}）\n`;
                });
                return expiringText;

            case 'low_stock':
                if (inventoryData.count === 0) return '✅ 没有库存不足的耗材';
                let lowStockText = `📉 库存不足耗材（${inventoryData.count}项）：\n`;
                inventoryData.items.forEach((item, index) => {
                    lowStockText += `${index + 1}. ${item.name}：当前${item.current}，最小${item.min}（缺少${item.deficit}）\n`;
                });
                return lowStockText;

            case 'out_of_stock':
                if (inventoryData.count === 0) return '✅ 没有缺货耗材';
                let outText = `❌ 缺货耗材（${inventoryData.count}项）：\n`;
                inventoryData.items.forEach((item, index) => {
                    outText += `${index + 1}. ${item.name}\n`;
                });
                return outText;

            case 'specific':
                if (inventoryData.count === 0) return '未找到相关耗材';
                let specificText = `📦 查询结果（${inventoryData.count}项）：\n`;
                inventoryData.items.forEach((item, _index) => {
                    let icon = item.status === 'normal' ? '✅' : item.status === 'expired' ? '🔴' : item.status === 'low_stock' ? '📉' : '❌';
                    specificText += `${icon} ${item.name}：${item.quantity}`;
                    if (item.expiryDate) specificText += `，过期：${item.expiryDate}`;
                    specificText += '\n';
                });
                return specificText;

            case 'purchase':
                let purchaseText = `📊 库存概况：共 ${inventoryData.summary.totalItems} 项\n\n`;
                if (inventoryData.lowStock.length > 0) {
                    purchaseText += `📉 需要补货：\n`;
                    inventoryData.lowStock.forEach(item => {
                        purchaseText += `  • ${item.name}：缺少${item.deficit}\n`;
                    });
                    purchaseText += '\n';
                }
                if (inventoryData.expiringSoon.length > 0) {
                    purchaseText += `⚠️ 即将过期：\n`;
                    inventoryData.expiringSoon.forEach(item => {
                        purchaseText += `  • ${item.name}：${item.daysLeft}天后\n`;
                    });
                }
                return purchaseText;

            default:
                return JSON.stringify(inventoryData, null, 2);
        }
    },

    validateConfig: () => {
        return DeepSeekService.validateConfig();
    }
};

module.exports = aiChatServices;
