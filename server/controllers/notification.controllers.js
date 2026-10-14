import Notification from '../models/notification.model.js'

export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .populate('sender', 'name username profileImage')
    .populate('post', 'caption image')
    .populate('reel', 'caption video')
    .populate('comment', 'text')
  return res.status(200).json({ notifications, unreadCount: notifications.filter((item) => !item.isRead).length })
}

export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  )
  if (!notification) return res.status(404).json({ message: 'Notification not found' })
  return res.status(200).json({ notification })
}

export const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true })
  return res.status(200).json({ message: 'Notifications marked as read' })
}
