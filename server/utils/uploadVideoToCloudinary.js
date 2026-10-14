import cloudinary from './cloudinary.js'

export const uploadVideoBufferToCloudinary = (buffer, options = {}) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: 'social-media/reels', ...options },
        (error, result) => error ? reject(error) : resolve(result)
    )
    stream.end(buffer)
})
