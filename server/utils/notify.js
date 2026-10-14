import Notification from '../models/notification.model.js'
import { emitToUser } from '../socket.js'

export const createNotification = async ({ recipient, sender, type, message, post, reel, comment, actor }) => {
  const notification = await Notification.create({ recipient, sender, type, message, post, reel, comment })
  const populated = await Notification.findById(notification._id)
    .populate('sender', 'name username profileImage')
    .populate('post', 'caption image')
    .populate('reel', 'caption video')
    .populate('comment', 'text')
  emitToUser(recipient, 'notification:new', { ...populated.toObject(), actor })
  return populated
}
