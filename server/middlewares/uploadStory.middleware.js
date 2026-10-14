import multer from 'multer'

const uploadStory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype?.startsWith('image/') || file.mimetype?.startsWith('video/')) return callback(null, true)
    return callback(new Error('Only image and video files are allowed'))
  }
})

export default uploadStory
