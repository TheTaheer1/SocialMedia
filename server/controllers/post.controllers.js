import Post from '../models/post.model.js'
import User from '../models/user.model.js'
import { uploadBufferToCloudinary } from '../utils/uploadCloudinary.js'
import { createNotification } from '../utils/notify.js'
import { emitToContent, emitToFeed } from '../socket.js'

export const createPost = async (req, res) => {
    try {
        const caption = req.body.caption?.trim() || ''
        if (caption.length > 500) return res.status(400).json({ message: 'Caption cannot exceed 500 characters' })
        if (!caption || !req.file) return res.status(400).json({ message: 'An image and caption are required' })

        const image = req.file?.buffer
            ? (await uploadBufferToCloudinary(req.file.buffer, { folder: 'social-media/posts' })).secure_url
            : ''
        const post = await Post.create({ author: req.user._id, caption, image })
        await User.findByIdAndUpdate(req.user._id, { $push: { posts: post._id } })
        const populatedPost = await Post.findById(post._id).populate('author', 'name username profileImage')
        emitToFeed('content:new', { type: 'post', item: populatedPost })
        return res.status(201).json({ message: 'Post created successfully', post: populatedPost })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to create post', error: error.message })
    }
}

export const getPosts = async (_req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'name username profileImage')
        return res.status(200).json({ posts })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to load posts', error: error.message })
    }
}

export const updateLikes = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) return res.status(404).json({ message: 'Post not found' })
        const userId = req.user._id.toString()
        const liked = post.likes.some((id) => id.toString() === userId)
        if (liked) post.likes.pull(req.user._id)
        else post.likes.push(req.user._id)
        await post.save()
        if (!liked && post.author.toString() !== userId) {
            await createNotification({ recipient: post.author, sender: req.user._id, type: 'like', message: `${req.user.name || req.user.username} liked your post`, post: post._id, actor: { name: req.user.name, username: req.user.username, profileImage: req.user.profileImage } })
        }
        emitToContent('post', post._id.toString(), 'content:like', {
            type: 'post',
            id: post._id.toString(),
            liked: !liked,
            likesCount: post.likes.length,
            userId
        })
        return res.status(200).json({ liked: !liked, likesCount: post.likes.length })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to update like', error: error.message })
    }
}

export const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) return res.status(404).json({ message: 'Post not found' })

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to edit this post' })
        }

        const caption = req.body.caption !== undefined ? req.body.caption.trim() : post.caption
        if (caption.length > 500) {
            return res.status(400).json({ message: 'Caption cannot exceed 500 characters' })
        }
        post.caption = caption

        if (req.file?.buffer) {
            const uploadResult = await uploadBufferToCloudinary(req.file.buffer, { folder: 'social-media/posts' })
            post.image = uploadResult.secure_url
        }

        await post.save()
        const populatedPost = await Post.findById(post._id).populate('author', 'name username profileImage')
        return res.status(200).json({ message: 'Post updated successfully', post: populatedPost })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to update post', error: error.message })
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) return res.status(404).json({ message: 'Post not found' })

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this post' })
        }

        await Post.findByIdAndDelete(req.params.id)
        await User.findByIdAndUpdate(req.user._id, { $pull: { posts: req.params.id } })

        return res.status(200).json({ message: 'Post deleted successfully' })
    } catch (error) {
        return res.status(500).json({ message: 'Unable to delete post', error: error.message })
    }
}
