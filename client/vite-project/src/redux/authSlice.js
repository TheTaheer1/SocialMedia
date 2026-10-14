import { createSlice } from '@reduxjs/toolkit'
const authSlice = createSlice({ name: 'auth', initialState: { user: null }, reducers: { setAuthUser: (state, action) => { state.user = action.payload || null } } })
export const { setAuthUser } = authSlice.actions
export default authSlice.reducer
