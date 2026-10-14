import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import userRoutes from './routes/user.routes.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import postRoutes from './routes/post.routes.js'
import reelRoutes from './routes/reel.routes.js'
import commentRoutes from './routes/comment.routes.js'
import storyRoutes from './routes/story.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import http from 'http'
import { initializeSocket } from './socket.js'

const app = express()
const server = http.createServer(app)

const PORT = process.env.PORT || 8089

dotenv.config()


mongoose.connect(process.env.dbUrl).then(() => {
    console.log("DB Connected")
}).catch((err) => {
    console.log(err)
})

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error('Origin is not allowed by CORS'))
    },
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
app.use('/users' , userRoutes)
app.use('/posts', postRoutes)
app.use('/reels', reelRoutes)
app.use('/comments', commentRoutes)
app.use('/stories', storyRoutes)
app.use('/notifications', notificationRoutes)

initializeSocket(server)

app.use((error, _req, res, _next) => {
    if (error && error.name === 'MulterError') {
        return res.status(400).json({
            message: error.code === 'LIMIT_UNEXPECTED_FILE' ? 'Unexpected file field. Use image or profileImage.' : error.message
        })
    }

    if (error) {
        return res.status(400).json({ message: error.message || 'Upload failed' })
    }

    return res.status(500).json({ message: 'Internal Server Error' })
})

server.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`)
})
