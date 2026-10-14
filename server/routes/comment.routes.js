import express from 'express'
import { createComment, getComments, updateComment, deleteComment } from '../controllers/comment.controllers.js'
import { isAuthenticated } from '../middlewares/authMiddleware.js'

const commentRoutes = express.Router()
commentRoutes.get('/', isAuthenticated, getComments)
commentRoutes.post('/', isAuthenticated, createComment)
commentRoutes.put('/update/:id', isAuthenticated, updateComment)
commentRoutes.put('/:id', isAuthenticated, updateComment)
commentRoutes.delete('/delete/:id', isAuthenticated, deleteComment)
commentRoutes.delete('/:id', isAuthenticated, deleteComment)
export default commentRoutes

