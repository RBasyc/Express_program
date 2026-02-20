/**
 * 微信小程序配置
 * 请根据您的实际小程序配置修改以下信息
 */
module.exports = {
    // 小程序 AppID
    appId: 'your_app_id_here',

    // 小程序 AppSecret
    appSecret: 'your_app_secret_here',

    // 微信服务器接口地址
    wechatApi: {
        // code2session接口：通过code换取openid和session_key
        code2Session: 'https://api.weixin.qq.com/sns/jscode2session',
        // getAccessToken接口：获取access_token
        getAccessToken: 'https://api.weixin.qq.com/cgi-bin/token'
    }
}
