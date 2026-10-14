import User from "../models/user.model.js"
import bcrypt from 'bcrypt'
import { genToken } from "../utils/generateToken.js"
import { uploadBufferToCloudinary } from "../utils/uploadCloudinary.js"
import Post from "../models/post.model.js"
import Reel from "../models/reel.model.js"
import { createNotification } from '../utils/notify.js'

const cookiesOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 10 * 24 * 60 * 60 * 1000
}

const normalizeProfileImageUrl = (value) => {
    if (!value) {
        return value
    }

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
        return value
    }

    const normalizedPath = value.startsWith('/') ? value : `/${value}`
    const apiUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 8089}`
    return `${apiUrl.replace(/\/$/, '')}${normalizedPath}`
}

const sanitizeUser = (user) => {
    if (!user) {
        return null
    }

    const userObject = user.toObject ? user.toObject() : { ...user }
    delete userObject.password

    if (userObject.profileImage) {
        userObject.profileImage = normalizeProfileImageUrl(userObject.profileImage)
    }

    return userObject
}

const sanitizeRelationships = async (user) => {
    const result = sanitizeUser(user)
    const [followers, followings] = await Promise.all([
        User.find({ _id: { $in: user.followers || [] } }).select('name username profileImage'),
        User.find({ _id: { $in: user.followings || [] } }).select('name username profileImage')
    ])
    result.followers = followers.map(sanitizeUser)
    result.followings = followings.map(sanitizeUser)
    return result
}

export const resgiterUser = async (req, res) => {
    try {
        const { name, email, password, username } = req.body

        if (!username || !email || !password || !name) {
            return res.status(400).json({ message: "All fields Required" })
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password Length should be greater than 6" })
        }

        const userNameExists = await User.findOne({ username })

        if (userNameExists) {
            return res.status(409).json({ message: "User Already Exists" })
        }

        const emailExists = await User.findOne({ email })

        if (emailExists) {
            return res.status(409).json({ message: "Email Already Exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = await User.create({
            name,
            username,
            email,
            password: hashedPassword
        })

        const token = genToken(newUser._id)
        res.cookie("token", token, cookiesOptions)

        return res.status(201).json({
            message: "User Resgitered",
            userData: sanitizeUser(newUser)
        })
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Errorr', error })
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ message: "User Not Found" })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid Credentials" })
        }

        const token = genToken(user._id)
        res.cookie("token", token, cookiesOptions)

        return res.status(200).json({
            message: "Login Successful",
            userData: sanitizeUser(user)
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error })
    }
}

export const getUser = async (req, res) => {
    return res.status(200).json({
        message: "User Authenticated",
        userData: sanitizeUser(req.user)
    })
}

export const getUserProfile = async (req, res) => {
    try {
        const targetUsername = req.params.username?.trim()

        if (!targetUsername) {
            return res.status(400).json({ message: "Username is required" })
        }

        const user = await User.findOne({ username: targetUsername }).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User Not Found" })
        }

        const [posts, reels] = await Promise.all([
            Post.find({ author: user._id, image: { $exists: true, $nin: ['', null] } }).sort({ createdAt: -1 }),
            Reel.find({ author: user._id, video: { $exists: true, $nin: ['', null] } }).sort({ createdAt: -1 })
        ])
        const currentUser = await User.findById(req.user._id).select('followings')
        const isFollowing = currentUser?.followings?.some(
            (id) => id.toString() === user._id.toString()
        ) ?? false

        return res.status(200).json({
            profileData: { ...(await sanitizeRelationships(user)), posts, reels },
            isFollowing
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error })
    }
}

export const searchUsers = async (req, res) => {
    try {
        const username = req.query.username?.trim()

        if (!username) {
            return res.status(400).json({ message: "Username is required" })
        }

        const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const users = await User.find({
            username: { $regex: escapedUsername, $options: "i" }
        })
            .select("name username profileImage")
            .limit(10)

        return res.status(200).json({ users })
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const name = req.body.name?.trim()
        const username = req.body.username?.trim()
        const email = req.body.email?.trim().toLowerCase()
        const bio = req.body.bio?.trim() || ""

        if (!name || !username || !email) {
            return res.status(400).json({ message: "Name, username and email are required" })
        }

        if (username !== user.username) {
            const usernameExists = await User.findOne({ username, _id: { $ne: user._id } })
            if (usernameExists) {
                return res.status(409).json({ message: "Username already exists" })
            }
        }

        if (email !== user.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: user._id } })
            if (emailExists) {
                return res.status(409).json({ message: "Email already exists" })
            }
        }

        const uploadedFile = req.file || (req.files && (req.files.image?.[0] || req.files.profileImage?.[0]))

        if (req.body.removeProfileImage === 'true') {
            user.profileImage = undefined
        } else if (uploadedFile?.buffer) {
            const uploadedImage = await uploadBufferToCloudinary(uploadedFile.buffer)
            user.profileImage = uploadedImage.secure_url
        }

        user.name = name
        user.username = username
        user.email = email
        user.bio = bio

        await user.save()

        return res.status(200).json({
            message: "Profile updated successfully",
            userData: sanitizeUser(user)
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

export const testUpload = async (req, res) => {
    try {
        const uploadedFile = req.file || (req.files && (req.files.image?.[0] || req.files.profileImage?.[0]))

        if (!uploadedFile) {
            return res.status(400).json({ message: "No image uploaded" })
        }

        const uploadedImage = uploadedFile.buffer
            ? await uploadBufferToCloudinary(uploadedFile.buffer)
            : null

        return res.status(200).json({
            message: "Upload successful",
            file: {
                fieldname: uploadedFile.fieldname,
                originalname: uploadedFile.originalname,
                mimetype: uploadedFile.mimetype,
                size: uploadedFile.size,
                storedInMemory: Boolean(uploadedFile.buffer),
                url: uploadedImage?.secure_url || null
            }
        })
    } catch (error) {
        return res.status(500).json({ message: "Upload failed", error: error.message })
    }
}

const findTargetUserByUsername = async (username) => {
    if (!username || typeof username !== 'string') {
        return null
    }

    const normalizedUsername = username.trim()
    if (!normalizedUsername) {
        return null
    }

    return User.findOne({ username: normalizedUsername })
}

export const followUser = async (req, res) => {
    try {
        const targetUser = await findTargetUserByUsername(req.params.username)

        if (!targetUser) {
            return res.status(404).json({ message: "User Not Found" })
        }

        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself" })
        }

        const currentUser = await User.findById(req.user._id)

        if (currentUser.followings?.some((id) => id.toString() === targetUser._id.toString())) {
            return res.status(409).json({
                message: "You already follow this user",
                profileData: await sanitizeRelationships(targetUser),
                isFollowing: true
            })
        }

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { followings: targetUser._id }
        })
        await User.findByIdAndUpdate(targetUser._id, {
            $addToSet: { followers: req.user._id }
        })

        const updatedTarget = await User.findById(targetUser._id).select("-password")
        await createNotification({ recipient: targetUser._id, sender: req.user._id, type: 'follow', message: `${req.user.name || req.user.username} started following you`, actor: { name: req.user.name, username: req.user.username, profileImage: req.user.profileImage } })

        return res.status(200).json({
            profileData: await sanitizeRelationships(updatedTarget),
            isFollowing: true
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error })
    }
}

export const unFollowUser = async (req, res) => {
    try {
        const targetUser = await findTargetUserByUsername(req.params.username)

        if (!targetUser) {
            return res.status(404).json({ message: "User Not Found" })
        }

        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot unfollow yourself" })
        }

        const currentUser = await User.findById(req.user._id)

        if (!currentUser.followings?.some((id) => id.toString() === targetUser._id.toString())) {
            return res.status(409).json({
                message: "You are not following this user",
                profileData: await sanitizeRelationships(targetUser),
                isFollowing: false
            })
        }

        await User.findByIdAndUpdate(req.user._id, {
            $pull: { followings: targetUser._id }
        })
        await User.findByIdAndUpdate(targetUser._id, {
            $pull: { followers: req.user._id }
        })

        const updatedTarget = await User.findById(targetUser._id).select("-password")

        return res.status(200).json({
            profileData: await sanitizeRelationships(updatedTarget),
            isFollowing: false
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error })
    }
}

export const toggleFollow = async (req, res) => {
    try {
        const targetUser = await findTargetUserByUsername(req.params.username)

        if (!targetUser) {
            return res.status(404).json({ message: "User Not Found" })
        }

        const currentUser = await User.findById(req.user._id)
        const isFollowing = currentUser?.followings?.some(
            (id) => id.toString() === targetUser._id.toString()
        ) ?? false

        if (isFollowing) {
            return unFollowUser(req, res)
        }

        return followUser(req, res)
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error })
    }
}

export const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token", cookiesOptions)

        return res.status(200).json({
            message: "Logout Successful"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}
