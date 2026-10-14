import express from 'express'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import uploadStory from '../middlewares/uploadStory.middleware.js'
import { createStory, getStories, updateStory, deleteStory } from '../controllers/story.controllers.js'

const storyRoutes = express.Router()
storyRoutes.post('/createStory', isAuthenticated, uploadStory.single('media'), createStory)
storyRoutes.get('/getStories', isAuthenticated, getStories)
storyRoutes.put('/:id', isAuthenticated, uploadStory.single('media'), updateStory)
storyRoutes.delete('/:id', isAuthenticated, deleteStory)
export default storyRoutes
