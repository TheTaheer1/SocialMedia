import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useDispatch } from 'react-redux'
import { markAllNotificationsRead, setNotifications as setReduxNotifications } from '../redux/notificationSlice'
import { useAuth } from '../context/useAuth'
import MobileNav from '../components/MobileNav'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()
  const { user } = useAuth()

  useEffect(() => {
    const loadAndMarkRead = async () => {
      try {
        const { data } = await axiosInstance.get('/notifications')
        const items = data.notifications || []
        setNotifications(items)
        dispatch(setReduxNotifications(items))
        if (items.some((item) => !item.isRead)) {
          await axiosInstance.patch('/notifications/read-all')
          const readItems = items.map((item) => ({ ...item, isRead: true }))
          setNotifications(readItems)
          dispatch(setReduxNotifications(readItems))
        }
      } finally {
        setLoading(false)
      }
    }
    loadAndMarkRead()
  }, [dispatch])

  const markAllRead = async () => {
    await axiosInstance.patch('/notifications/read-all')
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })))
    dispatch(markAllNotificationsRead())
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-8 pb-24 text-white sm:px-8 md:pb-8">
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div><Link to="/home" className="text-sm text-slate-400 hover:text-white">← Back home</Link><h1 className="mt-3 text-3xl font-bold">Notifications</h1></div>
        <button type="button" onClick={markAllRead} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Mark all read</button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {loading ? <p className="p-6 text-slate-400">Loading notifications...</p> : notifications.length === 0 ? <p className="p-6 text-slate-400">No notifications yet.</p> : notifications.map((item) => <div key={item._id} className={`border-b border-slate-800 p-4 last:border-0 ${item.isRead ? '' : 'bg-indigo-500/10'}`}><p>{item.message}</p><small className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</small></div>)}
      </section>
    </div>
    <MobileNav username={user?.username} />
  </main>
}

export default Notifications
