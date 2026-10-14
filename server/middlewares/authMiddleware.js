import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies?.token

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized, token missing' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId).select('-password')

        if (!user) {
            return res.status(404).json({ message: 'User Not Found, Token Invalid' })
        }

        req.user = user
        return next()
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired authentication token'
        })
    }
}