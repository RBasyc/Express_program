const mongoose = require('mongoose')
const createConnection = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/test', {
        })
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