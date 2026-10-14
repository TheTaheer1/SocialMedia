import { createSlice } from '@reduxjs/toolkit'

const storySlice = createSlice({
  name: 'story',
  initialState: { items: [] },
  reducers: {
    setStoriesRedux: (state, action) => { state.items = action.payload || [] }
  }
})

export const { setStoriesRedux } = storySlice.actions
export default storySlice.reducer
