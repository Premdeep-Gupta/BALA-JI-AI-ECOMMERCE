import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import popupReducer from "./slices/popupSlice";
import cartReducer from "./slices/cartSlice";
import productReducer from "./slices/productSlice";
import orderReducer from "./slices/orderSlice";
import wishlistReducer from "./slices/wishlistSlice"; // ✅ Wishlist import kiya

export const store = configureStore({
  reducer: {
    auth: authReducer,
    popup: popupReducer,
    cart: cartReducer,
    product: productReducer,
    order: orderReducer,
    wishlist: wishlistReducer, // ✅ Wishlist register kar diya
  },
  // Middleware handling (Optional: agar non-serializable error aaye toh ise use karein)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;