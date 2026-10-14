import { createSlice } from '@reduxjs/toolkit'
const profileSlice = createSlice({ name: 'profile', initialState: { current: null }, reducers: { setProfileRedux: (state, action) => { state.current = action.payload || null } } })
export const { setProfileRedux } = profileSlice.actions
export default profileSlice.reducer
