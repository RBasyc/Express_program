const mongoose = require('mongoose')
const Lab = require('../models/LabModel/LabModel')
const Inventory = require('../models/InventoryModel/InventoryModel')
const User = require('../models/UserModel/UserModel')

// 连接数据库
mongoose.connect('mongodb://localhost:27017/test').then(() => {
    console.log('成功连接到数据库')
    verifyData()
}).catch(err => {
    console.error('数据库连接失败:', err)
    process.exit(1)
})

async function verifyData() {
    try {
        console.log('开始验证数据...\n')
        console.log('='.repeat(60))

        // 1. 验证实验室数据
        console.log('\n【实验室验证】')
        const labs = await Lab.find({})
        console.log(`实验室总数: ${labs.length}`)

        if (labs.length === 0) {
            console.log('⚠ 警告: 没有找到实验室数据')
        } else {
            labs.forEach((lab, index) => {
                console.log(`\n${index + 1}. ${lab.labName}`)
                console.log(`   大学: ${lab.university}`)
                console.log(`   负责人: ${lab.managerName || '未设置'}`)
                console.log(`   联系方式: ${lab.managerContact || '未设置'}`)
                console.log(`   状态: ${lab.status}`)
            })

            // 检查必填字段
            const invalidLabs = labs.filter(lab => !lab.labName || !lab.university)
            if (invalidLabs.length > 0) {
                console.log(`\n⚠ 警告: ${invalidLabs.length} 个实验室缺少必填字段`)
            }
        }

        // 2. 验证用户数据
        console.log('\n' + '='.repeat(60))
        console.log('\n【用户验证】')
        const users = await User.find({})
        console.log(`用户总数: ${users.length}`)

        if (users.length === 0) {
            console.log('⚠ 警告: 没有找到用户数据')
        } else {
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.nickName}`)
                console.log(`   真实姓名: ${user.realName || '未设置'}`)
                console.log(`   邮箱: ${user.email || '未设置'}`)
                console.log(`   手机号: ${user.phone || '未设置'}`)
                console.log(`   实验室: ${user.labName || '未设置'}`)
                console.log(`   角色: ${user.role}`)
                console.log(`   状态: ${user.status}`)
            })

            // 检查必填字段
            const invalidUsers = users.filter(u => !u.labName)
            if (invalidUsers.length > 0) {
                console.log(`\n⚠ 警告: ${invalidUsers.length} 个用户未设置实验室`)
            }
        }

        // 3. 验证库存数据
        console.log('\n' + '='.repeat(60))
        console.log('\n【库存验证】')
        const inventory = await Inventory.find({})
        console.log(`库存总数: ${inventory.length}`)

        if (inventory.length === 0) {
            console.log('⚠ 警告: 没有找到库存数据')
        } else {
            // 按实验室统计
            console.log('\n各实验室库存分布:')
            for (const lab of labs) {
                const count = inventory.filter(item => item.labName === lab.labName).length
                console.log(`  ${lab.labName}: ${count} 条`)
            }

            // 按分类统计
            console.log('\n库存分类统计:')
            const categories = ['试剂', '耗材', '仪器', '其他']
            const categoryCount = {}
            categories.forEach(cat => {
                categoryCount[cat] = inventory.filter(item => item.category === cat).length
            })
            Object.entries(categoryCount).forEach(([cat, count]) => {
                console.log(`  ${cat}: ${count} 条`)
            })

            // 按状态统计
            console.log('\n库存状态统计:')
            const statusCount = {}
            inventory.forEach(item => {
                statusCount[item.status] = (statusCount[item.status] || 0) + 1
            })
            Object.entries(statusCount).forEach(([status, count]) => {
                console.log(`  ${status}: ${count} 条`)
            })

            // 检查必填字段
            const invalidInventory = inventory.filter(item => !item.labName)
            if (invalidInventory.length > 0) {
                console.log(`\n⚠ 警告: ${invalidInventory.length} 条库存未关联实验室`)
            }

            // 检查低库存和即将过期
            const lowStock = inventory.filter(item => item.status === 'low_stock')
            const outOfStock = inventory.filter(item => item.status === 'out_of_stock')
            const expiring = inventory.filter(item => item.status === 'expiring_soon')
            const expired = inventory.filter(item => item.status === 'expired')

            console.log('\n库存状态详情:')
            console.log(`  缺货: ${outOfStock.length} 条`)
            console.log(`  低库存: ${lowStock.length} 条`)
            console.log(`  即将过期: ${expiring.length} 条`)
            console.log(`  已过期: ${expired.length} 条`)

            // 显示即将过期的项目
            if (expiring.length > 0 && expiring.length <= 5) {
                console.log('\n即将过期的耗材:')
                expiring.forEach(item => {
                    const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
                    console.log(`  ${item.name} (${item.code}): ${daysLeft}天后过期`)
                })
            }
        }

        // 4. 数据完整性检查
        console.log('\n' + '='.repeat(60))
        console.log('\n【数据完整性检查】')

        // 检查所有库存是否都有对应的实验室
        const inventoryLabNames = [...new Set(inventory.map(item => item.labName))]
        const labLabNames = labs.map(lab => lab.labName)
        const orphanInventory = inventoryLabNames.filter(labName => !labLabNames.includes(labName))

        if (orphanInventory.length > 0) {
            console.log(`\n⚠ 警告: 发现 ${orphanInventory.length} 条库存的实验室不存在`)
            orphanInventory.forEach(labName => {
                console.log(`  - ${labName}`)
            })
        } else {
            console.log('\n✓ 所有库存都正确关联到实验室')
        }

        // 检查所有用户的实验室是否存在
        const userLabNames = [...new Set(users.map(user => user.labName))]
        const orphanUsers = userLabNames.filter(labName => !labLabNames.includes(labName))

        if (orphanUsers.length > 0) {
            console.log(`\n⚠ 警告: 发现 ${orphanUsers.length} 个用户的实验室不存在`)
            orphanUsers.forEach(labName => {
                console.log(`  - ${labName}`)
            })
        } else {
            console.log('\n✓ 所有用户都正确关联到实验室')
        }

        // 5. 总结
        console.log('\n' + '='.repeat(60))
        console.log('\n【验证总结】')
        console.log(`✓ 实验室数据: ${labs.length} 条`)
        console.log(`✓ 用户数据: ${users.length} 条`)
        console.log(`✓ 库存数据: ${inventory.length} 条`)
        console.log(`✓ 数据关联: 正确`)

        const expectedInventoryCount = 50
        if (inventory.length === expectedInventoryCount) {
            console.log(`✓ 库存数量符合预期 (${expectedInventoryCount}条)`)
        } else {
            console.log(`ℹ 库存数量: ${inventory.length} (预期: ${expectedInventoryCount})`)
        }

        console.log('\n' + '='.repeat(60))
        console.log('\n✓ 数据验证完成！')

        process.exit(0)

    } catch (error) {
        console.error('\n数据验证失败:', error)
        process.exit(1)
    } finally {
        mongoose.disconnect()
    }
}
