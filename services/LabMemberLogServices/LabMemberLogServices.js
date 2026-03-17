const { LabMemberLog } = require('../../models/index');

const labMemberLogServices = {
    /**
     * Get logs with filters
     */
    getLogs: async (filters = {}, page = 1, pageSize = 20) => {
        try {
            const skip = (page - 1) * pageSize;

            const [total, logs] = await Promise.all([
                LabMemberLog.countDocuments(filters),
                LabMemberLog.find(filters)
                    .populate('operatorId', 'nickName')
                    .populate('userId', 'nickName')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(pageSize)
            ]);

            const items = logs.map(log => ({
                id: log._id,
                memberId: log.memberId,
                userId: log.userId,
                userName: log.userId?.nickName,
                labId: log.labId,
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
     * Get log by ID
     */
    getLogById: async (logId) => {
        try {
            const log = await LabMemberLog.findById(logId)
                .populate('operatorId', 'nickName')
                .populate('userId', 'nickName')
                .populate('labId', 'labName');

            if (!log) {
                return {
                    success: false,
                    message: '日志记录不存在'
                };
            }

            return {
                success: true,
                data: log
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
};

module.exports = labMemberLogServices;
