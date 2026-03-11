const fs = require('fs');
const path = require('path');

/**
 * 简单的 .env 文件读取工具
 * 不需要安装 dotenv 包
 */
function loadEnvConfig() {
    const envPath = path.join(__dirname, '../.env');

    if (!fs.existsSync(envPath)) {
        console.warn('.env 文件不存在，使用默认配置');
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');

    // 移除 Windows 的 \r 字符，统一换行符
    const normalizedContent = envContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedContent.split('\n');

    lines.forEach((line, index) => {
        // 跳过注释和空行
        if (line.trim().startsWith('#') || line.trim() === '') {
            return;
        }

        // 解析 KEY=VALUE 格式
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();

            // 移除引号（如果有）
            const cleanValue = value.replace(/^["']|["']$/g, '');

            // 设置到 process.env
            process.env[key] = cleanValue;

            if (key === 'DEEPSEEK_API_KEY') {
                console.log(`✅ DeepSeek API Key 已加载`);
            }
        }
    });
}

// 加载 .env 配置
loadEnvConfig();

/**
 * 配置对象
 */
const config = {
    deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        apiBaseUrl: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE) || 0.7
    },
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'basyc'
    }
};

module.exports = config;
