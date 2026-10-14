import express from 'express'
import { createReel, getReels, getReelsByUsername, updateLikes, updateReel, deleteReel } from '../controllers/reel.controllers.js'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import uploadReel from '../middlewares/uploadReel.middleware.js'

const reelRoutes = express.Router()
reelRoutes.post('/createReel', isAuthenticated, uploadReel.single('video'), createReel)
reelRoutes.get('/getAllReels', isAuthenticated, getReels)
reelRoutes.get('/user/:username', isAuthenticated, getReelsByUsername)
reelRoutes.get('/', isAuthenticated, getReels)
reelRoutes.post('/', isAuthenticated, uploadReel.single('video'), createReel)
reelRoutes.post('/like/:id', isAuthenticated, updateLikes)
reelRoutes.put('/update/:id', isAuthenticated, uploadReel.single('video'), updateReel)
reelRoutes.put('/:id', isAuthenticated, uploadReel.single('video'), updateReel)
reelRoutes.delete('/:id', isAuthenticated, deleteReel)
export default reelRoutes
