const path = require('path')
const fs = require('fs')

// 确保上传目录存在
const uploadAvartarDir = path.join(__dirname, '../../public/avatar')
if (!fs.existsSync(uploadAvartarDir)) {
    fs.mkdirSync(uploadAvartarDir, { recursive: true })
}

const uploadServices = {
    /**
     * 获取上传目录路径
     */
    getUploadDir: () => {
        return uploadAvartarDir
    },

    /**
     * 处理单个文件上传结果
     * @param {Object} file - multer 上传的文件对象
     * @param {Object} req - 请求对象
     * @returns {Object} 文件信息
     */
    processSingleFile: (file, req) => {

        if (!file) {
            return null
        }

        return {
            url: uploadServices.buildFileUrl(file.filename, req),
            filename: file.filename,
            size: file.size
        }
    },

    /**
     * 构建文件访问 URL
     * @param {String} filename - 文件名
     * @param {Object} req - 请求对象
     * @returns {String} 文件访问 URL
     */
    buildFileUrl: (filename, req) => {
        const protocol = req.protocol
        const host = req.get('host')
        // 返回完整的可访问 URL
        return `${protocol}://${host}/public/avatar/${filename}`
    }
}

module.exports = uploadServices
