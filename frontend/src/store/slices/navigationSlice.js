import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeMenuId: null,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setActiveMenu: (state, action) => {
      state.activeMenuId = action.payload;
    },
    clearActiveMenu: (state) => {
      state.activeMenuId = null;
    },
  },
});

export const { setActiveMenu, clearActiveMenu } = navigationSlice.actions;
export default navigationSlice.reducer;