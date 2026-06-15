import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const initialState = {
  wishlistItems: localStorage.getItem("wishlist")
    ? JSON.parse(localStorage.getItem("wishlist"))
    : [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    toggleWishlist: (state, action) => {
      const product = action.payload;
      
      // ✅ Dono check karo: _id (MongoDB) ya id (Standard)
      const productId = product._id || product.id;

      if (!productId) {
        console.error("Error: Product ID is undefined. Check your data!", product);
        return;
      }

      // 🔍 Sahi unique ID se search karo
      const isExist = state.wishlistItems.find(
        (item) => (item._id || item.id) === productId
      );

      if (isExist) {
        // ❌ Sirf usi specific ID ko remove karo
        state.wishlistItems = state.wishlistItems.filter(
          (item) => (item._id || item.id) !== productId
        );
        toast.info(`${product.name} removed from wishlist`);
      } else {
        // ✅ Add unique product
        state.wishlistItems.push(product);
        toast.success(`${product.name} added to wishlist`);
      }

      localStorage.setItem("wishlist", JSON.stringify(state.wishlistItems));
    },
    
    clearWishlist: (state) => {
      state.wishlistItems = [];
      localStorage.removeItem("wishlist");
    },
  },
});

export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;