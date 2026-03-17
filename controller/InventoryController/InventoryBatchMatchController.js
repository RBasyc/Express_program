/**
 * 批量匹配耗材接口
 * 用于 AI 生成的实验计划耗材匹配
 */

const Inventory = require('../../models/InventoryModel/InventoryModel')
const JWT = require('../../utils/JWT')

// 批量匹配耗材
const batchMatchItems = async (req, res) => {
    try {
        const { items } = req.body

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                errCode: '-1',
                errorInfo: '耗材列表不能为空'
            })
        }

        // 获取实验室名称（从 JWT token 中）
        const token = req.headers['authorization']
        const payload = JWT.verify(token)
        const labName = payload?.labName

        if (!labName) {
            return res.status(400).json({
                errCode: '-1',
                errorInfo: '无法确定实验室信息'
            })
        }

        // 查询所有在库的耗材（包含已售罄的）
        const allInventory = await Inventory.find({ labName }).lean()

        console.log(`🔍 批量匹配: 实验室 ${labName}，待匹配 ${items.length} 项耗材，库存中共 ${allInventory.length} 项`)

        // 对每个待匹配的耗材进行匹配
        const matchedResults = items.map((item, index) => {
            const itemName = (item.name || `耗材${index + 1}`).trim()

            // 三级匹配策略
            let matchedInventory = null
            let matchMethod = ''

            // 1. 精确匹配
            matchedInventory = allInventory.find((inv) => inv.name === itemName)
            if (matchedInventory) {
                matchMethod = '精确匹配'
            }

            // 2. 包含匹配（如果精确匹配失败）
            if (!matchedInventory) {
                const candidates = allInventory.filter(
                    (inv) => inv.name.includes(itemName) || itemName.includes(inv.name)
                )

                if (candidates.length > 0) {
                    // 选择名称最短的（更精确）
                    matchedInventory = candidates.reduce((prev, curr) =>
                        prev.name.length < curr.name.length ? prev : curr
                    )
                    matchMethod = '包含匹配'
                }
            }

            // 3. 模糊匹配（如果包含匹配失败）
            if (!matchedInventory) {
                // 去掉常见后缀再匹配
                const simplifiedNames = [
                    itemName.replace(/\s*\d+.*$/, ''), // 去掉数字
                    itemName.replace(/\([^)]*\)/g, ''), // 去掉英文括号内容
                    itemName.replace(/（[^）]*）/g, ''), // 去掉中文括号内容
                    itemName.split(/\s+/)[0], // 只取第一个词
                    itemName.replace(/[_mlmgkgL升毫升克个]/g, '') // 去掉单位
                ].filter(name => name && name.length >= 2) // 过滤掉太短的

                for (const simpleName of simplifiedNames) {
                    const candidate = allInventory.find((inv) => inv.name.includes(simpleName))
                    if (candidate) {
                        matchedInventory = candidate
                        matchMethod = '模糊匹配'
                        break
                    }
                }
            }

            // 返回匹配结果
            if (matchedInventory) {
                console.log(`  ✅ "${itemName}" → "${matchedInventory.name}" (${matchMethod})`)
                return {
                    originalName: itemName,
                    matched: true,
                    matchMethod,
                    inventory: {
                        id: matchedInventory._id.toString(),
                        name: matchedInventory.name,
                        quantity: matchedInventory.quantity,
                        unit: matchedInventory.unit || '',
                        specification: matchedInventory.specification || '',
                        category: matchedInventory.category || '其他'
                    }
                }
            } else {
                console.warn(`  ❌ "${itemName}" 未匹配到库存`)
                return {
                    originalName: itemName,
                    matched: false,
                    matchMethod: '无',
                    inventory: null
                }
            }
        })

        // 统计匹配结果
        const matchedCount = matchedResults.filter(r => r.matched).length
        const unmatchedCount = matchedResults.length - matchedCount

        console.log(`📊 匹配完成: 成功 ${matchedCount}/${matchedResults.length}，失败 ${unmatchedCount}`)

        res.json({
            errCode: '0',
            errorInfo: 'success',
            data: {
                results: matchedResults,
                summary: {
                    total: matchedResults.length,
                    matched: matchedCount,
                    unmatched: unmatchedCount
                }
            }
        })
    } catch (error) {
        console.error('批量匹配耗材失败:', error)
        res.status(500).json({
            errCode: '-1',
            errorInfo: '批量匹配失败: ' + error.message
        })
    }
}

module.exports = {
    batchMatchItems
}
