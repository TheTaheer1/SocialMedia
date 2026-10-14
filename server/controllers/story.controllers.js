import Story from '../models/story.model.js'
import User from '../models/user.model.js'
import { uploadBufferToCloudinary } from '../utils/uploadCloudinary.js'
import { uploadVideoBufferToCloudinary } from '../utils/uploadVideoToCloudinary.js'
import { emitToFeed } from '../socket.js'

const STORY_LIFETIME = 24 * 60 * 60 * 1000
const MAX_STORY_VIDEO_SECONDS = 30

export const createStory = async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ message: 'An image or video is required' })
    const caption = req.body.caption?.trim() || ''
    if (caption.length > 500) return res.status(400).json({ message: 'Caption cannot exceed 500 characters' })
    const isVideo = req.file.mimetype?.startsWith('video/')
    const upload = isVideo
      ? await uploadVideoBufferToCloudinary(req.file.buffer, { folder: 'social-media/stories' })
      : await uploadBufferToCloudinary(req.file.buffer, { folder: 'social-media/stories' })
    if (isVideo && upload.duration && upload.duration > MAX_STORY_VIDEO_SECONDS) {
      return res.status(400).json({ message: 'Story videos must be 30 seconds or shorter' })
    }
    const story = await Story.create({ author: req.user._id, caption, mediaType: isVideo ? 'video' : 'image', ...(isVideo ? { video: upload.secure_url } : { image: upload.secure_url }), expiresAt: new Date(Date.now() + STORY_LIFETIME) })
    await User.findByIdAndUpdate(req.user._id, { $push: { stories: story._id } })
    const populated = await Story.findById(story._id).populate('author', 'name username profileImage')
    emitToFeed('story:new', { story: populated })
    return res.status(201).json({ message: 'Story created successfully', story: populated })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create story', error: error.message })
  }
}

export const getStories = async (req, res) => {
  try {
    const allowedUsers = [req.user._id, ...(req.user.followings || [])]
    // Keep each user's stories in upload order: the oldest story plays first,
    // followed by newer stories, just like Instagram's sequence.
    const stories = await Story.find({ author: { $in: allowedUsers }, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: 1 }).populate('author', 'name username profileImage')
    return res.status(200).json({ stories })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load stories', error: error.message })
  }
}

export const updateStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
    if (!story) return res.status(404).json({ message: 'Story not found' })
    if (story.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'You are not authorized to edit this story' })
    if (story.expiresAt <= new Date()) return res.status(410).json({ message: 'This story has expired' })
    if (req.body.caption !== undefined) {
      const caption = req.body.caption.trim()
      if (caption.length > 500) return res.status(400).json({ message: 'Caption cannot exceed 500 characters' })
      story.caption = caption
    }
    if (req.file?.buffer) {
      const isVideo = req.file.mimetype?.startsWith('video/')
      const upload = isVideo
        ? await uploadVideoBufferToCloudinary(req.file.buffer, { folder: 'social-media/stories' })
        : await uploadBufferToCloudinary(req.file.buffer, { folder: 'social-media/stories' })
      if (isVideo && upload.duration && upload.duration > MAX_STORY_VIDEO_SECONDS) {
        return res.status(400).json({ message: 'Story videos must be 30 seconds or shorter' })
      }
      story.mediaType = isVideo ? 'video' : 'image'
      story.image = isVideo ? undefined : upload.secure_url
      story.video = isVideo ? upload.secure_url : undefined
    }
    await story.save()
    const populated = await Story.findById(story._id).populate('author', 'name username profileImage')
    return res.status(200).json({ message: 'Story updated successfully', story: populated })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update story', error: error.message })
  }
}

export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
    if (!story) return res.status(404).json({ message: 'Story not found' })
    if (story.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'You are not authorized to delete this story' })
    await Story.findByIdAndDelete(story._id)
    await User.findByIdAndUpdate(req.user._id, { $pull: { stories: story._id } })
    return res.status(200).json({ message: 'Story deleted successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete story', error: error.message })
  }
}
