const jsonwebtoken = require('jsonwebtoken')
const config = require('./config')

// 从环境变量读取 JWT secret，生产环境必须设置强密钥
const secret = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production'

const JWT = {
    generate(value, exprires) {
        return jsonwebtoken.sign(value, secret, { expiresIn: exprires })
    },
    verify(token) {
        try {
            return jsonwebtoken.verify(token, secret)
        } catch {
            return false
        }
    }
}

module.exports = JWT