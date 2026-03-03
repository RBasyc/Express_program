const mongoose = require('mongoose');
const Inventory = require('../models/InventoryModel/InventoryModel');

mongoose.connect('mongodb://localhost:27017/test').then(async () => {
    console.log('成功连接到数据库');

    try {
        // 检查数据
        const count = await Inventory.countDocuments();
        console.log(`\nInventory 集合中的文档数量: ${count}`);

        if (count > 0) {
            const items = await Inventory.find().limit(5);
            console.log('\n前5条数据:');
            items.forEach(item => {
                console.log(`- ${item.code}: ${item.name} (${item.category}) - ${item.quantity}${item.unit}`);
            });
        } else {
            console.log('集合为空！');
        }

        // 检查集合名称
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n数据库中的所有集合:');
        collections.forEach(col => {
            console.log(`- ${col.name}`);
        });

    } catch (error) {
        console.error('查询失败:', error);
    }

    mongoose.connection.close();
}).catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
});
