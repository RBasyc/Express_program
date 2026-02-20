const userServices = require('../../services/UserServices/UserServices.js');
const JWT = require('../../utils/JWT');

const UserController = {
    // 普通登录
    login: async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send({ errCode: '-1', errorInfo: '用户名或密码不能为空' })
        }
        const user = await userServices.login(username, password);
        if (!user || user.username !== username || user.password !== password) {
            return res.status(400).send({ errCode: '-1', errorInfo: '用户名或密码错误' })
        }
        else {
            const token = JWT.generate({
                _id: user._id,
                username: user.username
            }, "1d")
            res.header("Authorization", token)
            res.send({ errCode: '0', errorInfo: '登录成功' })
        }
    },

    /**
     * 微信手机号登录
     */
    phoneLogin: async (req, res) => {
        try {
            const { code, phoneNumberCode, nickName, avatarUrl } = req.body;

            // 参数验证
            if (!code) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '缺少微信登录code'
                });
            }

            if (!phoneNumberCode) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '缺少手机号授权code'
                });
            }

            // 调用服务层进行登录
            const user = await userServices.phoneLogin(code, phoneNumberCode, nickName, avatarUrl);

            if (!user) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '登录失败，请重试'
                });
            }

            // 生成JWT token
            const token = JWT.generate({
                _id: user._id,
                openid: user.openid,
                userType: 'weixin'
            }, "7d"); // 微信登录token有效期7天

            // 设置响应头
            res.header("Authorization", token);

            // 返回用户信息
            res.send({
                errCode: '0',
                errorInfo: '登录成功',
                token: token,
                userInfo: {
                    _id: user._id,
                    openid: user.openid,
                    nickName: user.nickName,
                    avatarUrl: user.avatarUrl,
                    phoneNumber: user.phoneNumber,
                    userType: user.userType
                }
            });
        } catch (error) {
            console.error('微信手机号登录错误:', error);
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '登录失败，请稍后重试'
            });
        }
    }
}

module.exports = UserController;
