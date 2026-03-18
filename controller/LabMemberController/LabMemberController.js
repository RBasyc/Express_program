const labMemberServices = require('../../services/LabMemberServices/LabMemberServices.js');
const JWT = require('../../utils/JWT');

const LabMemberController = {
    /**
     * Get user's laboratories
     */
    getMyLabs: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;

            if (!userId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            const result = await labMemberServices.getMyLabs(userId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取实验室列表失败'
            });
        }
    },

    /**
     * Get current active lab
     */
    getCurrent: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;

            if (!userId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            const result = await labMemberServices.getCurrentLab(userId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取当前实验室失败'
            });
        }
    },

    /**
     * Switch active lab
     */
    switchLab: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labId = req.params.labId;

            if (!userId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            const result = await labMemberServices.switchLab(userId, labId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            // Generate new token with updated lab info
            const newToken = JWT.generate({
                _id: userId,
                nickName: payload.nickName,
                labName: result.data.currentLabName,
                labId: result.data.currentLabId
            }, '1d');

            res.header('Authorization', newToken);

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data,
                token: newToken
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '切换实验室失败'
            });
        }
    },

    /**
     * Apply to join lab
     */
    applyToLab: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const { labId, reason } = req.body;

            if (!userId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            if (!labId) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '请选择要加入的实验室'
                });
            }

            const result = await labMemberServices.applyToLab(userId, labId, reason);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: '申请已提交，请等待管理员审批',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '申请加入实验室失败'
            });
        }
    },

    /**
     * Get pending members (admin only)
     */
    getPendingMembers: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labId = req.params.labId;

            if (!userId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            // Check if user is lab admin
            const isAdmin = await labMemberServices.isLabAdmin(userId, labId);
            if (!isAdmin) {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '需要实验室管理员权限'
                });
            }

            const result = await labMemberServices.getPendingMembers(labId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取待审批成员失败'
            });
        }
    },

    /**
     * Approve application (admin only)
     */
    approveApplication: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const approverId = payload?._id;
            const memberId = req.params.memberId;
            const { role } = req.body;

            if (!approverId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            // Get the lab member to check which lab it's for
            const { LabMember } = require('../../models/index');
            const member = await LabMember.findById(memberId);

            if (!member) {
                return res.status(404).send({
                    errCode: '-1',
                    errorInfo: '申请记录不存在'
                });
            }

            // Check if user is lab admin
            const isAdmin = await labMemberServices.isLabAdmin(approverId, member.labId);
            if (!isAdmin) {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '需要实验室管理员权限'
                });
            }

            const result = await labMemberServices.approveApplication(memberId, approverId, role || 'member');

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: result.message,
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '审批申请失败'
            });
        }
    },

    /**
     * Reject application (admin only)
     */
    rejectApplication: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const approverId = payload?._id;
            const memberId = req.params.memberId;
            const { reason } = req.body;

            if (!approverId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            // Get the lab member to check which lab it's for
            const { LabMember } = require('../../models/index');
            const member = await LabMember.findById(memberId);

            if (!member) {
                return res.status(404).send({
                    errCode: '-1',
                    errorInfo: '申请记录不存在'
                });
            }

            // Check if user is lab admin
            const isAdmin = await labMemberServices.isLabAdmin(approverId, member.labId);
            if (!isAdmin) {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '需要实验室管理员权限'
                });
            }

            const result = await labMemberServices.rejectApplication(memberId, approverId, reason);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: result.message
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '拒绝申请失败'
            });
        }
    },

    /**
     * Get lab members (admin only)
     */
    getLabMembers: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labId = req.params.labId;
            const { status, page, pageSize } = req.query;

            if (!userId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            // Check if user is lab admin
            const isAdmin = await labMemberServices.isLabAdmin(userId, labId);
            if (!isAdmin) {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '需要实验室管理员权限'
                });
            }

            const result = await labMemberServices.getLabMembers(
                labId,
                status,
                parseInt(page) || 1,
                parseInt(pageSize) || 20
            );

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取实验室成员失败'
            });
        }
    },

    /**
     * Change member role (admin only)
     */
    changeRole: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const operatorId = payload?._id;
            const memberId = req.params.memberId;
            const { role } = req.body;

            if (!operatorId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            if (!role || !['admin', 'member'].includes(role)) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '无效的角色'
                });
            }

            // Get the lab member to check which lab it's for
            const { LabMember } = require('../../models/index');
            const member = await LabMember.findById(memberId);

            if (!member) {
                return res.status(404).send({
                    errCode: '-1',
                    errorInfo: '成员记录不存在'
                });
            }

            // Check if user is lab admin
            const isAdmin = await labMemberServices.isLabAdmin(operatorId, member.labId);
            if (!isAdmin) {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '需要实验室管理员权限'
                });
            }

            const result = await labMemberServices.changeRole(memberId, role, operatorId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: result.message
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '修改角色失败'
            });
        }
    },

    /**
     * Remove member (admin only)
     */
    removeMember: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const operatorId = payload?._id;
            const memberId = req.params.memberId;

            if (!operatorId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            // Get the lab member to check which lab it's for
            const { LabMember } = require('../../models/index');
            const member = await LabMember.findById(memberId);

            if (!member) {
                return res.status(404).send({
                    errCode: '-1',
                    errorInfo: '成员记录不存在'
                });
            }

            // Check if user is lab admin
            const isAdmin = await labMemberServices.isLabAdmin(operatorId, member.labId);
            if (!isAdmin) {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '需要实验室管理员权限'
                });
            }

            const result = await labMemberServices.removeMember(memberId, operatorId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: result.message
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '移除成员失败'
            });
        }
    },

    /**
     * Leave lab
     */
    leaveLab: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labId = req.params.labId;

            if (!userId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            const result = await labMemberServices.leaveLab(userId, labId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: result.message
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '离开实验室失败'
            });
        }
    },

    /**
     * Get member logs (admin only)
     */
    getLogs: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const labId = req.params.labId;
            const { page, pageSize } = req.query;

            if (!userId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            // Check if user is lab admin
            const isAdmin = await labMemberServices.isLabAdmin(userId, labId);
            if (!isAdmin) {
                return res.status(403).send({
                    errCode: '-1',
                    errorInfo: '需要实验室管理员权限'
                });
            }

            const result = await labMemberServices.getLogs(
                labId,
                parseInt(page) || 1,
                parseInt(pageSize) || 20
            );

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: 'success',
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '获取日志失败'
            });
        }
    },

    /**
     * Add user as lab admin directly (for lab creator)
     */
    addAdminDirectly: async (req, res) => {
        try {
            const token = req.headers['authorization'];
            const payload = JWT.verify(token);
            const userId = payload?._id;
            const { labId } = req.body;

            if (!userId) {
                return res.status(401).send({
                    errCode: '-1',
                    errorInfo: '未授权访问'
                });
            }

            if (!labId) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: '实验室ID不能为空'
                });
            }

            const result = await labMemberServices.addLabAdminDirectly(userId, labId);

            if (!result.success) {
                return res.status(400).send({
                    errCode: '-1',
                    errorInfo: result.message
                });
            }

            res.status(200).send({
                errCode: '0',
                errorInfo: result.message,
                data: result.data
            });
        } catch (error) {
            res.status(500).send({
                errCode: '-1',
                errorInfo: error.message || '添加管理员失败'
            });
        }
    }
};

module.exports = LabMemberController;
