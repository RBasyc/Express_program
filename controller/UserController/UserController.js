const userServices = require('../../services/UserServices/UserServices.js');
const JWT = require('../../utils/JWT');

const UserController = {
    login: async (req, res) => {
        const { nickName, password } = req.body;
        const user = await userServices.login(nickName, password);
        if (!user) {
            return res.status(400).send({ errCode: '-1', errorInfo: '用户不存在或信息不匹配' })
        }
        else {
            const token = JWT.generate({
                _id: user._id,
                nickName: user.nickName
            }, "1d")
            res.header("Authorization", token)
            res.status(200).send({ errCode: '0', errorInfo: '登录成功', token, userInfo: user })
        }
    },
    register: async (req, res) => {
        const { nickName, password } = req.body;
        const user = await userServices.register(nickName, password);
        if (!user) {
            return res.status(400).send({ errCode: '-1', errorInfo: '注册失败，用户名可能已存在' })
        }
        else {
            res.status(200).send({
                errCode: '0',
                errorInfo: '注册成功',
                userInfo: {
                    _id: user._id,
                    nickName: user.nickName,
                    role: user.role,
                    avatar: user.avatar,
                    createdAt: user.createdAt
                }
            })
        }
    },
    updateProfile: async (req, res) => {


        const { _id, realName, email, phone, avatar } = req.body;

        const updatedUser = await userServices.updateProfile(_id, realName, email, phone, avatar);
        if (!updatedUser) {
            return res.status(400).send({ errCode: '-1', errorInfo: '更新失败，可能是用户不存在或信息不合法' })
        }
        else {
            res.status(200).send({ errCode: '0', errorInfo: '更新成功', updatedUser })
        }
    }
}

module.exports = UserController;
