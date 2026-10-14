import { createSlice } from '@reduxjs/toolkit'
const commentSlice = createSlice({ name: 'comment', initialState: { byContent: {} }, reducers: { setCommentsRedux: (state, action) => { state.byContent[action.payload.key] = action.payload.comments || [] } } })
export const { setCommentsRedux } = commentSlice.actions
export default commentSlice.reducer
