import { createSlice } from "@reduxjs/toolkit";

// Load
const loadCart = () => {
  try {
    const data = localStorage.getItem("cart");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save
const saveCart = (cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
};

// Coupons
const coupons = {
  SAVE10: 10,
  SAVE20: 20,
  WELCOME50: 50,
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: loadCart(),
    totalItems: 0,
    totalPrice: 0,
    discount: 0,
    gst: 0,
    deliveryCharges: 0,
    finalPrice: 0,
    appliedCoupon: null,
  },

  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      if (!product || !product.id) return;

      const existing = state.cart.find((item) => item.product.id === product.id);

      if (existing) {
        if (existing.quantity + quantity <= (product.stock || 1)) {
          existing.quantity += quantity;
        }
      } else {
        state.cart.push({
          product: {
            id: product.id,
            name: product.name,
            price: product.price || 0,
            image: product.image || (product.images && product.images[0]?.url) || null,
            stock: product.stock || 0,
          },
          quantity,
        });
      }
      cartSlice.caseReducers.calculateTotals(state);
      saveCart(state.cart);
    },

    increaseQty: (state, action) => {
      const item = state.cart.find((i) => i.product.id === action.payload);
      if (item && item.quantity < item.product.stock) {
        item.quantity += 1;
      }
      cartSlice.caseReducers.calculateTotals(state);
      saveCart(state.cart);
    },

    decreaseQty: (state, action) => {
      const item = state.cart.find((i) => i.product.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
      cartSlice.caseReducers.calculateTotals(state);
      saveCart(state.cart);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cart.find((i) => i.product.id === id);
      if (item && quantity > 0 && quantity <= item.product.stock) {
        item.quantity = quantity;
      }
      cartSlice.caseReducers.calculateTotals(state);
      saveCart(state.cart);
    },

    removeFromCart: (state, action) => {
      state.cart = state.cart.filter((item) => item.product.id !== action.payload);
      cartSlice.caseReducers.calculateTotals(state);
      saveCart(state.cart);
    },

    clearCart: (state) => {
      state.cart = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.finalPrice = 0;
      state.discount = 0;
      state.gst = 0;
      state.deliveryCharges = 0;
      state.appliedCoupon = null;
      saveCart([]);
    },

    calculateTotals: (state) => {
      let totalItems = 0;
      let subtotal = 0;

      state.cart.forEach((item) => {
        totalItems += item.quantity;
        subtotal += item.quantity * item.product.price;
      });

      state.totalItems = totalItems;
      state.totalPrice = Number(subtotal.toFixed(2));
      
      state.gst = Number((state.totalPrice * 0.18).toFixed(2));
      state.deliveryCharges = (state.totalPrice > 999 || state.totalPrice === 0) ? 0 : 99;
      
      const discountAmount = (state.totalPrice * state.discount) / 100;
      state.finalPrice = Number((state.totalPrice + state.gst + state.deliveryCharges - discountAmount).toFixed(2));
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  increaseQty,
  decreaseQty,
  updateQuantity,
  calculateTotals
} = cartSlice.actions;

export default cartSlice.reducer;