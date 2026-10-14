import { createSlice } from '@reduxjs/toolkit'
const reelSlice = createSlice({ name: 'reel', initialState: { items: [] }, reducers: { setReelsRedux: (state, action) => { state.items = action.payload || [] } } })
export const { setReelsRedux } = reelSlice.actions
export default reelSlice.reducer
