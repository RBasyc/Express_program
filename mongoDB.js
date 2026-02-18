const mongoose = require('mongoose')
const createConnection = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/test', {
        })
        console.log('Connected to MongoDB')
    } catch (error) {
        console.error('Error connecting to MongoDB:', error)
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