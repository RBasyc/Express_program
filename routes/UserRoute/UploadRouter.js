const express = require('express')
const router = express.Router()
const UploadController = require('../../controller/UploadController/UploadController.js')

/**
 * 上传单个图片
 * POST /api/upload/image
 */
router.post('/image', ...UploadController.uploadSingle)

module.exports = router
