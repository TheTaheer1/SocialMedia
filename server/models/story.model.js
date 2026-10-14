import mongoose from 'mongoose'

const storySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caption: { type: String, trim: true, maxlength: 500, default: '' },
  image: { type: String },
  video: { type: String },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true })

export default mongoose.model('Story', storySchema)
