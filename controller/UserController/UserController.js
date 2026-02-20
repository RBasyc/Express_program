const userServices = require('../../services/UserServices/UserServices.js');
const JWT = require('../../utils/JWT');

const UserController = {
    login: async (req, res) => {
        const { nickName,password} = req.body;
        const user = await userServices.login(nickName, password);
        if (!user) {
            return res.status(400).send({ errCode: '-1', errorInfo: '用户不存在或信息不匹配' })
        }
        else {
            const token = JWT.generate({
                _id: user._id,
                username: user.username
            }, "1d")
            res.header("Authorization", token)
            res.status(200).send({ errCode: '0', errorInfo: '登录成功', token })
        }
    }
}

module.exports = UserController;
