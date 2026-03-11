const mongoose = require('mongoose')
const createConnection = async () => {
    try {
        // 从环境变量读取 MongoDB 连接字符串，或使用默认本地连接
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
        await mongoose.connect(mongoUri);

        console.log('成功连接到数据库')
    } catch (error) {
        console.error('貌似出了些问题:', error)
    }
}
const closeConnection = async () => {
    try {
        await mongoose.connection.close()
        console.log('Disconnected from MongoDB')
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error)
    }
}

exports.createConnection = createConnection
exports.closeConnection = closeConnection