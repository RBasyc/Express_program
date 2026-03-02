const mongoose = require('mongoose');
const Inventory = require('../models/InventoryModel/InventoryModel');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/test').then(() => {
    console.log('成功连接到数据库');
    seedData();
}).catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
});

// 实验室耗材测试数据
const inventoryData = [
    // 试剂类
    { name: '乙醇', code: 'RE001', category: '试剂', specification: '500ml', unit: '瓶', quantity: 25, minQuantity: 10, price: 35.00, supplier: '国药集团化学试剂有限公司', location: 'A-01-01', remarks: '无水乙醇，分析纯' },
    { name: '甲醇', code: 'RE002', category: '试剂', specification: '500ml', unit: '瓶', quantity: 5, minQuantity: 10, price: 45.00, supplier: '国药集团化学试剂有限公司', location: 'A-01-02', remarks: 'HPLC级' },
    { name: '丙酮', code: 'RE003', category: '试剂', specification: '500ml', unit: '瓶', quantity: 18, minQuantity: 8, price: 38.00, supplier: ' Sigma-Aldrich', location: 'A-01-03', remarks: '分析纯' },
    { name: '盐酸', code: 'RE004', category: '试剂', specification: '500ml', unit: '瓶', quantity: 12, minQuantity: 5, price: 28.00, supplier: '国药集团化学试剂有限公司', location: 'A-02-01', remarks: '37%浓度' },
    { name: '氢氧化钠', code: 'RE005', category: '试剂', specification: '500g', unit: '瓶', quantity: 8, minQuantity: 5, price: 42.00, supplier: '国药集团化学试剂有限公司', location: 'A-02-02', remarks: '颗粒状，分析纯' },
    { name: '硫酸', code: 'RE006', category: '试剂', specification: '500ml', unit: '瓶', quantity: 0, minQuantity: 3, price: 55.00, supplier: '国药集团化学试剂有限公司', location: 'A-02-03', remarks: '98%浓度，腐蚀性强' },
    { name: '硝酸银', code: 'RE007', category: '试剂', specification: '100g', unit: '瓶', quantity: 3, minQuantity: 2, price: 120.00, supplier: '国药集团化学试剂有限公司', location: 'A-03-01', remarks: '见光保存' },
    { name: '氯化钠', code: 'RE008', category: '试剂', specification: '500g', unit: '瓶', quantity: 50, minQuantity: 20, price: 25.00, supplier: '国药集团化学试剂有限公司', location: 'A-03-02', remarks: '分析纯' },
    { name: '葡萄糖', code: 'RE009', category: '试剂', specification: '500g', unit: '瓶', quantity: 35, minQuantity: 15, price: 45.00, supplier: '国药集团化学试剂有限公司', location: 'A-03-03', remarks: '生物试剂级' },
    { name: '琼脂粉', code: 'RE010', category: '试剂', specification: '100g', unit: '瓶', quantity: 6, minQuantity: 5, price: 68.00, supplier: '北京索莱宝科技有限公司', location: 'A-04-01', remarks: '微生物培养基用' },
    { name: '胰蛋白酶', code: 'RE011', category: '试剂', specification: '1g', unit: '瓶', quantity: 2, minQuantity: 3, price: 380.00, supplier: 'Gibco', location: 'A-04-02', remarks: '-20℃保存', expiryDate: new Date('2025-06-30') },
    { name: '胎牛血清', code: 'RE012', category: '试剂', specification: '500ml', unit: '瓶', quantity: 4, minQuantity: 5, price: 1200.00, supplier: 'Gibco', location: 'A-04-03', remarks: '-20℃保存', expiryDate: new Date('2025-09-15') },

    // 耗材类
    { name: '移液枪头', code: 'CS001', category: '耗材', specification: '10μl', unit: '盒', quantity: 20, minQuantity: 10, price: 120.00, supplier: '北京天根生化科技有限公司', location: 'B-01-01', remarks: '96个/盒，带滤芯' },
    { name: '移液枪头', code: 'CS002', category: '耗材', specification: '200μl', unit: '盒', quantity: 25, minQuantity: 10, price: 120.00, supplier: '北京天根生化科技有限公司', location: 'B-01-02', remarks: '96个/盒，带滤芯' },
    { name: '移液枪头', code: 'CS003', category: '耗材', specification: '1000μl', unit: '盒', quantity: 15, minQuantity: 10, price: 150.00, supplier: '北京天根生化科技有限公司', location: 'B-01-03', remarks: '96个/盒，带滤芯' },
    { name: 'EP管', code: 'CS004', category: '耗材', specification: '1.5ml', unit: '袋', quantity: 40, minQuantity: 20, price: 35.00, supplier: '北京天根生化科技有限公司', location: 'B-02-01', remarks: '100个/袋' },
    { name: 'EP管', code: 'CS005', category: '耗材', specification: '2.0ml', unit: '袋', quantity: 30, minQuantity: 15, price: 38.00, supplier: '北京天根生化科技有限公司', location: 'B-02-02', remarks: '100个/袋' },
    { name: '离心管', code: 'CS006', category: '耗材', specification: '15ml', unit: '袋', quantity: 8, minQuantity: 10, price: 45.00, supplier: 'Corning', location: 'B-02-03', remarks: '25个/袋' },
    { name: '离心管', code: 'CS007', category: '耗材', specification: '50ml', unit: '袋', quantity: 12, minQuantity: 8, price: 68.00, supplier: 'Corning', location: 'B-02-04', remarks: '25个/袋' },
    { name: '一次性手套', code: 'CS008', category: '耗材', specification: 'L号', unit: '盒', quantity: 5, minQuantity: 10, price: 85.00, supplier: '安思尔', location: 'B-03-01', remarks: '100只/盒，无粉' },
    { name: '一次性手套', code: 'CS009', category: '耗材', specification: 'M号', unit: '盒', quantity: 8, minQuantity: 10, price: 85.00, supplier: '安思尔', location: 'B-03-02', remarks: '100只/盒，无粉' },
    { name: '一次性手套', code: 'CS010', category: '耗材', specification: 'S号', unit: '盒', quantity: 3, minQuantity: 10, price: 85.00, supplier: '安思尔', location: 'B-03-03', remarks: '100只/盒，无粉' },
    { name: '口罩', code: 'CS011', category: '耗材', specification: 'N95', unit: '个', quantity: 50, minQuantity: 30, price: 8.00, supplier: '3M', location: 'B-04-01', remarks: '防护用品' },
    { name: '滤纸', code: 'CS012', category: '耗材', specification: '11cm', unit: '盒', quantity: 18, minQuantity: 10, price: 55.00, supplier: 'Whatman', location: 'B-04-02', remarks: '定性滤纸，100张/盒' },
    { name: '注射器', code: 'CS013', category: '耗材', specification: '5ml', unit: '袋', quantity: 25, minQuantity: 20, price: 25.00, supplier: '江苏康健医疗用品有限公司', location: 'B-05-01', remarks: '10支/袋' },
    { name: '针头', code: 'CS014', category: '耗材', specification: '21G', unit: '盒', quantity: 100, minQuantity: 50, price: 45.00, supplier: '江苏康健医疗用品有限公司', location: 'B-05-02', remarks: '100个/盒' },

    // 仪器类
    { name: '移液器', code: 'EQ001', category: '仪器', specification: 'P1000', unit: '台', quantity: 5, minQuantity: 2, price: 2800.00, supplier: 'Eppendorf', location: 'C-01-01', remarks: '量程100-1000μl' },
    { name: '移液器', code: 'EQ002', category: '仪器', specification: 'P200', unit: '台', quantity: 6, minQuantity: 2, price: 2400.00, supplier: 'Eppendorf', location: 'C-01-02', remarks: '量程20-200μl' },
    { name: '移液器', code: 'EQ003', category: '仪器', specification: 'P20', unit: '台', quantity: 4, minQuantity: 2, price: 2200.00, supplier: 'Eppendorf', location: 'C-01-03', remarks: '量程0.5-20μl' },
    { name: '离心机', code: 'EQ004', category: '仪器', specification: '台式', unit: '台', quantity: 2, minQuantity: 1, price: 8500.00, supplier: 'Beckman Coulter', location: 'C-02-01', remarks: '最高转速15000rpm' },
    { name: 'PCR仪', code: 'EQ005', category: '仪器', specification: '96孔', unit: '台', quantity: 1, minQuantity: 1, price: 35000.00, supplier: 'Bio-Rad', location: 'C-02-02', remarks: '梯度PCR' },
    { name: '电泳仪', code: 'EQ006', category: '仪器', specification: '双垂直', unit: '台', quantity: 2, minQuantity: 1, price: 4200.00, supplier: '北京六一仪器厂', location: 'C-02-03', remarks: '带电源' },
    { name: '电子天平', code: 'EQ007', category: '仪器', specification: '0.1mg', unit: '台', quantity: 3, minQuantity: 1, price: 5500.00, supplier: '梅特勒-托利多', location: 'C-03-01', remarks: '精密天平' },
    { name: 'pH计', code: 'EQ008', category: '仪器', specification: '便携式', unit: '台', quantity: 4, minQuantity: 2, price: 1200.00, supplier: '梅特勒-托利多', location: 'C-03-02', remarks: '配电极' },
    { name: '涡旋振荡器', code: 'EQ009', category: '仪器', specification: '数显', unit: '台', quantity: 5, minQuantity: 2, price: 860.00, supplier: '其林贝尔', location: 'C-03-03', remarks: '转速可调' },
    { name: '超纯水机', code: 'EQ010', category: '仪器', specification: '18.2MΩ', unit: '台', quantity: 1, minQuantity: 1, price: 18000.00, supplier: 'Millipore', location: 'C-04-01', remarks: '实验室专用' },
    { name: '烘箱', code: 'EQ011', category: '仪器', specification: '台式', unit: '台', quantity: 2, minQuantity: 1, price: 3500.00, supplier: '上海一恒', location: 'C-04-02', remarks: '最高温度300℃' },
    { name: '培养箱', code: 'EQ012', category: '仪器', specification: '生化', unit: '台', quantity: 3, minQuantity: 1, price: 6800.00, supplier: '上海一恒', location: 'C-04-03', remarks: '温度范围RT+5~65℃' },

    // 其他类
    { name: '实验记录本', code: 'OT001', category: '其他', specification: 'A4', unit: '件', quantity: 30, minQuantity: 20, price: 15.00, supplier: '本地文具店', location: 'D-01-01', remarks: '100页/件' },
    { name: '记号笔', code: 'OT002', category: '其他', specification: '黑色', unit: '支', quantity: 50, minQuantity: 30, price: 3.00, supplier: '得力', location: 'D-01-02', remarks: '防水' },
    { name: '标签纸', code: 'OT003', category: '其他', specification: '耐低温', unit: '件', quantity: 8, minQuantity: 10, price: 22.00, supplier: '得力', location: 'D-01-03', remarks: '适合-80℃环境' },
    { name: '封口膜', code: 'OT004', category: '其他', specification: 'PARAFILM', unit: '件', quantity: 6, minQuantity: 5, price: 180.00, supplier: 'Bemis', location: 'D-02-01', remarks: '进口封口膜' },
    { name: '锡箔纸', code: 'OT005', category: '其他', specification: '30cm宽', unit: '件', quantity: 4, minQuantity: 3, price: 45.00, supplier: '本地超市', location: 'D-02-02', remarks: '食品级' },
    { name: '橡皮筋', code: 'OT006', category: '其他', specification: '大号', unit: '袋', quantity: 15, minQuantity: 10, price: 8.00, supplier: '本地文具店', location: 'D-02-03', remarks: '100个/袋' },
    { name: '试管架', code: 'OT007', category: '其他', specification: '塑料', unit: '个', quantity: 12, minQuantity: 8, price: 25.00, supplier: '江苏康健医疗用品有限公司', location: 'D-03-01', remarks: '50孔' },
    { name: '废液桶', code: 'OT008', category: '其他', specification: '5L', unit: '个', quantity: 8, minQuantity: 5, price: 35.00, supplier: '本地超市', location: 'D-03-02', remarks: '带盖' },
    { name: '冰盒', code: 'OT009', category: '其他', specification: '50孔', unit: '个', quantity: 10, minQuantity: 8, price: 42.00, supplier: '北京天根生化科技有限公司', location: 'D-03-03', remarks: '耐低温' },
    { name: '酒精灯', code: 'OT010', category: '其他', specification: '150ml', unit: '个', quantity: 6, minQuantity: 5, price: 18.00, supplier: '本地五金店', location: 'D-04-01', remarks: '玻璃材质' },
    { name: '药勺', code: 'OT011', category: '其他', specification: '不锈钢', unit: '个', quantity: 20, minQuantity: 15, price: 8.00, supplier: '本地五金店', location: 'D-04-02', remarks: '长柄' },
    { name: '剪刀', code: 'OT012', category: '其他', specification: '实验室专用', unit: '个', quantity: 8, minQuantity: 6, price: 15.00, supplier: '本地五金店', location: 'D-04-03', remarks: '不锈钢' },
    { name: '镊子', code: 'OT013', category: '其他', specification: '直头', unit: '个', quantity: 10, minQuantity: 8, price: 12.00, supplier: '本地五金店', location: 'D-04-04', remarks: '不锈钢' },
    { name: '洗瓶', code: 'OT014', category: '其他', specification: '500ml', unit: '个', quantity: 15, minQuantity: 10, price: 28.00, supplier: '本地玻璃仪器店', location: 'D-05-01', remarks: '带细管' },
    { name: '量筒', code: 'OT015', category: '其他', specification: '100ml', unit: '个', quantity: 6, minQuantity: 5, price: 22.00, supplier: '本地玻璃仪器店', location: 'D-05-02', remarks: '玻璃材质' },
    { name: '烧杯', code: 'OT016', category: '其他', specification: '250ml', unit: '个', quantity: 12, minQuantity: 10, price: 18.00, supplier: '本地玻璃仪器店', location: 'D-05-03', remarks: '低型' },
];

async function seedData() {
    try {
        // 清空现有数据
        await Inventory.deleteMany({});
        console.log('已清空现有耗材数据');

        // 添加过期日期和购买日期
        const now = new Date();
        const inventoryWithDates = inventoryData.map((item, index) => {
            const purchaseDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000); // 最近6个月内购买
            let expiryDate = null;

            // 部分试剂添加过期日期
            if (item.category === '试剂' && index % 3 === 0) {
                expiryDate = new Date(purchaseDate.getTime() + 365 * 2 * 24 * 60 * 60 * 1000); // 2年有效期
            }

            return {
                ...item,
                purchaseDate,
                expiryDate
            };
        });

        // 插入数据
        await Inventory.insertMany(inventoryWithDates);
        console.log(`成功插入 ${inventoryData.length} 条耗材数据`);

        // 显示统计信息
        const stats = await getInventoryStats();
        console.log('\n库存统计:');
        console.log(`- 试剂: ${stats.试剂} 种`);
        console.log(`- 耗材: ${stats.耗材} 种`);
        console.log(`- 仪器: ${stats.仪器} 种`);
        console.log(`- 其他: ${stats.其他} 种`);
        console.log(`- 预警耗材: ${stats.alerts} 种`);

        console.log('\n预警详情:');
        const alerts = await Inventory.getAlertItems();
        alerts.forEach(item => {
            console.log(`  - ${item.name} (${item.code}): ${item.status}`);
        });

    } catch (error) {
        console.error('数据插入失败:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n数据库连接已关闭');
    }
}

async function getInventoryStats() {
    const categories = await Inventory.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const stats = {
        试剂: 0,
        耗材: 0,
        仪器: 0,
        其他: 0
    };

    categories.forEach(cat => {
        stats[cat._id] = cat.count;
    });

    const alerts = await Inventory.countDocuments({
        status: { $in: ['low_stock', 'expired', 'expiring_soon', 'out_of_stock'] }
    });

    return { ...stats, alerts };
}
