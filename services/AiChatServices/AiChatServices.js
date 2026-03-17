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
            console.log('📡 使用查询库存...', intent.queryType);
            const inventoryData = await aiChatServices.mcpQuery(intent, labName);

            if (inventoryData && !inventoryData.error) {
                // 将查询结果格式化为 AI 可理解的文本
                console.log('✅ 查询成功，类型:', inventoryData.queryType);
                if (inventoryData.queryType === 'all_inventory') {
                    console.log('📦 仓库耗材数量:', inventoryData.count);
                }
                const formattedData = aiChatServices.formatInventoryForAI(inventoryData);
                enhancedSystemPrompt += `\n\n## 当前库存数据\n${formattedData}`;
                console.log('📝 注入后的 Prompt 长度:', enhancedSystemPrompt.length);
            } else if (inventoryData?.error) {
                console.error('⚠️⚠️⚠️ 查询失败 ⚠️⚠️⚠️');
                console.error('错误信息:', inventoryData.error);
            }
        }

        // 3. 注入当前日期信息（用于解析相对日期）
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekDay = weekDays[today.getDay()];
        enhancedSystemPrompt += `\n\n## 当前日期信息\n- 今天：${todayStr}（星期${weekDay}）`;

        // 4. 构建消息（包含对话历史）
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
     * 分析用户意图（混合智能版 - 规则快速通道 + LLM 智能判断）
     */
    analyzeIntent: async (message) => {
        if (!message) {
            return {
                needsInventoryData: false,
                intentType: 'unknown',
                method: 'none'
            };
        }

        const lowerMessage = message.toLowerCase();

        // ========== 第一步：规则快速通道 ==========
        // 超级明确的查询，用规则（快速响应，避免 LLM 调用）

        const fastRules = [
            {
                keywords: ['库存概况', '库存总计', '库存多少项', '有多少种耗材'],
                intent: 'inventory_check',
                queryType: 'summary',
                needsInventoryData: true,
                confidence: 1.0
            },
            {
                keywords: ['已过期', '已经过期', '过期了'],
                intent: 'expiring_check',
                queryType: 'expired',
                needsInventoryData: true,
                confidence: 1.0
            },
            {
                keywords: ['缺货', '没有库存', '用完', '用光了'],
                intent: 'stock_issue',
                queryType: 'out_of_stock',
                needsInventoryData: true,
                confidence: 1.0
            },
            {
                keywords: ['不够', '不足', '缺少', '不够用'],
                intent: 'stock_issue',
                queryType: 'low_stock',
                needsInventoryData: true,
                confidence: 1.0
            },
            {
                keywords: ['采购', '买', '补货', '订购', '进货'],
                intent: 'purchase_request',
                queryType: 'purchase',
                needsInventoryData: true,
                confidence: 1.0
            },
            {
                keywords: ['实验计划', '准备实验', '要做实验', '要做', '需要'],
                intent: 'experiment_plan',
                queryType: 'experiment_plan',
                needsInventoryData: true,
                confidence: 1.0
            }
        ];

        // 检查快速规则
        for (const rule of fastRules) {
            if (rule.keywords.some(keyword => lowerMessage.includes(keyword))) {
                console.log(`✅ 规则快速匹配: ${rule.intent} (confidence: ${rule.confidence})`);
                return {
                    needsInventoryData: rule.needsInventoryData,
                    intentType: rule.intent,
                    queryType: rule.queryType,
                    confidence: rule.confidence,
                    method: 'rule'
                };
            }
        }

        // ========== 第二步：LLM 智能判断 ==========
        // 复杂或模糊的意图，使用 LLM（智能判断）

        console.log('🤖 触发 LLM 意图检测...');
        const llmResult = await DeepSeekService.detectIntentWithLLM(message);

        if (llmResult.success) {
            console.log(`✅ LLM 意图检测: ${llmResult.intent} (confidence: ${llmResult.confidence})`);
            console.log(`   理由: ${llmResult.reasoning}`);
            if (llmResult.mentionedItems.length > 0) {
                console.log(`   提及的耗材: ${llmResult.mentionedItems.join(', ')}`);
            }

            // 将 LLM 意图映射到 queryType
            const queryTypeMapping = {
                'experiment_plan': 'experiment_plan',
                'inventory_check': 'summary',
                'expiring_check': 'expiring',
                'stock_issue': 'low_stock',
                'purchase_request': 'purchase',
                'general_chat': 'none'
            };

            return {
                needsInventoryData: llmResult.intent !== 'general_chat',
                intentType: llmResult.intent,
                queryType: queryTypeMapping[llmResult.intent] || 'summary',
                confidence: llmResult.confidence,
                mentionedItems: llmResult.mentionedItems,
                reasoning: llmResult.reasoning,
                method: 'llm'
            };
        } else {
            console.warn('⚠️ LLM 意图检测失败，回退到规则判断:', llmResult.error);
            // LLM 失败时回退到基础规则
            return aiChatServices.fallbackRuleBasedIntent(message);
        }
    },

    /**
     * 回退规则：基础规则判断（当 LLM 不可用时）
     */
    fallbackRuleBasedIntent: (message) => {
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

        // 基础意图分类
        if (lowerMessage.includes('实验') || lowerMessage.includes('计划')) {
            queryType = 'experiment_plan';
            needsInventoryData = true;
            intentType = 'experiment_plan';
        } else if (lowerMessage.includes('库存')) {
            queryType = 'summary';
            needsInventoryData = true;
            intentType = 'inventory_check';
        } else if (lowerMessage.includes('过期')) {
            queryType = 'expiring';
            needsInventoryData = true;
            intentType = 'expiring_check';
        } else if (lowerMessage.includes('还剩') || lowerMessage.includes('有多少')) {
            queryType = 'check';
            needsInventoryData = true;
            intentType = 'inventory_check';
        } else if (mentionedItems.length > 0) {
            queryType = 'specific';
            needsInventoryData = true;
            intentType = 'inventory_check';
        }

        console.log(`📋 回退规则判断: ${intentType} (queryType: ${queryType})`);

        return {
            needsInventoryData,
            intentType,
            queryType,
            mentionedItems,
            confidence: 0.5,
            method: 'fallback_rule'
        };
    },

    /**
     * MCP 工具查询 - 使用 MCP HTTP 服务器进行查询
     */
    mcpQuery: async (intent, labName) => {
        // 根据意图调用相应的 MCP 工具
        switch (intent.queryType) {
            case 'experiment_plan':
                // 实验计划需要完整的库存列表来匹配耗材
                return await aiChatServices.mcpQueryAllInventory(labName);
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
     * MCP: 查询所有库存（用于实验计划解析）
     * 获取完整的库存列表，包括所有耗材的名称、规格、数量等信息
     */
    mcpQueryAllInventory: async (labName) => {
        // 这里我们直接查询数据库，因为MCP工具可能没有返回完整列表
        try {
            const { Inventory } = require('../../models/index.js');

            // 查询所有库存项，只返回必要字段以减少token消耗
            const items = await Inventory.find({ labName })
                .select('name specification quantity unit category status expiryDate minQuantity')
                .lean(); // 使用 lean() 返回普通对象，减少内存

            return {
                queryType: 'all_inventory',
                count: items.length,
                items: items.map(item => ({
                    name: item.name,
                    specification: item.specification || '',
                    quantity: item.quantity,
                    unit: item.unit || '',
                    category: item.category || '其他',
                    status: item.status,
                    expiryDate: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
                    minQuantity: item.minQuantity || 0,
                    available: item.quantity > (item.minQuantity || 0) // 可用状态
                }))
            };
        } catch (error) {
            console.error('查询所有库存失败:', error);
            return { error: '查询库存失败' };
        }
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
            case 'all_inventory':
                // 为实验计划格式化完整库存列表
                if (inventoryData.count === 0) {
                    return '⚠️ 仓库中暂无耗材，请先添加耗材';
                }

                let inventoryText = `📦 仓库耗材清单（共${inventoryData.count}项）：\n\n`;

                // 按分类分组显示
                const grouped = {};
                inventoryData.items.forEach(item => {
                    if (!grouped[item.category]) {
                        grouped[item.category] = [];
                    }
                    grouped[item.category].push(item);
                });

                // 格式化每个分类
                Object.keys(grouped).sort().forEach(category => {
                    inventoryText += `【${category}】\n`;
                    grouped[category].forEach(item => {
                        const statusIcon = !item.available ? '❌' :
                                         item.status === 'expired' ? '🔴' :
                                         item.status === 'expiring_soon' ? '⚠️' : '✅';
                        inventoryText += `  ${statusIcon} ${item.name}`;
                        if (item.specification) {
                            inventoryText += `（${item.specification}）`;
                        }
                        inventoryText += `：库存 ${item.quantity}${item.unit}`;
                        if (!item.available) {
                            inventoryText += ` [不足，最小库存:${item.minQuantity}${item.unit}]`;
                        }
                        if (item.expiryDate) {
                            inventoryText += `，过期:${item.expiryDate}`;
                        }
                        inventoryText += `\n`;
                    });
                    inventoryText += `\n`;
                });

                inventoryText += `⚠️ 注意：只能解析仓库中存在的耗材，请检查库存数量是否足够`;

                return inventoryText;

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
