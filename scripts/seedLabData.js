const mongoose = require('mongoose')
const Lab = require('../models/LabModel/LabModel')
const Inventory = require('../models/InventoryModel/InventoryModel')
const User = require('../models/UserModel/UserModel')

// 连接数据库
mongoose.connect('mongodb://localhost:27017/test').then(() => {
    console.log('成功连接到数据库')
    seedData()
}).catch(err => {
    console.error('数据库连接失败:', err)
    process.exit(1)
})

// 实验室数据
const labData = [
    {
        labName: '化学实验室',
        university: '清华大学',
        managerName: '张教授',
        managerContact: '13800138001',
        status: 'active'
    },
    {
        labName: '生物实验室',
        university: '北京大学',
        managerName: '李教授',
        managerContact: '13800138002',
        status: 'active'
    },
    {
        labName: '物理实验室',
        university: '复旦大学',
        managerName: '王教授',
        managerContact: '13800138003',
        status: 'active'
    },
    {
        labName: '分析测试中心',
        university: '上海交通大学',
        managerName: '赵教授',
        managerContact: '13800138004',
        status: 'active'
    },
    {
        labName: '药物研发实验室',
        university: '浙江大学',
        managerName: '刘教授',
        managerContact: '13800138005',
        status: 'active'
    }
]

// 耗材数据模板（50条）
const inventoryTemplates = [
    // 试剂类 - 化学实验室
    { name: '乙醇', code: 'CHEM-ETH-001', category: '试剂', specification: '500mL', unit: '瓶', quantity: 25, minQuantity: 10, price: 45.5, supplier: '国药集团', location: 'A-01-01', remarks: '无水乙醇，分析纯', labName: '化学实验室' },
    { name: '甲醇', code: 'CHEM-MET-002', category: '试剂', specification: '500mL', unit: '瓶', quantity: 5, minQuantity: 10, price: 52.0, supplier: '国药集团', location: 'A-01-02', remarks: 'HPLC级', labName: '化学实验室' },
    { name: '丙酮', code: 'CHEM-ACE-003', category: '试剂', specification: '500mL', unit: '瓶', quantity: 18, minQuantity: 8, price: 38.5, supplier: 'Sigma-Aldrich', location: 'A-01-03', remarks: '分析纯', labName: '化学实验室' },
    { name: '盐酸', code: 'CHEM-HCL-004', category: '试剂', specification: '500mL', unit: '瓶', quantity: 12, minQuantity: 5, price: 28.0, supplier: '国药集团', location: 'A-02-01', remarks: '37%浓度', labName: '化学实验室' },
    { name: '氢氧化钠', code: 'CHEM-NAH-005', category: '试剂', specification: '500g', unit: '瓶', quantity: 8, minQuantity: 5, price: 42.0, supplier: '国药集团', location: 'A-02-02', remarks: '颗粒状', labName: '化学实验室' },
    { name: '硫酸', code: 'CHEM-H2SO4-006', category: '试剂', specification: '500mL', unit: '瓶', quantity: 0, minQuantity: 3, price: 55.0, supplier: '国药集团', location: 'A-02-03', remarks: '98%浓度', labName: '化学实验室' },
    { name: '硝酸银', code: 'CHEM-AGNO3-007', category: '试剂', specification: '100g', unit: '瓶', quantity: 3, minQuantity: 2, price: 120.0, supplier: '国药集团', location: 'A-03-01', remarks: '见光保存', labName: '化学实验室' },
    { name: '氯化钠', code: 'CHEM-NACL-008', category: '试剂', specification: '500g', unit: '瓶', quantity: 50, minQuantity: 20, price: 25.5, supplier: '国药集团', location: 'A-03-02', remarks: '分析纯', labName: '化学实验室' },
    { name: '氯化钾', code: 'CHEM-KCL-009', category: '试剂', specification: '500g', unit: '瓶', quantity: 30, minQuantity: 15, price: 28.0, supplier: '国药集团', location: 'A-03-03', remarks: '分析纯', labName: '化学实验室' },
    { name: '乙酸乙酯', code: 'CHEM-ETOAC-010', category: '试剂', specification: '500mL', unit: '瓶', quantity: 15, minQuantity: 8, price: 48.0, supplier: '国药集团', location: 'A-04-01', remarks: '分析纯', labName: '化学实验室' },

    // 耗材类 - 化学实验室
    { name: '移液枪头', code: 'CHEM-TIP-10ul', category: '耗材', specification: '10μl', unit: '盒', quantity: 20, minQuantity: 10, price: 120.0, supplier: '北京天根', location: 'B-01-01', remarks: '96个/盒', labName: '化学实验室' },
    { name: '移液枪头', code: 'CHEM-TIP-200ul', category: '耗材', specification: '200μl', unit: '盒', quantity: 25, minQuantity: 10, price: 120.0, supplier: '北京天根', location: 'B-01-02', remarks: '96个/盒', labName: '化学实验室' },
    { name: 'EP管', code: 'CHEM-EP-1.5ml', category: '耗材', specification: '1.5ml', unit: '袋', quantity: 40, minQuantity: 20, price: 35.0, supplier: '北京天根', location: 'B-02-01', remarks: '100个/袋', labName: '化学实验室' },
    { name: 'EP管', code: 'CHEM-EP-2.0ml', category: '耗材', specification: '2.0ml', unit: '袋', quantity: 30, minQuantity: 15, price: 38.0, supplier: '北京天根', location: 'B-02-02', remarks: '100个/袋', labName: '化学实验室' },
    { name: '一次性手套', code: 'CHEM-GLV-L', category: '耗材', specification: 'L号', unit: '盒', quantity: 5, minQuantity: 10, price: 85.0, supplier: '安思尔', location: 'B-03-01', remarks: '100只/盒', labName: '化学实验室' },
    { name: '一次性手套', code: 'CHEM-GLV-M', category: '耗材', specification: 'M号', unit: '盒', quantity: 8, minQuantity: 10, price: 85.0, supplier: '安思尔', location: 'B-03-02', remarks: '100只/盒', labName: '化学实验室' },
    { name: 'N95口罩', code: 'CHEM-MSK-N95', category: '耗材', specification: 'N95', unit: '个', quantity: 50, minQuantity: 30, price: 8.0, supplier: '3M', location: 'B-04-01', remarks: '防护用品', labName: '化学实验室' },
    { name: '滤纸', code: 'CHEM-FL-11cm', category: '耗材', specification: '11cm', unit: '盒', quantity: 18, minQuantity: 10, price: 55.0, supplier: 'Whatman', location: 'B-04-02', remarks: '定性滤纸', labName: '化学实验室' },

    // 试剂类 - 生物实验室
    { name: '胰蛋白酶', code: 'BIO-TRY-1g', category: '试剂', specification: '1g', unit: '瓶', quantity: 2, minQuantity: 3, price: 380.0, supplier: 'Gibco', location: 'BIO-01-01', remarks: '-20℃保存', labName: '生物实验室' },
    { name: '胎牛血清', code: 'BIO-FBS-500ml', category: '试剂', specification: '500ml', unit: '瓶', quantity: 4, minQuantity: 5, price: 1200.0, supplier: 'Gibco', location: 'BIO-01-02', remarks: '-20℃保存', labName: '生物实验室' },
    { name: '琼脂粉', code: 'BIO-AGAR-100g', category: '试剂', specification: '100g', unit: '瓶', quantity: 6, minQuantity: 5, price: 68.0, supplier: '北京索莱宝', location: 'BIO-02-01', remarks: '微生物用', labName: '生物实验室' },
    { name: '葡萄糖', code: 'BIO-GLU-500g', category: '试剂', specification: '500g', unit: '瓶', quantity: 35, minQuantity: 15, price: 45.0, supplier: '国药集团', location: 'BIO-02-02', remarks: '生物试剂级', labName: '生物实验室' },
    { name: '氨苄青霉素', code: 'BIO-AMP-100u', category: '试剂', specification: '100u', unit: '瓶', quantity: 8, minQuantity: 5, price: 180.0, supplier: 'Amresco', location: 'BIO-03-01', remarks: '冷藏保存', labName: '生物实验室' },
    { name: '卡那霉素', code: 'BIO-KAN-50u', category: '试剂', specification: '50u', unit: '瓶', quantity: 5, minQuantity: 5, price: 220.0, supplier: 'Amresco', location: 'BIO-03-02', remarks: '冷藏保存', labName: '生物实验室' },
    { name: 'DNA标记', code: 'BIO-DNA-100ul', category: '试剂', specification: '100ul', unit: '支', quantity: 3, minQuantity: 2, price: 680.0, supplier: 'Thermo', location: 'BIO-04-01', remarks: '-20℃保存', labName: '生物实验室' },
    { name: 'PBS缓冲液', code: 'BIO-PBS-500ml', category: '试剂', specification: '500ml', unit: '瓶', quantity: 20, minQuantity: 10, price: 55.0, supplier: 'HyClone', location: 'BIO-04-02', remarks: 'pH7.4', labName: '生物实验室' },
    { name: 'RPMI培养基', code: 'BIO-RPMI-500ml', category: '试剂', specification: '500ml', unit: '瓶', quantity: 12, minQuantity: 8, price: 88.0, supplier: 'Gibco', location: 'BIO-05-01', remarks: '含双抗', labName: '生物实验室' },
    { name: 'DMEM培养基', code: 'BIO-DMEM-500ml', category: '试剂', specification: '500ml', unit: '瓶', quantity: 15, minQuantity: 8, price: 92.0, supplier: 'Gibco', location: 'BIO-05-02', remarks: '高糖', labName: '生物实验室' },

    // 耗材类 - 生物实验室
    { name: '细胞培养板', code: 'BIO-PLT-6well', category: '耗材', specification: '6孔', unit: '个', quantity: 25, minQuantity: 15, price: 45.0, supplier: 'Corning', location: 'BIO-B-01', remarks: '无菌处理', labName: '生物实验室' },
    { name: '细胞培养板', code: 'BIO-PLT-96well', category: '耗材', specification: '96孔', unit: '个', quantity: 30, minQuantity: 20, price: 120.0, supplier: 'Corning', location: 'BIO-B-02', remarks: '无菌处理', labName: '生物实验室' },
    { name: '离心管', code: 'BIO-CEN-15ml', category: '耗材', specification: '15ml', unit: '袋', quantity: 8, minQuantity: 10, price: 45.0, supplier: 'Corning', location: 'BIO-B-03', remarks: '25个/袋', labName: '生物实验室' },
    { name: '离心管', code: 'BIO-CEN-50ml', category: '耗材', specification: '50ml', unit: '袋', quantity: 12, minQuantity: 8, price: 68.0, supplier: 'Corning', location: 'BIO-B-04', remarks: '25个/袋', labName: '生物实验室' },
    { name: '一次性注射器', code: 'BIO-SYR-5ml', category: '耗材', specification: '5ml', unit: '袋', quantity: 25, minQuantity: 20, price: 25.0, supplier: '江苏康健', location: 'BIO-B-05', remarks: '10支/袋', labName: '生物实验室' },
    { name: '细胞刮刀', code: 'BIO-SCR', category: '耗材', specification: '标准', unit: '个', quantity: 15, minQuantity: 10, price: 12.0, supplier: 'Corning', location: 'BIO-B-06', remarks: '无菌', labName: '生物实验室' },

    // 仪器类 - 物理实验室
    { name: '示波器', code: 'PHY-OSC-100M', category: '仪器', specification: '100MHz', unit: '台', quantity: 3, minQuantity: 1, price: 8500.0, supplier: 'Tektronix', location: 'PHY-01-01', remarks: '双通道', labName: '物理实验室' },
    { name: '信号发生器', code: 'PHY-SIG-20M', category: '仪器', specification: '20MHz', unit: '台', quantity: 4, minQuantity: 2, price: 6800.0, supplier: 'Tektronix', location: 'PHY-01-02', remarks: 'DDS', labName: '物理实验室' },
    { name: '数字万用表', code: 'PHY-DMM-8846A', category: '仪器', specification: '8846A', unit: '台', quantity: 8, minQuantity: 5, price: 550.0, supplier: 'Fluke', location: 'PHY-02-01', remarks: '高精度', labName: '物理实验室' },
    { name: 'LCR电桥', code: 'PHY-LCR-821', category: '仪器', specification: '821', unit: '台', quantity: 5, minQuantity: 2, price: 3200.0, supplier: 'Agilent', location: 'PHY-02-02', remarks: '精密测量', labName: '物理实验室' },
    { name: '电子天平', code: 'PHY-BAL-0.1mg', category: '仪器', specification: '0.1mg', unit: '台', quantity: 3, minQuantity: 1, price: 5500.0, supplier: '梅特勒-托利多', location: 'PHY-03-01', remarks: '精密天平', labName: '物理实验室' },
    { name: '光学平台', code: 'PHY-OPT-60x60', category: '仪器', specification: '60x60cm', unit: '台', quantity: 2, minQuantity: 1, price: 2800.0, supplier: ' Newport', location: 'PHY-03-02', remarks: '隔振', labName: '物理实验室' },
    { name: '激光器', code: 'PHY-LAS-532nm', category: '仪器', specification: '532nm', unit: '台', quantity: 1, minQuantity: 1, price: 15000.0, supplier: 'Coherent', location: 'PHY-04-01', remarks: '固体激光', labName: '物理实验室' },
    { name: '光谱仪', code: 'PHY-SPEC-UV', category: '仪器', specification: 'UV-VIS', unit: '台', quantity: 2, minQuantity: 1, price: 22000.0, supplier: 'Shimadzu', location: 'PHY-04-02', remarks: '紫外可见', labName: '物理实验室' },
    { name: '功率计', code: 'PHY-PWR-30W', category: '仪器', specification: '30W', unit: '台', quantity: 6, minQuantity: 3, price: 1800.0, supplier: 'Coherent', location: 'PHY-05-01', remarks: '激光功率计', labName: '物理实验室' },
    { name: '热电偶', code: 'PHY-TH-K', category: '仪器', specification: 'K型', unit: '根', quantity: 15, minQuantity: 10, price: 45.0, supplier: 'Omega', location: 'PHY-05-02', remarks: '量程-200~1300℃', labName: '物理实验室' },

    // 耗材类 - 物理实验室
    { name: '同轴电缆', code: 'PHY-CBL-SMA', category: '耗材', specification: 'SMA', unit: '根', quantity: 20, minQuantity: 10, price: 35.0, supplier: 'Huber+Suhner', location: 'PHY-C-01', remarks: '50cm', labName: '物理实验室' },
    { name: 'BNC接头', code: 'PHY-CBL-BNC', category: '耗材', specification: 'BNC', unit: '个', quantity: 30, minQuantity: 20, price: 12.0, supplier: 'Amphenol', location: 'PHY-C-02', remarks: '50Ω', labName: '物理实验室' },
    { name: '光纤跳线', code: 'PHY-FIB-FC-2m', category: '耗材', specification: 'FC-FC', unit: '根', quantity: 12, minQuantity: 8, price: 85.0, supplier: 'Thorlabs', location: 'PHY-C-03', remarks: '2米', labName: '物理实验室' },
    { name: '面包板', code: 'PHY-BB-830', category: '耗材', specification: '830孔', unit: '个', quantity: 10, minQuantity: 8, price: 45.0, supplier: '3M', location: 'PHY-C-04', remarks: '带电源', labName: '物理实验室' },
    { name: '焊锡丝', code: 'PHY-SLD-0.8mm', category: '耗材', specification: '0.8mm', unit: '卷', quantity: 8, minQuantity: 5, price: 35.0, supplier: 'Kester', location: 'PHY-C-05', remarks: '无铅', labName: '物理实验室' },
    { name: '热缩管', code: 'PHY-TUB-φ3', category: '耗材', specification: 'φ3mm', unit: '袋', quantity: 15, minQuantity: 10, price: 22.0, supplier: '3M', location: 'PHY-C-06', remarks: '100个/袋', labName: '物理实验室' },

    // 试剂类 - 分析测试中心
    { name: '高效液相色谱级乙腈', code: 'ANA-ACN-1L', category: '试剂', specification: '1L', unit: '瓶', quantity: 8, minQuantity: 5, price: 280.0, supplier: 'Merck', location: 'ANA-01-01', remarks: 'HPLC级', labName: '分析测试中心' },
    { name: '色谱级甲醇', code: 'ANA-MET-4L', category: '试剂', specification: '4L', unit: '瓶', quantity: 6, minQuantity: 3, price: 320.0, supplier: 'Fisher', location: 'ANA-01-02', remarks: 'HPLC级', labName: '分析测试中心' },
    { name: '异丙醇', code: 'ANA-IPA-1L', category: '试剂', specification: '1L', unit: '瓶', quantity: 18, minQuantity: 8, price: 95.0, supplier: 'Fisher', location: 'ANA-01-03', remarks: 'HPLC级', labName: '分析测试中心' },
    { name: '乙二胺四乙酸', code: 'ANA-EDTA-500g', category: '试剂', specification: '500g', unit: '瓶', quantity: 4, minQuantity: 2, price: 180.0, supplier: 'Sigma', location: 'ANA-02-01', remarks: 'EDTA二钠', labName: '分析测试中心' },
    { name: '三羟甲基氨基甲烷', code: 'ANA-TRIS-500g', category: '试剂', specification: '500g', unit: '瓶', quantity: 5, minQuantity: 3, price: 165.0, supplier: 'Sigma', location: 'ANA-02-02', remarks: '生物试剂级', labName: '分析测试中心' },
    { name: '溴化钾', code: 'ANA-KBR-100g', category: '试剂', specification: '100g', unit: '瓶', quantity: 12, minQuantity: 5, price: 85.0, supplier: 'Sigma', location: 'ANA-02-03', remarks: '光谱纯', labName: '分析测试中心' },
    { name: '氯化钠', code: 'ANA-NACL-SP', category: '试剂', specification: '500g', unit: '瓶', quantity: 20, minQuantity: 10, price: 95.0, supplier: 'Sigma', location: 'ANA-03-01', remarks: '光谱纯', labName: '分析测试中心' },
    { name: '重铬酸钾', code: 'ANA-K2CR2O7-100g', category: '试剂', specification: '100g', unit: '瓶', quantity: 3, minQuantity: 2, price: 150.0, supplier: 'Sigma', location: 'ANA-03-02', remarks: '基准试剂', labName: '分析测试中心' },
    { name: '硝酸钾', code: 'ANA-KNO3-500g', category: '试剂', specification: '500g', unit: '瓶', quantity: 15, minQuantity: 8, price: 75.0, supplier: 'Sigma', location: 'ANA-03-03', remarks: '优级纯', labName: '分析测试中心' },
    { name: '无水硫酸钠', code: 'ANA-NA2SO4-500g', category: '试剂', specification: '500g', unit: '瓶', quantity: 10, minQuantity: 5, price: 88.0, supplier: 'Sigma', location: 'ANA-04-01', remarks: '优级纯', labName: '分析测试中心' },

    // 仪器类 - 分析测试中心
    { name: '液相色谱仪', code: 'ANA-HPLC-1260', category: '仪器', specification: '1260 Infinity', unit: '台', quantity: 1, minQuantity: 1, price: 150000.0, supplier: 'Agilent', location: 'ANA-E-01', remarks: '二元泵', labName: '分析测试中心' },
    { name: '气相色谱仪', code: 'ANA-GC-7890', category: '仪器', specification: '7890B', unit: '台', quantity: 1, minQuantity: 1, price: 120000.0, supplier: 'Agilent', location: 'ANA-E-02', remarks: 'FID检测器', labName: '分析测试中心' },
    { name: '质谱仪', code: 'ANA-MS-5977', category: '仪器', specification: '5977B', unit: '台', quantity: 1, minQuantity: 1, price: 280000.0, supplier: 'Agilent', location: 'ANA-E-03', remarks: '单四极杆', labName: '分析测试中心' },
    { name: '原子吸收光谱仪', code: 'ANA-AAS-240', category: '仪器', specification: '240FS', unit: '台', quantity: 2, minQuantity: 1, price: 85000.0, supplier: 'Agilent', location: 'ANA-E-04', remarks: '火焰/石墨炉', labName: '分析测试中心' },
    { name: '紫外可见分光光度计', code: 'ANA-UV-2600', category: '仪器', specification: 'BioMate 3S', unit: '台', quantity: 3, minQuantity: 2, price: 12000.0, supplier: 'Thermo', location: 'ANA-E-05', remarks: '双光束', labName: '分析测试中心' },
    { name: '荧光分光光度计', code: 'ANA-FL-4500', category: '仪器', specification: 'F-4500', unit: '台', quantity: 2, minQuantity: 1, price: 18000.0, supplier: 'Hitachi', location: 'ANA-E-06', remarks: '荧光检测', labName: '分析测试中心' },
    { name: '离心机', code: 'ANA-CEN-5424', category: '仪器', specification: '5424', unit: '台', quantity: 4, minQuantity: 2, price: 12000.0, supplier: 'Eppendorf', location: 'ANA-E-07', remarks: '高速离心', labName: '分析测试中心' },
    { name: 'pH计', code: 'ANA-PH-FE20', category: '仪器', specification: 'FiveEasy Plus', unit: '台', quantity: 5, minQuantity: 3, price: 3500.0, supplier: 'Mettler Toledo', location: 'ANA-E-08', remarks: '精密pH', labName: '分析测试中心' },
    { name: '电导率仪', code: 'ANA-COND-FE30', category: '仪器', specification: 'FiveEasy', unit: '台', quantity: 5, minQuantity: 3, price: 2800.0, supplier: 'Mettler Toledo', location: 'ANA-E-09', remarks: '便携式', labName: '分析测试中心' },
    { name: '超声波清洗机', code: 'ANA-UC-300', category: '仪器', specification: '300W', unit: '台', quantity: 2, minQuantity: 1, price: 8500.0, supplier: 'Branson', location: 'ANA-E-10', remarks: '加热', labName: '分析测试中心' },

    // 耗材类 - 药物研发实验室
    { name: '96孔培养板', code: 'DRG-PLT-96', category: '耗材', specification: '96孔', unit: '个', quantity: 40, minQuantity: 20, price: 85.0, supplier: 'Corning', location: 'DRG-01', remarks: '无菌', labName: '药物研发实验室' },
    { name: '384孔培养板', code: 'DRG-PLT-384', category: '耗材', specification: '384孔', unit: '个', quantity: 25, minQuantity: 15, price: 150.0, supplier: 'Corning', location: 'DRG-02', remarks: '无菌', labName: '药物研发实验室' },
    { name: 'PCR板', code: 'DRG-PCR-96', category: '耗材', specification: '96孔', unit: '个', quantity: 50, minQuantity: 30, price: 120.0, supplier: 'Bio-Rad', location: 'DRG-03', remarks: '光学封膜', labName: '药物研发实验室' },
    { name: '封板膜', code: 'DRG-FILM', category: '耗材', specification: '光学', unit: '个', quantity: 30, minQuantity: 20, price: 45.0, supplier: 'Bio-Rad', location: 'DRG-04', remarks: '光学级', labName: '药物研发实验室' },
    { name: '移液枪头', code: 'DRG-TIP-200ul', category: '耗材', specification: '200μl', unit: '盒', quantity: 45, minQuantity: 20, price: 125.0, supplier: 'Axygen', location: 'DRG-05', remarks: '滤芯吸头', labName: '药物研发实验室' },
    { name: '移液枪头', code: 'DRG-TIP-20ul', category: '耗材', specification: '20μl', unit: '盒', quantity: 35, minQuantity: 20, price: 115.0, supplier: 'Axygen', location: 'DRG-06', remarks: '滤芯吸头', labName: '药物研发实验室' },
    { name: '无菌过滤器', code: 'DRG-FIL-0.22um', category: '耗材', specification: '0.22μm', unit: '个', quantity: 15, minQuantity: 10, price: 25.0, supplier: 'Millipore', location: 'DRG-07', remarks: '针头式', labName: '药物研发实验室' },
    { name: '注射器', code: 'DRG-SYR-1ml', category: '耗材', specification: '1ml', unit: '袋', quantity: 50, minQuantity: 30, price: 28.0, supplier: 'BD', location: 'DRG-08', remarks: '胰岛素专用', labName: '药物研发实验室' },
    { name: '冻存管', code: 'DRG-TUB-1.8ml', category: '耗材', specification: '1.8ml', unit: '个', quantity: 100, minQuantity: 50, price: 8.0, supplier: 'Corning', location: 'DRG-09', remarks: '螺纹口', labName: '药物研发实验室' },
    { name: '96孔板离心机', code: 'DRG-CEN-96', category: '仪器', specification: '3000rpm', unit: '台', quantity: 3, minQuantity: 2, price: 4500.0, supplier: 'Eppendorf', location: 'DRG-E-01', remarks: '适配96孔板', labName: '药物研发实验室' }
]

// 用户数据（每个实验室一个管理员）
const generateUsers = (labs) => {
    return labs.map((lab, index) => ({
        nickName: `admin_${index + 1}`,
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz', // 实际使用时应该是哈希后的密码
        realName: `${lab.managerName}`,
        email: `lab${index + 1}@${lab.university}.edu.cn`,
        phone: `138${String(10000000 + index).padStart(8, '0')}`,
        labName: lab.labName,
        role: 'admin',
        status: 'active'
    }))
}

async function seedData() {
    try {
        console.log('开始注入测试数据...\n')

        // 1. 创建实验室
        console.log('1. 创建实验室...')
        const existingLabs = await Lab.find()
        if (existingLabs.length > 0) {
            console.log(`   已存在 ${existingLabs.length} 个实验室，跳过创建`)
        } else {
            await Lab.create(labData)
            console.log(`   ✓ 成功创建 ${labData.length} 个实验室`)
        }

        // 2. 创建用户
        console.log('\n2. 创建用户...')
        const userData = generateUsers(labData)
        const existingUsers = await User.find()
        if (existingUsers.length > 0) {
            console.log(`   已存在 ${existingUsers.length} 个用户，跳过创建`)
        } else {
            await User.create(userData)
            console.log(`   ✓ 成功创建 ${userData.length} 个用户`)
        }

        // 3. 创建库存数据
        console.log('\n3. 创建库存数据...')

        // 清空现有库存数据
        await Inventory.deleteMany({})
        console.log('   已清空现有库存数据')

        // 添加购买日期和过期日期
        const now = new Date()
        const inventoryWithDates = inventoryTemplates.map((item) => {
            // 随机购买日期（最近6个月内）
            const purchaseDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000)

            let expiryDate = null

            // 试剂类有50%概率添加过期日期
            if (item.category === '试剂') {
                expiryDate = new Date(purchaseDate.getTime() + (365 * 2 + Math.random() * 365 * 3) * 24 * 60 * 60 * 1000)
            }

            return {
                ...item,
                purchaseDate,
                expiryDate
            }
        })

        await Inventory.create(inventoryWithDates)
        console.log(`   ✓ 成功创建 ${inventoryWithDates.length} 条库存数据`)

        // 4. 统计信息
        console.log('\n数据注入完成！')
        console.log('='.repeat(50))
        console.log(`实验室数量: ${labData.length}`)
        console.log(`用户数量: ${userData.length}`)
        console.log(`库存数量: ${inventoryWithDates.length}`)
        console.log('='.repeat(50))

        // 5. 按实验室统计库存
        console.log('\n各实验室库存统计:')
        for (const lab of labData) {
            const count = inventoryWithDates.filter(item => item.labName === lab.labName).length
            console.log(`  ${lab.labName}(${lab.university}): ${count} 条`)
        }

        // 6. 按分类统计
        console.log('\n库存分类统计:')
        const categories = ['试剂', '耗材', '仪器', '其他']
        for (const category of categories) {
            const count = inventoryWithDates.filter(item => item.category === category).length
            console.log(`  ${category}: ${count} 条`)
        }

        // 7. 按状态统计
        console.log('\n库存状态统计:')
        const statusCount = {}
        inventoryWithDates.forEach(item => {
            statusCount[item.status] = (statusCount[item.status] || 0) + 1
        })
        Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`  ${status}: ${count} 条`)
        })

        console.log('\n✓ 所有数据注入成功！')

    } catch (error) {
        console.error('数据注入失败:', error)
        process.exit(1)
    } finally {
        mongoose.disconnect()
    }
}
