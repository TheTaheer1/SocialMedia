import { configureStore } from '@reduxjs/toolkit'
import postReducer from './postSlice'
import storyReducer from './storySlice'
import authReducer from './authSlice'
import reelReducer from './reelSlice'
import profileReducer from './profileSlice'
import commentReducer from './commentSlice'
import notificationReducer from './notificationSlice'

export const store = configureStore({
  reducer: { auth: authReducer, post: postReducer, reel: reelReducer, story: storyReducer, profile: profileReducer, comment: commentReducer, notification: notificationReducer }
})
