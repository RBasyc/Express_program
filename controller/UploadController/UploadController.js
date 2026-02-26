const multer = require('multer')
const path = require('path')
const uploadServices = require('../../services/UploadServices/UploadServices.js')

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadServices.getUploadDir())
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, 'img-' + uniqueSuffix + ext)
  }
})

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('只允许上传图片文件'), false)
  }
}

// 创建 multer 实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  }
})

const UploadController = {
  /**
   * 上传单个图片
   * POST /api/upload/image
   */
  uploadSingle: [
    upload.single('file'),
    (req, res) => {
      try {
        const fileInfo = uploadServices.processSingleFile(req.file, req)

        if (!fileInfo) {
          return res.json({
            errCode: '1',
            errorInfo: '请选择文件'
          })
        }

        res.json({
          errCode: '0',
          errorInfo: 'success',
          data: fileInfo
        })
      } catch (error) {
        res.json({
          errCode: '1',
          errorInfo: error.message
        })
      }
    }
  ]
}

module.exports = UploadController
