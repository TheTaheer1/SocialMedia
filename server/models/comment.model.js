import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    reel: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel' }
}, { timestamps: true })

export default mongoose.model('Comment', commentSchema)
