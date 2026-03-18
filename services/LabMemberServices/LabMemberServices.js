const { LabMember, LabMemberLog, User, Lab } = require('../../models/index');

const labMemberServices = {
    /**
     * Get user's laboratories with active lab marked
     */
    getMyLabs: async (userId) => {
        try {
            const members = await LabMember.find({
                userId: userId,
                status: { $in: ['active', 'pending'] }
            }).populate('labId').sort({ createdAt: -1 });

            const items = members.map(member => ({
                id: member._id,
                labId: member.labId._id,
                labName: member.labId.labName,
                university: member.labId.university,
                role: member.role,
                status: member.status,
                isActive: member.isActive,
                joinedAt: member.joinedAt
            }));

            return {
                success: true,
                data: {
                    items,
                    total: items.length
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Get current active lab
     */
    getCurrentLab: async (userId) => {
        try {
            const activeMember = await LabMember.findOne({
                userId: userId,
                isActive: true,
                status: 'active'
            }).populate('labId');

            if (!activeMember) {
                return {
                    success: true,
                    data: null
                };
            }

            return {
                success: true,
                data: {
                    labId: activeMember.labId._id,
                    labName: activeMember.labId.labName,
                    university: activeMember.labId.university,
                    role: activeMember.role
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Switch active lab
     */
    switchLab: async (userId, labId) => {
        try {
            // Verify user is a member of this lab
            const member = await LabMember.findOne({
                userId: userId,
                labId: labId,
                status: 'active'
            });

            if (!member) {
                return {
                    success: false,
                    message: '您不是该实验室的成员'
                };
            }

            // Deactivate all other labs
            await LabMember.updateMany(
                { userId: userId, isActive: true },
                { isActive: false }
            );

            // Activate this lab
            await LabMember.findOneAndUpdate(
                { _id: member._id },
                { isActive: true },
                { returnDocument: 'after' }
            );

            // Get lab details
            const lab = await Lab.findById(labId);

            return {
                success: true,
                data: {
                    currentLabId: labId,
                    currentLabName: lab.labName,
                    role: member.role // 返回成员在该实验室的角色
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Apply to join lab
     */
    applyToLab: async (userId, labId, reason) => {
        try {
            // Check if lab exists
            const lab = await Lab.findById(labId);
            if (!lab) {
                return {
                    success: false,
                    message: '实验室不存在'
                };
            }

            // Check if already applied or member
            const existingMember = await LabMember.findOne({
                userId: userId,
                labId: labId
            });

            if (existingMember) {
                if (existingMember.status === 'pending') {
                    return {
                        success: false,
                        message: '您已申请加入该实验室，请等待管理员审批'
                    };
                }
                if (existingMember.status === 'active') {
                    return {
                        success: false,
                        message: '您已是该实验室的成员'
                    };
                }
                if (existingMember.status === 'rejected') {
                    // Update rejected application to pending
                    const updatedMember = await LabMember.findOneAndUpdate(
                        { _id: existingMember._id },
                        {
                            status: 'pending',
                            role: 'pending',
                            applicationReason: reason,
                            rejectedReason: null
                        },
                        { returnDocument: 'after' }
                    );

                    // Create log
                    await LabMemberLog.create({
                        memberId: updatedMember._id,
                        userId: userId,
                        labId: labId,
                        action: 'apply',
                        operatorId: userId,
                        operatorName: (await User.findById(userId)).nickName,
                        remark: reason || '重新申请加入实验室'
                    });

                    return {
                        success: true,
                        data: {
                            memberId: updatedMember._id,
                            status: 'pending'
                        }
                    };
                }
                if (existingMember.status === 'left') {
                    // Update left member to pending (re-apply)
                    const updatedMember = await LabMember.findOneAndUpdate(
                        { _id: existingMember._id },
                        {
                            status: 'pending',
                            role: 'pending',
                            applicationReason: reason,
                            rejectedReason: null,
                            isActive: false
                        },
                        { returnDocument: 'after' }
                    );

                    // Create log
                    await LabMemberLog.create({
                        memberId: updatedMember._id,
                        userId: userId,
                        labId: labId,
                        action: 'apply',
                        operatorId: userId,
                        operatorName: (await User.findById(userId)).nickName,
                        remark: reason || '重新申请加入实验室'
                    });

                    return {
                        success: true,
                        data: {
                            memberId: updatedMember._id,
                            status: 'pending'
                        }
                    };
                }
            }

            // Create new membership application
            const member = await LabMember.create({
                userId: userId,
                labId: labId,
                role: 'pending',
                status: 'pending',
                applicationReason: reason
            });

            // Create log
            const user = await User.findById(userId);
            await LabMemberLog.create({
                memberId: member._id,
                userId: userId,
                labId: labId,
                action: 'apply',
                operatorId: userId,
                operatorName: user.nickName,
                remark: reason || '申请加入实验室'
            });

            return {
                success: true,
                data: {
                    memberId: member._id,
                    status: 'pending'
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Get pending members for lab (admin only)
     */
    getPendingMembers: async (labId) => {
        try {
            const pendingMembers = await LabMember.find({
                labId: labId,
                status: 'pending'
            }).populate('userId');

            const items = pendingMembers.map(member => ({
                id: member._id,
                userId: member.userId._id,
                userName: member.userId.nickName,
                realName: member.userId.realName,
                applicationReason: member.applicationReason,
                appliedAt: member.createdAt
            }));

            return {
                success: true,
                data: {
                    items,
                    total: items.length
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Approve application (admin only)
     */
    approveApplication: async (memberId, approverId, role) => {
        try {
            const member = await LabMember.findById(memberId);
            if (!member) {
                return {
                    success: false,
                    message: '申请记录不存在'
                };
            }

            if (member.status !== 'pending') {
                return {
                    success: false,
                    message: '该申请已被处理'
                };
            }

            // Update member status
            const updatedMember = await LabMember.findOneAndUpdate(
                { _id: memberId },
                {
                    status: 'active',
                    role: role || 'member',
                    approvedBy: approverId,
                    approvedAt: new Date()
                },
                { returnDocument: 'after' }
            );

            // Create log
            const approver = await User.findById(approverId);
            await LabMemberLog.create({
                memberId: memberId,
                userId: member.userId,
                labId: member.labId,
                action: 'approve',
                beforeRole: 'pending',
                afterRole: role || 'member',
                operatorId: approverId,
                operatorName: approver.nickName,
                remark: '审批通过申请'
            });

            return {
                success: true,
                message: '已通过申请',
                data: {
                    memberId: memberId,
                    role: role || 'member'
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Reject application (admin only)
     */
    rejectApplication: async (memberId, approverId, reason) => {
        try {
            const member = await LabMember.findById(memberId);
            if (!member) {
                return {
                    success: false,
                    message: '申请记录不存在'
                };
            }

            if (member.status !== 'pending') {
                return {
                    success: false,
                    message: '该申请已被处理'
                };
            }

            // Update member status
            await LabMember.findOneAndUpdate(
                { _id: memberId },
                {
                    status: 'rejected',
                    rejectedReason: reason
                },
                { returnDocument: 'after' }
            );

            // Create log
            const approver = await User.findById(approverId);
            await LabMemberLog.create({
                memberId: memberId,
                userId: member.userId,
                labId: member.labId,
                action: 'reject',
                operatorId: approverId,
                operatorName: approver.nickName,
                remark: reason || '申请被拒绝'
            });

            return {
                success: true,
                message: '已拒绝申请'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Get lab members (admin only)
     */
    getLabMembers: async (labId, status, page = 1, pageSize = 20) => {
        try {
            const query = { labId: labId };
            if (status) {
                query.status = status;
            } else {
                query.status = { $in: ['active', 'pending'] };
            }

            const skip = (page - 1) * pageSize;

            const [total, members] = await Promise.all([
                LabMember.countDocuments(query),
                LabMember.find(query)
                    .populate('userId')
                    .populate('approvedBy', 'nickName')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(pageSize)
            ]);

            const items = members.map(member => ({
                id: member._id,
                userId: member.userId._id,
                userName: member.userId.nickName || member.userId.realName,
                userAvatar: member.userId.avatar,
                role: member.role,
                status: member.status,
                joinedAt: member.joinedAt,
                approvedBy: member.approvedBy?.nickName,
                approvedAt: member.approvedAt,
                applicationReason: member.applicationReason
            }));

            return {
                success: true,
                data: {
                    items,
                    total,
                    page,
                    pageSize
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Change member role (admin only)
     */
    changeRole: async (memberId, newRole, operatorId) => {
        try {
            const member = await LabMember.findById(memberId);
            if (!member) {
                return {
                    success: false,
                    message: '成员记录不存在'
                };
            }

            if (member.status !== 'active') {
                return {
                    success: false,
                    message: '只能修改正式成员的角色'
                };
            }

            // 检查是否是最后一个管理员
            if (member.role === 'admin' && newRole !== 'admin') {
                const adminCount = await LabMember.countDocuments({
                    labId: member.labId,
                    role: 'admin',
                    status: 'active'
                });

                if (adminCount <= 1) {
                    return {
                        success: false,
                        message: '实验室至少需要保留一名管理员'
                    };
                }
            }

            const beforeRole = member.role;

            // Update role
            await LabMember.findOneAndUpdate(
                { _id: memberId },
                { role: newRole },
                { returnDocument: 'after' }
            );

            // Create log
            const operator = await User.findById(operatorId);
            await LabMemberLog.create({
                memberId: memberId,
                userId: member.userId,
                labId: member.labId,
                action: 'role_change',
                beforeRole: beforeRole,
                afterRole: newRole,
                operatorId: operatorId,
                operatorName: operator.nickName,
                remark: `角色从 ${beforeRole} 变更为 ${newRole}`
            });

            return {
                success: true,
                message: '角色修改成功'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Remove member (admin only)
     */
    removeMember: async (memberId, operatorId) => {
        try {
            const member = await LabMember.findById(memberId);
            if (!member) {
                return {
                    success: false,
                    message: '成员记录不存在'
                };
            }

            // 检查是否是最后一个管理员
            if (member.role === 'admin') {
                const adminCount = await LabMember.countDocuments({
                    labId: member.labId,
                    role: 'admin',
                    status: 'active'
                });

                if (adminCount <= 1) {
                    return {
                        success: false,
                        message: '无法移除实验室的唯一管理员'
                    };
                }
            }

            // Update status to left
            await LabMember.findOneAndUpdate(
                { _id: memberId },
                {
                    status: 'left',
                    isActive: false
                },
                { returnDocument: 'after' }
            );

            // Create log
            const operator = await User.findById(operatorId);
            await LabMemberLog.create({
                memberId: memberId,
                userId: member.userId,
                labId: member.labId,
                action: 'remove',
                beforeRole: member.role,
                operatorId: operatorId,
                operatorName: operator.nickName,
                remark: '管理员移除成员'
            });

            return {
                success: true,
                message: '已移除成员'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Leave lab
     */
    leaveLab: async (userId, labId) => {
        try {
            const member = await LabMember.findOne({
                userId: userId,
                labId: labId
            });

            if (!member) {
                return {
                    success: false,
                    message: '您不是该实验室的成员'
                };
            }

            // Update status to left
            await LabMember.findOneAndUpdate(
                { _id: member._id },
                {
                    status: 'left',
                    isActive: false
                },
                { returnDocument: 'after' }
            );

            // Create log
            const user = await User.findById(userId);
            await LabMemberLog.create({
                memberId: member._id,
                userId: userId,
                labId: labId,
                action: 'leave',
                beforeRole: member.role,
                operatorId: userId,
                operatorName: user.nickName,
                remark: '主动离开实验室'
            });

            return {
                success: true,
                message: '已离开实验室'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Get member logs (admin only)
     */
    getLogs: async (labId, page = 1, pageSize = 20) => {
        try {
            const skip = (page - 1) * pageSize;

            const [total, logs] = await Promise.all([
                LabMemberLog.countDocuments({ labId: labId }),
                LabMemberLog.find({ labId: labId })
                    .populate('operatorId', 'nickName')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(pageSize)
            ]);

            const items = logs.map(log => ({
                id: log._id,
                action: log.action,
                beforeRole: log.beforeRole,
                afterRole: log.afterRole,
                operatorName: log.operatorName || log.operatorId?.nickName,
                remark: log.remark,
                createdAt: log.createdAt
            }));

            return {
                success: true,
                data: {
                    items,
                    total,
                    page,
                    pageSize
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Permission check helper
     */
    checkLabPermission: async (userId, labId, requiredRole = 'member') => {
        try {
            const member = await LabMember.findOne({
                userId: userId,
                labId: labId,
                status: 'active'
            });

            if (!member) {
                return {
                    success: false,
                    message: '您无权访问该实验室的数据'
                };
            }

            if (requiredRole === 'admin' && member.role !== 'admin') {
                return {
                    success: false,
                    message: '需要实验室管理员权限'
                };
            }

            return {
                success: true,
                data: member
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Check if user is lab admin
     */
    isLabAdmin: async (userId, labId) => {
        try {
            const member = await LabMember.findOne({
                userId: userId,
                labId: labId,
                status: 'active',
                role: 'admin'
            });

            return !!member;
        } catch (error) {
            return false;
        }
    },

    /**
     * Add user as lab admin directly (for lab creator)
     */
    addLabAdminDirectly: async (userId, labId) => {
        try {
            // Check if lab exists
            const lab = await Lab.findById(labId);
            if (!lab) {
                return {
                    success: false,
                    message: '实验室不存在'
                };
            }

            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在'
                };
            }

            // Check if already a member
            const existingMember = await LabMember.findOne({
                userId: userId,
                labId: labId
            });

            if (existingMember) {
                // Update to admin and active
                const updatedMember = await LabMember.findOneAndUpdate(
                    { _id: existingMember._id },
                    {
                        status: 'active',
                        role: 'admin',
                        isActive: true,
                        approvedBy: userId,
                        approvedAt: new Date()
                    },
                    { returnDocument: 'after' }
                );

                // Deactivate all other labs
                await LabMember.updateMany(
                    { userId: userId, _id: { $ne: existingMember._id } },
                    { isActive: false }
                );

                // Create log
                await LabMemberLog.create({
                    memberId: updatedMember._id,
                    userId: userId,
                    labId: labId,
                    action: 'approve',
                    operatorId: userId,
                    operatorName: user.nickName,
                    remark: '实验室创建者直接设为管理员'
                });

                return {
                    success: true,
                    data: {
                        memberId: updatedMember._id,
                        status: 'active',
                        role: 'admin'
                    },
                    message: '添加管理员成功'
                };
            }

            // Create new lab member as admin
            const newMember = await LabMember.create({
                userId: userId,
                labId: labId,
                status: 'active',
                role: 'admin',
                isActive: true,
                approvedBy: userId,
                approvedAt: new Date(),
                joinedAt: new Date()
            });

            // Deactivate all other labs
            await LabMember.updateMany(
                { userId: userId, _id: { $ne: newMember._id } },
                { isActive: false }
            );

            // Create log
            await LabMemberLog.create({
                memberId: newMember._id,
                userId: userId,
                labId: labId,
                action: 'approve',
                operatorId: userId,
                operatorName: user.nickName,
                remark: '实验室创建者直接设为管理员'
            });

            return {
                success: true,
                data: {
                    memberId: newMember._id,
                    status: 'active',
                    role: 'admin'
                },
                message: '添加管理员成功'
            };
        } catch (error) {
            console.error('addLabAdminDirectly error:', error);
            return {
                success: false,
                message: error.message || '添加管理员失败'
            };
        }
    }
};

module.exports = labMemberServices;
