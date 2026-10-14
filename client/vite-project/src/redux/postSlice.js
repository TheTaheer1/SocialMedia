import { createSlice } from '@reduxjs/toolkit'

const postSlice = createSlice({
  name: 'post',
  initialState: { items: [] },
  reducers: {
    setPostsRedux: (state, action) => {
      state.items = action.payload || []
    }
  }
})

export const { setPostsRedux } = postSlice.actions
export default postSlice.reducer
