import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const fetchAllOrders = createAsyncThunk(
  "orders/fetchAll",
  async (_, thunkAPI) => {
    try {
      const { data } = await axiosInstance.get("/order/admin/getall");
      return data.orders;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders."
      );
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ orderId, status, delivery_boy_name, delivery_boy_phone, delivery_boy_vehicle, delivery_boy_photo, otp }, thunkAPI) => {
    try {
      const { data } = await axiosInstance.put(
        `/order/admin/update/${orderId}`,
        { status, delivery_boy_name, delivery_boy_phone, delivery_boy_vehicle, delivery_boy_photo, otp }
      );

      toast.success(data.message || "Order status updated successfully.");

      return data.updatedOrder;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update order status."
      );
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          "Failed to update order status."
      );
    }
  }
);

export const deleteOrder = createAsyncThunk(
  "orders/delete",
  async (orderId, thunkAPI) => {
    try {
      const { data } = await axiosInstance.delete(
        `/order/admin/delete/${orderId}`
      );

      toast.success(data.message || "Order deleted successfully.");

      // ✅ Return orderId so we can filter it out in the reducer
      return orderId;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete order."
      );

      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          "Failed to delete order"
      );
    }
  }
);

export const fetchDeliveryAgents = createAsyncThunk(
  "orders/fetchAgents",
  async (_, thunkAPI) => {
    try {
      const { data } = await axiosInstance.get("/delivery/admin/agents");
      return data.deliveryAgents;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch delivery agents."
      );
    }
  }
);

export const fetchReturnRequests = createAsyncThunk(
  "orders/fetchReturns",
  async (_, thunkAPI) => {
    try {
      const { data } = await axiosInstance.get("/order/admin/returns/all");
      return data.returns;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch return requests."
      );
    }
  }
);

export const updateReturnRequestStatus = createAsyncThunk(
  "orders/updateReturnStatus",
  async ({ returnId, status, qc_report, refund_details }, thunkAPI) => {
    try {
      const { data } = await axiosInstance.put(
        `/order/admin/return/update/${returnId}`,
        { status, qc_report, refund_details }
      );
      toast.success(data.message || `Return status updated to ${status}.`);
      return data.returnRequest;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update return status."
      );
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update return status."
      );
    }
  }
);

const orderSlice = createSlice({
  name: "order",

  initialState: {
    loading: false,
    orders: [],
    returns: [],
    deliveryAgents: [],
    loadingReturns: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })

      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchDeliveryAgents.fulfilled, (state, action) => {
        state.deliveryAgents = action.payload || [];
      })

      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload) return;

        const index = state.orders.findIndex(
          (order) => (order._id || order.id) === (action.payload._id || action.payload.id)
        );

        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            ...action.payload,
          };
        }
      })

      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
      })

      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;

        // ✅ FIXED: Checking both _id and id to ensure it works with PostgreSQL data
        state.orders = state.orders.filter(
          (order) => order._id !== action.payload && order.id !== action.payload
        );
      })

      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchReturnRequests.pending, (state) => {
        state.loadingReturns = true;
      })

      .addCase(fetchReturnRequests.fulfilled, (state, action) => {
        state.loadingReturns = false;
        state.returns = action.payload;
      })

      .addCase(fetchReturnRequests.rejected, (state, action) => {
        state.loadingReturns = false;
        state.error = action.payload;
      })

      .addCase(updateReturnRequestStatus.pending, (state) => {
        state.loadingReturns = true;
      })

      .addCase(updateReturnRequestStatus.fulfilled, (state, action) => {
        state.loadingReturns = false;
        const index = state.returns.findIndex(
          (ret) => ret.id === action.payload.id
        );
        if (index !== -1) {
          state.returns[index] = {
            ...state.returns[index],
            ...action.payload,
          };
        }
      })

      .addCase(updateReturnRequestStatus.rejected, (state, action) => {
        state.loadingReturns = false;
        state.error = action.payload;
      });
  },
});

export default orderSlice.reducer;