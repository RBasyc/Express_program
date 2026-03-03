// 测试库存管理 API
// 这个脚本会先尝试登录，然后测试库存 API

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let token = '';

// 发送 HTTP 请求的辅助函数
function request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAPI() {
    console.log('=== 库存管理 API 测试 ===\n');

    try {
        // 1. 尝试登录获取 token（需要先在数据库中创建用户）
        console.log('1. 尝试登录...');
        const loginResult = await request('POST', '/user/login', {
            nickName: 'Admin',
            password: '123456'
        });

        if (loginResult.status === 200 && loginResult.data.errCode === '0') {
            token = loginResult.data.token;
            console.log('   ✓ 登录成功，获取到 token');
        } else {
            console.log('   ✗ 登录失败，请先创建用户');
            console.log('   提示: 可以通过 /user/register 接口注册一个用户');
            return;
        }

        // 2. 测试获取库存列表
        console.log('\n2. 测试获取库存列表...');
        const listResult = await request('GET', '/adminapi/inventory/list', null, {
            'authorization': token
        });

        if (listResult.status === 200 && listResult.data.errCode === '0') {
            console.log(`   ✓ 获取成功，共 ${listResult.data.data.total} 条数据`);
            console.log(`   ✓ 当前页: ${listResult.data.data.page}/${listResult.data.data.totalPages}`);
            if (listResult.data.data.items.length > 0) {
                console.log('   前3条数据:');
                listResult.data.data.items.slice(0, 3).forEach(item => {
                    console.log(`     - ${item.code}: ${item.name} (${item.category}) - ${item.quantity}${item.unit}`);
                });
            }
        } else {
            console.log('   ✗ 获取失败:', listResult.data);
        }

        // 3. 测试搜索功能
        console.log('\n3. 测试搜索功能（搜索"乙醇"）...');
        const searchResult = await request('GET', '/adminapi/inventory/search?keyword=乙醇', null, {
            'authorization': token
        });

        if (searchResult.status === 200 && searchResult.data.errCode === '0') {
            console.log(`   ✓ 搜索成功，找到 ${searchResult.data.data.total} 条结果`);
        } else {
            console.log('   ✗ 搜索失败:', searchResult.data);
        }

        // 4. 测试获取预警列表
        console.log('\n4. 测试获取预警列表...');
        const alertResult = await request('GET', '/adminapi/inventory/alerts', null, {
            'authorization': token
        });

        if (alertResult.status === 200 && alertResult.data.errCode === '0') {
            console.log(`   ✓ 获取成功，${alertResult.data.data.total} 个预警项`);
            if (alertResult.data.data.summary) {
                console.log('   预警统计:', JSON.stringify(alertResult.data.data.summary));
            }
        } else {
            console.log('   ✗ 获取失败:', alertResult.data);
        }

        console.log('\n=== 测试完成 ===');

    } catch (error) {
        console.error('测试过程出错:', error.message);
    }
}

testAPI();
