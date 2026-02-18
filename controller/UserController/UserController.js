const userServices = require('../../services/UserServices/UserServices.js');
const JWT = require('../../utils/JWT');

const UserController = {
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
    }
}

module.exports = UserController;
