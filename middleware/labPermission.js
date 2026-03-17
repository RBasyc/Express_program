const { LabMember } = require('../models/index');
const JWT = require('../utils/JWT');

/**
 * Lab Permission Middleware
 * Verifies that users have access to the lab and checks role requirements
 *
 * @param {string} requiredRole - 'admin' | 'member' (default: 'member')
 * @returns {Function} Express middleware function
 */
const labPermission = (requiredRole = 'member') => {
    return async (req, res, next) => {
        try {
            // Extract token from Authorization header
            const authorization = req.headers['authorization'];
            if (!authorization) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未提供token'
                });
            }

            // Verify token
            const payload = JWT.verify(authorization);
            if (!payload) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: 'token无效或已过期'
                });
            }

            const userId = payload?._id;
            const labId = payload?.labId;

            // Check if user has an active lab
            if (!labId) {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '请先加入一个实验室'
                });
            }

            // Find user's active membership in the lab
            const member = await LabMember.findOne({
                userId: userId,
                labId: labId,
                status: 'active'
            });

            if (!member) {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '您无权访问该实验室的数据'
                });
            }

            // Check role requirements
            if (requiredRole === 'admin' && member.role !== 'admin') {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '需要实验室管理员权限'
                });
            }

            // Attach member info to request for use in controllers
            req.labMember = member;
            req.userId = userId;
            req.labId = labId;
            req.userRole = member.role;

            next();
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '权限验证失败'
            });
        }
    };
};

module.exports = labPermission;
