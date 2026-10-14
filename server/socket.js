import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from './models/user.model.js'

let io

const getCookie = (header, name) => header?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1)

export const initializeSocket = (httpServer) => {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error('Origin is not allowed by CORS'))
      },
      credentials: true
    }
  })

  io.use(async (socket, next) => {
    try {
      const token = getCookie(socket.handshake.headers.cookie, 'token')
      if (!token) return next(new Error('Authentication required'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).select('_id name username profileImage')
      if (!user) return next(new Error('User not found'))
      socket.user = user
      return next()
    } catch {
      return next(new Error('Invalid or expired authentication token'))
    }
  })

  io.on('connection', (socket) => {
    const room = `user:${socket.user._id}`
    socket.join(room)
    socket.emit('socket:ready', { user: socket.user })

    socket.on('client-message', (data = {}) => {
      socket.emit('server-reply', { message: data.message || 'Message received.' })
    })

    socket.on('join-content', ({ type, id } = {}) => {
      if (['post', 'reel'].includes(type) && id) socket.join(`${type}:${id}`)
    })

    socket.on('leave-content', ({ type, id } = {}) => {
      if (['post', 'reel'].includes(type) && id) socket.leave(`${type}:${id}`)
    })
  })

  return io
}

export const getIO = () => io

export const emitToUser = (userId, event, payload) => {
  if (io && userId) io.to(`user:${userId}`).emit(event, payload)
}

export const emitToContent = (type, id, event, payload) => {
  if (io && type && id) io.to(`${type}:${id}`).emit(event, payload)
}

export const emitToFeed = (event, payload) => {
  if (io) io.emit(event, payload)
}
