const { ShareRequest, User } = require('../../models/index.js');

const shareRequestServices = {
    // 获取共享需求列表（全局可见，不分实验室）
    getList: async (params = {}, labName) => {
        const { page = 1, pageSize = 10, status, requestType, keyword } = params;

        // 构建查询条件（不限制实验室，允许跨实验室查看）
        const query = {};

        // 处理 status 参数（支持逗号分隔的多个状态）
        if (status && status !== 'undefined' && status !== '') {
            // 如果包含逗号，使用 $in 查询
            if (status.includes(',')) {
                query.status = { $in: status.split(',').map(s => s.trim()) };
            } else {
                query.status = status;
            }
        }

        if (requestType && requestType !== 'undefined' && requestType !== '') {
            query.requestType = requestType;
        }
        if (keyword && keyword !== 'undefined' && keyword !== '') {
            const regex = new RegExp(keyword, 'i');
            query.$or = [
                { title: regex },
                { description: regex },
                { itemName: regex }
            ];
        }
        // 排除已取消和已完成的需求（如果没有指定 status）
        if (!query.status) {
            query.status = { $in: ['urgent', 'normal'] };
        }

        // 计算分页
        const skip = (page - 1) * pageSize;
        const limit = parseInt(pageSize);

        // 执行查询
        const [total, items] = await Promise.all([
            ShareRequest.countDocuments(query),
            ShareRequest.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('publisher', 'nickName realName avatar labName')
        ]);

        return {
            total,
            items,
            page: parseInt(page),
            pageSize: limit,
            totalPages: Math.ceil(total / limit)
        };
    },

    // 获取我的共享列表
    getMyShares: async (userId, labName) => {
        const items = await ShareRequest.find({
            publisher: userId
            // 注意：不限制 labName，因为用户可能更换实验室
            // 应该返回该用户发布过的所有共享，无论在哪个实验室
        })
        .sort({ createdAt: -1 })
        .populate('publisher', 'nickName realName avatar');

        // 格式化返回数据，只保留前端需要的字段
        const formattedItems = items.map(item => ({
            id: item._id,
            title: item.title,
            description: item.description,
            itemName: item.itemName,
            quantity: item.quantity,
            expectedTime: item.expectedTime,
            consultCount: item.consultCount,
            status: item.status,
            requestType: item.requestType,
            createdAt: item.createdAt
        }));

        return {
            items: formattedItems,
            total: items.length
        };
    },

    // 获取共享需求详情
    getDetail: async (id) => {
        const request = await ShareRequest.findById(id)
            .populate('publisher', 'nickName realName avatar phone email labName');

        if (!request) {
            return { success: false, message: '共享需求不存在' };
        }

        return { success: true, data: request };
    },

    // 发布共享需求
    add: async (data, userId, labName) => {
        const user = await User.findById(userId);
        if (!user) {
            return { success: false, message: '用户不存在' };
        }

        const publisherName = user.nickName || user.realName || '未知用户';
        const contact = user.phone || user.email || '未提供联系方式';

        const request = await ShareRequest.create({
            ...data,
            labName: labName,
            publisher: userId,
            publisherName,
            contact
        });

        return { success: true, data: request };
    },

    // 更新共享需求
    update: async (id, data, userId, labName) => {
        // 检查需求是否存在
        const existingRequest = await ShareRequest.findById(id);
        if (!existingRequest) {
            return { success: false, message: '共享需求不存在' };
        }

        // 只验证发布者权限，不验证实验室（用户可能更换实验室）
        if (existingRequest.publisher.toString() !== userId.toString()) {
            return { success: false, message: '无权修改其他人的共享需求' };
        }

        const updatedRequest = await ShareRequest.findOneAndUpdate(
            { _id: id },
            data,
            { returnDocument: 'after' }
        ).populate('publisher', 'nickName realName avatar');

        return { success: true, data: updatedRequest };
    },

    // 删除共享需求
    delete: async (id, userId, labName) => {
        const request = await ShareRequest.findById(id);
        if (!request) {
            return { success: false, message: '共享需求不存在' };
        }

        // 只验证发布者权限，不验证实验室（用户可能更换实验室）
        if (request.publisher.toString() !== userId.toString()) {
            return { success: false, message: '无权删除其他人的共享需求' };
        }

        await ShareRequest.findByIdAndDelete(id);
        return { success: true, message: '删除成功' };
    },

    // 咨询共享需求（增加计数）
    consult: async (id, userId) => {
        const request = await ShareRequest.findById(id);
        if (!request) {
            return { success: false, message: '共享需求不存在' };
        }

        // 不能咨询自己发布的需求
        if (request.publisher.toString() === userId.toString()) {
            return { success: false, message: '不能咨询自己发布的需求' };
        }

        // 检查是否已经咨询过（可选，如果需要记录谁咨询过）
        // 这里简化处理，只增加计数

        const updatedRequest = await ShareRequest.findOneAndUpdate(
            { _id: id },
            { $inc: { consultCount: 1 } },
            { returnDocument: 'after' }
        );

        return { success: true, data: { consultCount: updatedRequest.consultCount } };
    },

    // 获取发布者联系方式
    getContact: async (id) => {
        const request = await ShareRequest.findById(id)
            .populate('publisher', 'nickName realName phone email labName');

        if (!request) {
            return { success: false, message: '共享需求不存在' };
        }

        // 检查是否允许联系
        if (!request.allowContact) {
            return { success: false, message: '发布者不允许联系' };
        }

        // 返回联系方式（用于前端弹出复制）
        return {
            success: true,
            data: {
                publisherName: request.publisherName,
                contact: request.contact,
                contactType: request.publisher.phone ? 'phone' : 'email',
                fullContact: `${request.publisherName}: ${request.contact}`
            }
        };
    }
};

module.exports = shareRequestServices;
