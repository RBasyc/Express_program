// 模拟应用启动过程，测试模型是否正确加载
const mongoose = require('mongoose');

async function test() {
    console.log('=== 模拟应用启动流程 ===\n');

    // 1. 连接数据库
    console.log('1. 连接数据库...');
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('   ✓ 已连接\n');

    // 2. 导入模型（模拟 app.js 中的导入）
    console.log('2. 导入模型...');
    const { User, Inventory } = require('../models/index');
    console.log('   ✓ 已导入\n');

    // 3. 检查模型注册
    console.log('3. 检查已注册的模型...');
    const modelNames = mongoose.modelNames();
    console.log('   已注册的模型:', modelNames);

    if (modelNames.includes('Inventory')) {
        console.log('   ✓ Inventory 模型已注册\n');
    } else {
        console.log('   ✗ Inventory 模型未注册！\n');
    }

    // 4. 查询数据
    console.log('4. 查询数据...');
    try {
        const count = await Inventory.countDocuments();
        console.log(`   Inventory 文档数量: ${count}`);

        if (count > 0) {
            const items = await Inventory.find().limit(3);
            console.log('   前3条数据:');
            items.forEach(item => {
                console.log(`     - ${item.code}: ${item.name}`);
            });
        } else {
            console.log('   ⚠ 集合为空');
        }
        console.log('   ✓ 查询成功\n');
    } catch (error) {
        console.log('   ✗ 查询失败:', error.message, '\n');
    }

    // 5. 测试 InventoryServices
    console.log('5. 测试 InventoryServices...');
    try {
        const inventoryServices = require('./services/InventoryServices/InventoryServices');
        const result = await inventoryServices.getList({ page: 1, pageSize: 5 });
        console.log(`   ✓ Services 返回 ${result.total} 条数据`);
        if (result.items.length > 0) {
            console.log('   第1条数据:', result.items[0].name);
        }
    } catch (error) {
        console.log('   ✗ Services 调用失败:', error.message);
    }

    console.log('\n=== 测试完成 ===');

    await mongoose.connection.close();
}

test().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
