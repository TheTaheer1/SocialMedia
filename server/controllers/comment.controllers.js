import Comment from '../models/comment.model.js'
import Post from '../models/post.model.js'
import Reel from '../models/reel.model.js'
import { createNotification } from '../utils/notify.js'

export const createComment = async (req, res) => {
    try {
        const text = req.body.text?.trim()
        const { postId, reelId } = req.body
        if (!text) return res.status(400).json({ message: 'Comment text is required' })
        if ((!postId && !reelId) || (postId && reelId)) return res.status(400).json({ message: 'Provide either postId or reelId' })
        const target = postId ? await Post.findById(postId) : await Reel.findById(reelId)
        if (!target) return res.status(404).json({ message: 'Content not found' })
        const comment = await Comment.create({ author: req.user._id, text, ...(postId ? { post: postId } : { reel: reelId }) })
        const populated = await Comment.findById(comment._id).populate('author', 'name username profileImage')
        const owner = target.author?.toString()
        if (owner && owner !== req.user._id.toString()) {
            await createNotification({ recipient: owner, sender: req.user._id, type: 'comment', message: `${req.user.name || req.user.username} commented on your ${postId ? 'post' : 'reel'}`, post: postId, reel: reelId, comment: populated._id, actor: { name: req.user.name, username: req.user.username, profileImage: req.user.profileImage } })
        }
        return res.status(201).json({ message: 'Comment created', comment: populated })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to create comment', error: error.message })
    }
}

export const getComments = async (req, res) => {
    const filter = req.query.postId ? { post: req.query.postId } : { reel: req.query.reelId }
    const comments = await Comment.find(filter).sort({ createdAt: -1 }).populate('author', 'name username profileImage')
    return res.status(200).json({ comments })
}

export const updateComment = async (req, res) => {
    try {
        const text = req.body.text?.trim()
        if (!text) return res.status(400).json({ message: 'Comment text cannot be empty' })
        if (text.length > 500) return res.status(400).json({ message: 'Comment cannot exceed 500 characters' })

        const comment = await Comment.findById(req.params.id)
        if (!comment) return res.status(404).json({ message: 'Comment not found' })

        const authorId = comment.author?._id ? comment.author._id.toString() : comment.author?.toString()
        const currentUserId = req.user?._id ? req.user._id.toString() : req.user?.toString()

        if (authorId !== currentUserId) {
            return res.status(403).json({ message: 'You are not authorized to edit this comment' })
        }

        comment.text = text
        await comment.save()

        const populated = await Comment.findById(comment._id).populate('author', 'name username profileImage')
        return res.status(200).json({ message: 'Comment updated successfully', comment: populated })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to update comment', error: error.message })
    }
}

export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id)
        if (!comment) return res.status(404).json({ message: 'Comment not found' })

        const authorId = comment.author?._id ? comment.author._id.toString() : comment.author?.toString()
        const currentUserId = req.user?._id ? req.user._id.toString() : req.user?.toString()

        let isAuthorized = authorId === currentUserId

        if (!isAuthorized && comment.post) {
            const post = await Post.findById(comment.post)
            if (post && (post.author?._id ? post.author._id.toString() : post.author?.toString()) === currentUserId) {
                isAuthorized = true
            }
        }

        if (!isAuthorized && comment.reel) {
            const reel = await Reel.findById(comment.reel)
            if (reel && (reel.author?._id ? reel.author._id.toString() : reel.author?.toString()) === currentUserId) {
                isAuthorized = true
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment' })
        }

        await Comment.findByIdAndDelete(req.params.id)
        return res.status(200).json({ message: 'Comment deleted successfully' })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to delete comment', error: error.message })
    }
}
