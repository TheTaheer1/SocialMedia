import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['follow', 'like', 'comment'], required: true },
  message: { type: String, required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  reel: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)
