const axios = require('axios')
const crypto = require('crypto')
const wechatConfig = require('../config/wechat.config')

/**
 * 微信工具类
 */
class WechatUtil {
    /**
     * 通过code换取openid和session_key
     * @param {string} code - 微信登录code
     * @returns {Promise<{openid: string, session_key: string, unionid?: string}>}
     */
    static async code2Session(code) {
        try {
            const response = await axios.get(wechatConfig.wechatApi.code2Session, {
                params: {
                    appid: wechatConfig.appId,
                    secret: wechatConfig.appSecret,
                    js_code: code,
                    grant_type: 'authorization_code'
                }
            })

            const { openid, session_key, unionid, errcode, errmsg } = response.data

            if (errcode) {
                throw new Error(`微信接口错误: ${errcode} - ${errmsg}`)
            }

            return { openid, session_key, unionid }
        } catch (error) {
            console.error('code2Session错误:', error)
            throw new Error('获取微信用户信息失败')
        }
    }

    /**
     * 解密微信手机号
     * @param {string} encryptedData - 加密的数据
     * @param {string} iv - 加密算法的初始向量
     * @param {string} sessionKey - 会话密钥
     * @returns {Promise<object>} - 解密后的手机号信息
     */
    static decryptPhoneNumber(encryptedData, iv, sessionKey) {
        try {
            // Base64解码
            const encryptedDataBuffer = Buffer.from(encryptedData, 'base64')
            const ivBuffer = Buffer.from(iv, 'base64')
            const sessionKeyBuffer = Buffer.from(sessionKey, 'base64')

            // 解密
            const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer)
            decipher.setAutoPadding(true)

            let decrypted = decipher.update(encryptedDataBuffer, null, 'utf8')
            decrypted += decipher.final('utf8')

            const phoneNumberInfo = JSON.parse(decrypted)
            return phoneNumberInfo
        } catch (error) {
            console.error('解密手机号错误:', error)
            throw new Error('解密手机号失败')
        }
    }

    /**
     * 获取微信access_token
     * @returns {Promise<string>}
     */
    static async getAccessToken() {
        try {
            const response = await axios.get(wechatConfig.wechatApi.getAccessToken, {
                params: {
                    grant_type: 'client_credential',
                    appid: wechatConfig.appId,
                    secret: wechatConfig.appSecret
                }
            })

            const { access_token, errcode, errmsg } = response.data

            if (errcode) {
                throw new Error(`获取access_token失败: ${errcode} - ${errmsg}`)
            }

            return access_token
        } catch (error) {
            console.error('getAccessToken错误:', error)
            throw new Error('获取微信access_token失败')
        }
    }

    /**
     * 通过access_token和code获取手机号（新接口）
     * @param {string} code - 手机号授权code
     * @returns {Promise<object>} - 手机号信息
     */
    static async getPhoneNumberByCode(code) {
        try {
            const accessToken = await this.getAccessToken()

            const response = await axios.post(
                `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
                { code }
            )

            const { errcode, errmsg, phone_info } = response.data

            if (errcode) {
                throw new Error(`获取手机号失败: ${errcode} - ${errmsg}`)
            }

            return phone_info
        } catch (error) {
            console.error('getPhoneNumberByCode错误:', error)
            throw new Error('获取微信手机号失败')
        }
    }
}

module.exports = WechatUtil
