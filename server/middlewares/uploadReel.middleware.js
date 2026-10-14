import multer from 'multer'

const uploadReel = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype?.startsWith('video/')) return callback(null, true)
        return callback(new Error('Only video files are allowed'))
    }
})

export default uploadReel
