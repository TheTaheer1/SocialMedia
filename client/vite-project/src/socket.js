import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8089', {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling']
})

export default socket
