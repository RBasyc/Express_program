/**
 * 测试出入库功能
 * 使用前请确保：
 * 1. 后端服务已启动 (npm start)
 * 2. MongoDB 正在运行
 * 3. 已有有效的用户账号
 *
 * 测试凭证通过环境变量配置：
 * - TEST_USERNAME: 测试用户名
 * - TEST_PASSWORD: 测试密码
 */

// 如果你使用的 Node 版本较低，可能需要安装 node-fetch
// npm install node-fetch

const testTransaction = async () => {
    const baseURL = 'http://localhost:3000';

    // 从环境变量读取测试凭证，或使用占位符
    const testUsername = process.env.TEST_USERNAME || 'YOUR_USERNAME';
    const testPassword = process.env.TEST_PASSWORD || 'YOUR_PASSWORD';

    console.log('开始测试出入库功能...\n');

    // 1. 首先登录获取 token
    console.log('=== 1. 登录获取 token ===');
    try {
        const loginResponse = await fetch(`${baseURL}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nickName: testUsername,
                password: testPassword
            })
        });

        const loginData = await loginResponse.json();
        console.log('登录响应:', JSON.stringify(loginData, null, 2));

        if (loginData.errCode !== '0') {
            console.error('❌ 登录失败，请修改脚本中的用户名密码');
            return;
        }

        const token = loginData.token;
        console.log('✅ Token 获取成功:', token.substring(0, 20) + '...');

        // 2. 获取库存列表（找一个耗材ID）
        console.log('\n=== 2. 获取库存列表 ===');
        const inventoryResponse = await fetch(`${baseURL}/adminapi/inventory/list`, {
            headers: { 'Authorization': token }
        });

        const inventoryData = await inventoryResponse.json();
        console.log('库存列表:', inventoryData.errCode === '0' ? `✅ 成功，共 ${inventoryData.data?.total || 0} 条` : '❌ 失败');

        if (inventoryData.errCode !== '0' || !inventoryData.data?.items?.length) {
            console.error('❌ 没有找到耗材数据，请先添加一些耗材');
            return;
        }

        const inventoryId = inventoryData.data.items[0]._id;
        const inventoryName = inventoryData.data.items[0].name;
        console.log(`✅ 使用耗材: ${inventoryName} (ID: ${inventoryId})`);

        // 3. 测试入库操作
        console.log('\n=== 3. 测试入库操作 ===');
        const stockInResponse = await fetch(`${baseURL}/adminapi/transaction/stock-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                inventoryId: inventoryId,
                type: 'purchase_in',
                quantity: 10,
                remark: '测试入库'
            })
        });

        const stockInData = await stockInResponse.json();
        console.log('入库响应:', JSON.stringify(stockInData, null, 2));

        if (stockInData.errCode === '0') {
            console.log('✅ 入库成功！');
            console.log(`   新库存数量: ${stockInData.data.inventory.quantity}`);
            console.log(`   流水记录ID: ${stockInData.data.transaction._id}`);
        } else {
            console.error('❌ 入库失败:', stockInData.errorInfo);
        }

        // 4. 测试出库操作
        console.log('\n=== 4. 测试出库操作 ===');
        const stockOutResponse = await fetch(`${baseURL}/adminapi/transaction/stock-out`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                inventoryId: inventoryId,
                type: 'consume_out',
                quantity: 5,
                remark: '测试出库'
            })
        });

        const stockOutData = await stockOutResponse.json();
        console.log('出库响应:', JSON.stringify(stockOutData, null, 2));

        if (stockOutData.errCode === '0') {
            console.log('✅ 出库成功！');
            console.log(`   新库存数量: ${stockOutData.data.inventory.quantity}`);
            console.log(`   流水记录ID: ${stockOutData.data.transaction._id}`);
        } else {
            console.error('❌ 出库失败:', stockOutData.errorInfo);
        }

        // 5. 查询流水记录
        console.log('\n=== 5. 查询流水记录 ===');
        const recordsResponse = await fetch(`${baseURL}/adminapi/transaction/records`, {
            headers: { 'Authorization': token }
        });

        const recordsData = await recordsResponse.json();
        console.log('流水记录:', recordsData.errCode === '0' ? `✅ 成功，共 ${recordsData.data?.total || 0} 条` : '❌ 失败');

        if (recordsData.errCode === '0' && recordsData.data?.transactions?.length > 0) {
            console.log('\n最近的流水记录:');
            recordsData.data.transactions.slice(0, 3).forEach((t, i) => {
                console.log(`  ${i + 1}. ${t.type} | 数量: ${t.quantity} | 时间: ${new Date(t.createdAt).toLocaleString()}`);
            });
        }

        console.log('\n=== 测试完成 ===');
        console.log('如果看到入库和出库都成功，说明功能正常！');
        console.log('请在 MongoDB 中检查 transactions 集合');

    } catch (error) {
        console.error('❌ 测试出错:', error.message);
        console.error('详细错误:', error);
    }
};

// 运行测试
console.log('========================================');
console.log('出入库功能测试脚本');
console.log('========================================');
testTransaction().catch(console.error);
