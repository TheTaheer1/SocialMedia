import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from 'react'
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Notifications from './pages/Notifications'
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { useAuth } from './context/useAuth'
import socket from './socket'
import { axiosInstance } from './axiosCalls/axios'
import { useDispatch, useSelector } from 'react-redux'
import { addNotification, setNotifications } from './redux/notificationSlice'

function SocketNotifications() {
  const { user } = useAuth()
  const [notice, setNotice] = useState(null)
  const dispatch = useDispatch()
  const unreadCount = useSelector((state) => state.notification.unreadCount)

  useEffect(() => {
    if (!user) {
      socket.disconnect()
      return undefined
    }
    axiosInstance.get('/notifications').then(({ data }) => dispatch(setNotifications(data.notifications || []))).catch(() => undefined)
    const handleNotification = (notification) => {
      dispatch(addNotification(notification))
      setNotice(notification)
      window.setTimeout(() => setNotice(null), 5000)
    }
    socket.connect()
    socket.on('notification:new', handleNotification)
    socket.on('connect_error', (error) => console.warn('Socket connection failed:', error.message))
    return () => {
      socket.off('notification:new', handleNotification)
      socket.disconnect()
    }
  }, [user, dispatch])

  if (!notice) return null
  return <div role="status" className="fixed right-4 top-24 z-[70] max-w-sm rounded-xl border border-indigo-400/40 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl"><span className="mr-2">🔔</span>{notice.message} <span className="ml-2 rounded-full bg-indigo-500 px-2 py-0.5 text-xs">{unreadCount} new</span></div>
}

function App() {

  return (
    <>
      <BrowserRouter>
      <AuthProvider>
        <SocketNotifications />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
        </Routes>
      </AuthProvider>
      </BrowserRouter>
    </>
  )
}

export default App
