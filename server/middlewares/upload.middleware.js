import multer from 'multer'
import path from 'path'

const storage = multer.memoryStorage()

const fileFilter = (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const mime = file.mimetype?.toLowerCase() || ''
    const extension = path.extname(file.originalname || '').toLowerCase()

    if (allowedMimeTypes.includes(mime) || allowedExtensions.includes(extension)) {
        cb(null, true)
        return
    }

    cb(new Error('Only image files are allowed'))
}

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
})

export const uploadImage = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
])

export default upload
