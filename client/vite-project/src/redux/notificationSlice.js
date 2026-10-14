import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notification',
  initialState: { items: [], unreadCount: 0 },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload
      state.unreadCount = action.payload.filter((item) => !item.isRead).length
    },
    addNotification: (state, action) => {
      state.items.unshift(action.payload)
      state.unreadCount += 1
    },
    markAllNotificationsRead: (state) => {
      state.items.forEach((item) => { item.isRead = true })
      state.unreadCount = 0
    }
  }
})

export const { setNotifications, addNotification, markAllNotificationsRead } = notificationSlice.actions
export default notificationSlice.reducer
