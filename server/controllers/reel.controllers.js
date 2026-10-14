import Reel from '../models/reel.model.js'
import { uploadVideoBufferToCloudinary } from '../utils/uploadVideoToCloudinary.js'
import User from '../models/user.model.js'
import { createNotification } from '../utils/notify.js'
import { emitToContent } from '../socket.js'

const MAX_REEL_DURATION_SECONDS = 90

export const createReel = async (req, res) => {
    try {
        if (!req.file?.buffer) return res.status(400).json({ message: 'A video file is required' })
        const caption = req.body.caption?.trim() || ''
        if (!caption) return res.status(400).json({ message: 'A video and caption are required' })
        if (caption.length > 500) return res.status(400).json({ message: 'Caption cannot exceed 500 characters' })
        const upload = await uploadVideoBufferToCloudinary(req.file.buffer)
        if (upload.duration && upload.duration > MAX_REEL_DURATION_SECONDS) {
            return res.status(400).json({ message: 'Reels must be 90 seconds or shorter' })
        }
        const reel = await Reel.create({ author: req.user._id, caption, video: upload.secure_url })
        await User.findByIdAndUpdate(req.user._id, { $push: { reels: reel._id } })
        const populatedReel = await Reel.findById(reel._id).populate('author', 'name username profileImage')
        return res.status(201).json({ message: 'Reel created successfully', reel: populatedReel })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to create reel', error: error.message })
    }
}

export const getReels = async (_req, res) => {
    try {
        const reels = await Reel.find().sort({ createdAt: -1 }).populate('author', 'name username profileImage')
        return res.status(200).json({ reels })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to load reels', error: error.message })
    }
}

export const getReelsByUsername = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('_id')
        if (!user) return res.status(404).json({ message: 'User not found' })
        const reels = await Reel.find({ author: user._id })
            .sort({ createdAt: -1 })
            .populate('author', 'name username profileImage')
        return res.status(200).json({ reels })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to load user reels', error: error.message })
    }
}

export const updateLikes = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id)
        if (!reel) return res.status(404).json({ message: 'Reel not found' })
        const userId = req.user._id.toString()
        const liked = reel.likes.some((id) => id.toString() === userId)
        if (liked) reel.likes.pull(req.user._id)
        else reel.likes.push(req.user._id)
        await reel.save()
        if (!liked && reel.author.toString() !== userId) {
            await createNotification({
                recipient: reel.author,
                sender: req.user._id,
                type: 'like',
                message: `${req.user.name || req.user.username} liked your reel`,
                reel: reel._id,
                actor: { name: req.user.name, username: req.user.username, profileImage: req.user.profileImage }
            })
        }
        emitToContent('reel', reel._id.toString(), 'content:like', {
            type: 'reel',
            id: reel._id.toString(),
            liked: !liked,
            likesCount: reel.likes.length,
            userId
        })
        return res.status(200).json({ liked: !liked, likesCount: reel.likes.length })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to update like', error: error.message })
    }
}

export const updateReel = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id)
        if (!reel) return res.status(404).json({ message: 'Reel not found' })

        if (reel.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to edit this reel' })
        }

        const caption = req.body.caption !== undefined ? req.body.caption.trim() : reel.caption
        if (caption.length > 500) {
            return res.status(400).json({ message: 'Caption cannot exceed 500 characters' })
        }
        reel.caption = caption

        if (req.file?.buffer) {
            const upload = await uploadVideoBufferToCloudinary(req.file.buffer)
            if (upload.duration && upload.duration > MAX_REEL_DURATION_SECONDS) {
                return res.status(400).json({ message: 'Reels must be 90 seconds or shorter' })
            }
            reel.video = upload.secure_url
        }

        await reel.save()
        const populatedReel = await Reel.findById(reel._id).populate('author', 'name username profileImage')
        return res.status(200).json({ message: 'Reel updated successfully', reel: populatedReel })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to update reel', error: error.message })
    }
}

export const deleteReel = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id)
        if (!reel) return res.status(404).json({ message: 'Reel not found' })

        if (reel.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this reel' })
        }

        await Reel.findByIdAndDelete(req.params.id)
        await User.findByIdAndUpdate(req.user._id, { $pull: { reels: req.params.id } })

        return res.status(200).json({ message: 'Reel deleted successfully' })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to delete reel', error: error.message })
    }
}
