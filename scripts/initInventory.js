/**
 * 初始化库存测试数据
 * 运行：node scripts/initInventory.js
 */

const mongoose = require('mongoose');
const InventoryModel = require('../models/InventoryModel/InventoryModel');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/inventory_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleData = [
    {
        name: 'RIPA 裂解液 (强)',
        code: 'P0013B',
        category: 'reagent',
        specification: '100mL',
        unit: '瓶',
        quantity: 5,
        minQuantity: 2,
        price: 150,
        supplier: '碧云天',
        purchaseDate: new Date('2024-01-15'),
        expiryDate: new Date('2025-01-15'),
        location: 'A-01-03',
        remarks: '强效裂解液，用于蛋白提取'
    },
    {
        name: 'BCA 蛋白定量试剂盒',
        code: '23227',
        category: 'reagent',
        specification: '500次',
        unit: '盒',
        quantity: 2,
        minQuantity: 1,
        price: 580,
        supplier: 'Thermo Scientific',
        purchaseDate: new Date('2024-02-01'),
        expiryDate: new Date('2024-12-01'),
        location: 'A-02-01',
        remarks: '蛋白浓度测定试剂盒'
    },
    {
        name: 'PBS 缓冲液 (10X)',
        code: '10010023',
        category: 'reagent',
        specification: '1L',
        unit: '瓶',
        quantity: 8,
        minQuantity: 3,
        price: 45,
        supplier: 'HyClone',
        purchaseDate: new Date('2024-01-20'),
        location: 'A-01-05',
        remarks: '磷酸缓冲盐溶液'
    },
    {
        name: 'Ep管 1.5mL',
        code: 'EP001',
        category: 'consumable',
        specification: '100个/包',
        unit: '包',
        quantity: 3,
        minQuantity: 5,
        price: 25,
        supplier: 'Axygen',
        purchaseDate: new Date('2024-01-10'),
        location: 'B-03-02',
        remarks: '微量离心管'
    },
    {
        name: '移液枪头 200μL',
        code: 'TIP200',
        category: 'consumable',
        specification: '96个/盒',
        unit: '盒',
        quantity: 15,
        minQuantity: 10,
        price: 35,
        supplier: 'Fisherbrand',
        purchaseDate: new Date('2024-02-15'),
        location: 'B-01-03',
        remarks: '兼容大多数移液器'
    },
    {
        name: 'PCR 8联管',
        code: 'PCR8',
        category: 'consumable',
        specification: '125个/盒',
        unit: '盒',
        quantity: 0,
        minQuantity: 5,
        price: 80,
        supplier: 'Axygen',
        purchaseDate: new Date('2024-01-05'),
        location: 'B-02-01',
        remarks: '8连管，适用于PCR实验'
    },
    {
        name: '兔抗鼠 IgG (H+L)',
        code: 'AB001',
        category: 'reagent',
        specification: '1mg/mL',
        unit: '支',
        quantity: 1,
        minQuantity: 2,
        price: 680,
        supplier: 'Cell Signaling',
        purchaseDate: new Date('2024-01-25'),
        expiryDate: new Date('2024-08-25'),
        location: 'A-03-01',
        remarks: '二抗，需-20°C保存'
    },
    {
        name: '高速离心机',
        code: 'EQ001',
        category: 'equipment',
        specification: 'TD5A',
        unit: '台',
        quantity: 2,
        minQuantity: 1,
        price: 3500,
        supplier: '湖南赫西',
        purchaseDate: new Date('2023-06-01'),
        location: 'C-01-01',
        remarks: '最大转速：5000rpm'
    },
    {
        name: '电子天平',
        code: 'EQ002',
        category: 'equipment',
        specification: '0.1mg',
        unit: '台',
        quantity: 1,
        minQuantity: 1,
        price: 2800,
        supplier: '梅特勒-托利多',
        purchaseDate: new Date('2023-05-15'),
        location: 'C-01-02',
        remarks: '精密电子天平'
    }
];

async function initData() {
    try {
        console.log('开始初始化库存数据...');

        // 清空现有数据（可选）
        // await InventoryModel.deleteMany({});
        // console.log('已清空现有数据');

        // 插入测试数据
        const result = await InventoryModel.insertMany(sampleData);
        console.log(`成功插入 ${result.length} 条测试数据`);

        // 统计数据
        const total = await InventoryModel.countDocuments();
        const reagentCount = await InventoryModel.countDocuments({ category: 'reagent' });
        const consumableCount = await InventoryModel.countDocuments({ category: 'consumable' });
        const equipmentCount = await InventoryModel.countDocuments({ category: 'equipment' });

        console.log('\n数据统计：');
        console.log(`总计：${total} 条`);
        console.log(`试剂：${reagentCount} 条`);
        console.log(`耗材：${consumableCount} 条`);
        console.log(`仪器：${equipmentCount} 条`);

        console.log('\n初始化完成！');
        process.exit(0);
    } catch (error) {
        console.error('初始化失败:', error);
        process.exit(1);
    }
}

initData();
