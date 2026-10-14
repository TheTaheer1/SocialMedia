import express from 'express'
import {
    resgiterUser,
    loginUser,
    logoutUser,
    getUser,
    getUserProfile,
    searchUsers,
    updateProfile,
    toggleFollow,
    followUser,
    unFollowUser,
    testUpload
} from '../controllers/user.controllers.js'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import upload, { uploadImage } from '../middlewares/upload.middleware.js'

const userRoutes = express.Router()

userRoutes.post('/register', resgiterUser)
userRoutes.post('/login', loginUser)
userRoutes.get('/me', isAuthenticated, getUser)
userRoutes.get('/search', isAuthenticated, searchUsers)
userRoutes.get('/profile/:username', isAuthenticated, getUserProfile)
userRoutes.put('/profile', isAuthenticated, uploadImage, updateProfile)
userRoutes.post('/updateProfile', isAuthenticated, uploadImage, updateProfile)
userRoutes.post('/profile/:username/follow', isAuthenticated, toggleFollow)
userRoutes.delete('/profile/:username/follow', isAuthenticated, unFollowUser)
userRoutes.post('/follow/:username', isAuthenticated, followUser)
userRoutes.delete('/follow/:username', isAuthenticated, unFollowUser)
userRoutes.post('/testUpload', isAuthenticated, uploadImage, testUpload)
userRoutes.post('/logout', isAuthenticated, logoutUser)

export default userRoutes
