import { createSlice } from "@reduxjs/toolkit";

const extraSlice = createSlice({
  name: "extra",
  initialState: {
    openedComponent: sessionStorage.getItem("admin_active_tab") || "Dashboard",
    isNavbarOpened: false,
    isViewProductModalOpened: false,
    isCreateProductModalOpened: false,
    isUpdateProductModalOpened: false,
  },
  reducers: {
    toggleComponent: (state, actions) => {
      state.openedComponent = actions.payload;
      sessionStorage.setItem("admin_active_tab", actions.payload);
    },
    toggleNavbar: (state) => {
      state.isNavbarOpened = !state.isNavbarOpened;
    },
    toggleCreateProductModal: (state) => {
      state.isCreateProductModalOpened = !state.isCreateProductModalOpened;
    },
    toggleViewProductModal: (state) => {
      state.isViewProductModalOpened = !state.isViewProductModalOpened;
    },
    toggleUpdateProductModal: (state) => {
      state.isUpdateProductModalOpened = !state.isUpdateProductModalOpened;
    },
  },
});

export const {
  toggleComponent,
  toggleNavbar,
  toggleCreateProductModal, // YAHAN SPELLING CHECK KAREIN
  toggleUpdateProductModal,
  toggleViewProductModal,
} = extraSlice.actions;

export default extraSlice.reducer;