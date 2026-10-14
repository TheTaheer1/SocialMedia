import cloudinary from './cloudinary.js'

export const uploadBufferToCloudinary = (buffer, options = {}) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'social-media/profile-images', ...options },
        (error, result) => error ? reject(error) : resolve(result)
    )

    stream.end(buffer)
})
