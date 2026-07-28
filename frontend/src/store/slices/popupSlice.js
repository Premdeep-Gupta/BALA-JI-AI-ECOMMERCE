import { createSlice } from "@reduxjs/toolkit";

const popupSlice = createSlice({
  name: "popup",
  initialState: {
    isAuthPopupOpen: false,
    isSidebarOpen: false,
    isSearchBarOpen: false,
    isCartOpen: false,
    isAIPopupOpen: false,
    isProfilePanelOpen: false,
    isWishlistOpen: false,
  },
  reducers: {
    toggleAuthPopup: (state) => {
      state.isAuthPopupOpen = !state.isAuthPopupOpen;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    toggleSearchBar: (state) => {
      state.isSearchBarOpen = !state.isSearchBarOpen;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    toggleAIModal: (state) => {
      state.isAIPopupOpen = !state.isAIPopupOpen;
    },
    toggleProfilePanel: (state) => {
      state.isProfilePanelOpen = !state.isProfilePanelOpen;
    },
    toggleWishlist: (state) => {
      state.isWishlistOpen = !state.isWishlistOpen;
    },
  },
});

export const {
  toggleAuthPopup,
  toggleSidebar,
  toggleSearchBar,
  toggleCart,
  toggleAIModal,
  toggleProfilePanel,
  toggleWishlist,
} = popupSlice.actions;

export default popupSlice.reducer;