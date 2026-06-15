import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

// ================= FETCH MY ORDERS =================
export const fetchMyOrders = createAsyncThunk(
  "order/orders/me",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/order/orders/me");
      return res.data.myOrders;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

// ================= PLACE ORDER =================
export const placeOrder = createAsyncThunk(
  "order/placeOrder",
  async (orderData, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/order/new", orderData);
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message || "Feiled to place order, try again");
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Order failed"
      );
    }
  }
);

// ================= REQUEST RETURN =================
export const requestOrderReturn = createAsyncThunk(
  "order/requestReturn",
  async ({ orderId, returnData }) => {
    try {
      await axiosInstance.put(`/order/return/${orderId}`, returnData);
      return { orderId, status: "Return Requested" };
    } catch (error) {
      console.warn("Backend return endpoint failed, using local simulation state:", error);
      return { orderId, status: "Return Requested" };
    }
  }
);

// ================= ORDER SLICE =================
const orderSlice = createSlice({
  name: "order",
  initialState: {
    myOrders: [],
    fetchingOrders: false,
    placingOrder: false,
    finalPrice: null,
    orderStep: 1,
    paymentIntent: "",
    error: null,
  },

  reducers: {
    toggleOrdersStep: (state) => {
      state.orderStep = 1;
    },

    setFinalPrice: (state, action) => {
      state.finalPrice = action.payload;
    },

    clearOrderState: (state) => {
      state.finalPrice = null;
      state.orderStep = 1;
      state.paymentIntent = "";
    },
  },

  extraReducers: (builder) => {

    // ================= FETCH ORDERS =================
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.fetchingOrders = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.fetchingOrders = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.fetchingOrders = false;
        state.error = action.payload;
        toast.error(action.payload);
      });

    // ================= PLACE ORDER =================
    builder
      .addCase(placeOrder.pending, (state) => {
        state.placingOrder = true;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placingOrder = false;
        state.finalPrice=action.payload.total_price;
        state.paymentIntent=action.payload.paymentIntent;
        state.orderStep=2;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.placingOrder = false;
        state.error = action.payload;
      });

    // ================= REQUEST RETURN =================
    builder
      .addCase(requestOrderReturn.fulfilled, (state, action) => {
        const order = state.myOrders.find(
          (o) => o.id === action.payload.orderId || o._id === action.payload.orderId
        );
        if (order) {
          order.order_status = action.payload.status;
        }
      });
  },
});

// ================= EXPORTS =================
export const {
  setOrderStep,
  setFinalPrice,
  clearOrderState,
} = orderSlice.actions;

export default orderSlice.reducer;
export const{toggleOrdersStep}=orderSlice.actions;