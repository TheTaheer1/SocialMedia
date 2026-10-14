import express from 'express'
import { createPost, getPosts, updateLikes, updatePost, deletePost } from '../controllers/post.controllers.js'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import upload from '../middlewares/upload.middleware.js'

const postRoutes = express.Router()
postRoutes.post('/createPost', isAuthenticated, upload.single('image'), createPost)
postRoutes.get('/getAllPosts', isAuthenticated, getPosts)
postRoutes.get('/', isAuthenticated, getPosts)
postRoutes.post('/', isAuthenticated, upload.single('image'), createPost)
postRoutes.put('/update/:id', isAuthenticated, upload.single('image'), updatePost)
postRoutes.put('/:id', isAuthenticated, upload.single('image'), updatePost)
postRoutes.delete('/:id', isAuthenticated, deletePost)
postRoutes.post('/like/:id', isAuthenticated, updateLikes)
export default postRoutes

