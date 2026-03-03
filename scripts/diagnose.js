const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/test').then(async () => {
    console.log('成功连接到数据库\n');

    try {
        // 检查模型是否已注册
        console.log('=== 已注册的 Mongoose 模型 ===');
        const modelNames = mongoose.modelNames();
        console.log('模型列表:', modelNames);

        if (modelNames.includes('Inventory')) {
            console.log('✓ Inventory 模型已注册');

            // 获取模型
            const Inventory = mongoose.model('Inventory');

            // 检查模型使用的集合名称
            console.log('\n集合名称:', Inventory.collection.name);

            // 查询数据
            const count = await Inventory.countDocuments();
            console.log(`文档数量: ${count}`);

            if (count > 0) {
                const items = await Inventory.find().limit(3);
                console.log('\n前3条数据:');
                items.forEach(item => {
                    console.log(`- ${item.code}: ${item.name}`);
                });
            }
        } else {
            console.log('✗ Inventory 模型未注册！');
            console.log('请确保应用启动时导入了该模型');
        }

        // 检查数据库中的所有集合
        console.log('\n=== 数据库中的所有集合 ===');
        const collections = await mongoose.connection.db.listCollections().toArray();
        collections.forEach(col => {
            console.log(`- ${col.name}`);
        });

    } catch (error) {
        console.error('诊断失败:', error);
    }

    mongoose.connection.close();
}).catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
});
