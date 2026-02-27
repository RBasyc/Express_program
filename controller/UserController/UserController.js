const userServices = require('../../services/UserServices/UserServices.js');
const JWT = require('../../utils/JWT');

const UserController = {
    checkNickname: async (req, res) => {
        const { nickName } = req.query;
        if (!nickName) {
            return res.status(400).send({ errCode: '-1', errorInfo: '昵称不能为空' })
        }
        const exists = await userServices.checkNickname(nickName);
        if (exists) {
            res.status(200).send({
                errCode: '10001',
                errorInfo: '昵称已存在',
                data: { exists: true }
            })
        } else {
            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: { exists: false }
            })
        }
    },
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
            return res.status(400).send({ errCode: '10001', errorInfo: '该昵称已被使用', data: null })
        }
        else {
            const token = JWT.generate({
                _id: user._id,
                nickName: user.nickName
            }, "1d")
            res.header("Authorization", token)
            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: {
                    userId: user._id,
                    nickName: user.nickName,
                    token: token
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
    },

}

module.exports = UserController;
