const Lab = require('../../models/LabModel/LabModel.js');

const labServices = {
    // 获取所有实验室列表
    getList: async () => {
        try {
            const labs = await Lab.find({ status: 'active' })
                .select('labName university managerName managerContact status createdAt')
                .sort({ createdAt: -1 });
            return { success: true, data: labs };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 根据 labName 获取实验室详情
    getDetail: async (labName) => {
        try {
            const lab = await Lab.findOne({ labName });
            if (!lab) {
                return { success: false, message: '实验室不存在' };
            }
            return { success: true, data: lab };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 创建实验室
    create: async (labData) => {
        try {
            const { labName, university, managerName, managerContact, status = 'active' } = labData;

            // 验证必填字段
            if (!labName || !university) {
                return { success: false, message: '实验室名称和所属大学为必填项' };
            }

            // 检查实验室名称是否已存在
            const existingLab = await Lab.findOne({ labName });
            if (existingLab) {
                return { success: false, message: '该实验室名称已存在' };
            }

            // 创建实验室
            const lab = await Lab.create({
                labName,
                university,
                managerName,
                managerContact,
                status
            });

            return { success: true, data: lab, message: '创建成功' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 更新实验室信息
    update: async (labName, updateData) => {
        try {
            const lab = await Lab.findOne({ labName });
            if (!lab) {
                return { success: false, message: '实验室不存在' };
            }

            // 如果要修改 labName，检查新名称是否已被占用
            if (updateData.labName && updateData.labName !== labName) {
                const existingLab = await Lab.findOne({ labName: updateData.labName });
                if (existingLab) {
                    return { success: false, message: '该实验室名称已存在' };
                }
            }

            // 更新实验室信息
            const updatedLab = await Lab.findOneAndUpdate(
                { labName },
                updateData,
                { returnDocument: 'after' }
            );

            return { success: true, data: updatedLab, message: '更新成功' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 删除实验室（软删除，设置状态为 inactive）
    delete: async (labName) => {
        try {
            const lab = await Lab.findOne({ labName });
            if (!lab) {
                return { success: false, message: '实验室不存在' };
            }

            lab.status = 'inactive';
            await lab.save();

            return { success: true, message: '删除成功' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 搜索实验室（支持模糊搜索）
    search: async (keyword) => {
        try {
            // 如果关键词为空，返回所有活跃实验室
            if (!keyword || keyword.trim() === '') {
                const labs = await Lab.find({ status: 'active' })
                    .select('labName university managerName managerContact status createdAt')
                    .sort({ createdAt: -1 });
                return { success: true, data: labs };
            }

            // 转义特殊字符，避免正则表达式错误
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // 模糊搜索：实验室名称、大学、负责人
            const labs = await Lab.find({
                status: 'active',
                $or: [
                    { labName: { $regex: escapedKeyword, $options: 'i' } },
                    { university: { $regex: escapedKeyword, $options: 'i' } },
                    { managerName: { $regex: escapedKeyword, $options: 'i' } }
                ]
            })
            .select('labName university managerName managerContact status createdAt')
            .sort({ createdAt: -1 });

            return { success: true, data: labs };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

module.exports = labServices;
