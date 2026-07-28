import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-hot-toast";

export const adminSlice = createSlice({
  name: "admin",
  initialState: {
    loading: false,
    totalUsers: 0,
    users: [],
    totalRevenueAllTime: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    totalUsersCount: 0,
    monthlySales: [],
    orderStatusCounts: {},
    topSellingProducts: [],
    lowStockProducts: 0,
    revenueGrowth: "",
    newUsersThisMonth: 0,
    currentMonthSales: 0,
  },
  reducers: {
    getAllUsersRequest(state) {
      state.loading = true;
    },
    getAllUsersSuccess(state, action){
      state.loading = false;
      state.users = action.payload.users || [];
      state.totalUsers = action.payload.totalUsers || 0;
    },
    getAllUsersFailed(state){
     state.loading = false;
    },
    deleteUserRequest(state) {
      state.loading = true;
    },
    deleteUserSuccess(state, action){
      state.loading = false;
      // PostgreSQL standard 'id' field filter sync mapping
      state.users = state.users.filter((user) => user.id !== action.payload);
      state.totalUsers = Math.max(0, state.totalUsers - 1);
      state.totalUsersCount = Math.max(0, state.totalUsersCount - 1);
    },
    deleteUserFailed(state){
     state.loading = false;
    },
    updateUserRoleSuccess(state, action) {
      state.loading = false;
      const index = state.users.findIndex((user) => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index].role = action.payload.role;
      }
    },
    getstatsRequest(state){
      state.loading = true;
    },
    getstatsSuccess(state, action){
      state.loading = false;
      state.totalRevenueAllTime = action.payload.totalRevenueAllTime;
      state.todayRevenue = action.payload.todayRevenue;
      state.yesterdayRevenue = action.payload.yesterdayRevenue;
      state.totalUsersCount = action.payload.totalUsersCount;
      state.monthlySales = action.payload.monthlySales;
      state.orderStatusCounts = action.payload.orderStatusCounts;
      state.topSellingProducts = action.payload.topSellingProducts;
      state.lowStockProducts = action.payload.lowStockProducts?.length || 0;
      state.revenueGrowth = action.payload.revenueGrowth;
      state.newUsersThisMonth = action.payload.newUsersThisMonth;
      state.currentMonthSales = action.payload.currentMonthSales;
    },
    getstatsFailed(state){
      state.loading = false;
    }
  },
});

// ✅ 1. FETCH ALL USERS (Backend Route Match: /admin/getallusers)
export const fetchAllUsers = (page) => async (dispatch) => {
  dispatch(adminSlice.actions.getAllUsersRequest());
  try {
    // 💥 CHANGED: Backend exact route match kiya '/admin/getallusers'
    const res = await axiosInstance.get(`/admin/getallusers?page=${page || 1}`);
    dispatch(adminSlice.actions.getAllUsersSuccess(res.data));
  } catch (error) {
    dispatch(adminSlice.actions.getAllUsersFailed());
  }
};

// ✅ 2. DELETE USER (Backend Route Match: /admin/delete/:id)
export const deleteUser = (id, page) => async (dispatch, getState) => {
  dispatch(adminSlice.actions.deleteUserRequest());
  try {
    // 💥 CHANGED: Backend exact route match kiya '/admin/delete/:id'
    const res = await axiosInstance.delete(`/admin/delete/${id}`); 
    dispatch(adminSlice.actions.deleteUserSuccess(id));
    toast.success(res.data.message || "User deleted successfully");

    const { admin } = getState();
    const totalUsersAfterDelete = admin.totalUsers;
    const maxPages = Math.ceil(totalUsersAfterDelete / 10) || 1;
    const validPage = Math.min(page, maxPages);
    
    dispatch(fetchAllUsers(validPage));
  } catch (error) {
    dispatch(adminSlice.actions.deleteUserFailed());
    toast.error(error.response?.data?.message || "Failed to delete user");
  }
};

// ✅ 3. UPDATE USER ROLE (Industry Level Dashboard Feature)
export const updateUserRole = (id, role) => async (dispatch) => {
  dispatch(adminSlice.actions.getAllUsersRequest()); 
  try {
    // 💥 NOTE: Agar aapne adminRouter me router.put("/user/update/:id", updateUserRole) add kar diya hai, 
    // toh ye chalega, varna backend route me endpoint confirm kar lena
    const res = await axiosInstance.put(`/admin/user/update/${id}`, { role });
    dispatch(adminSlice.actions.updateUserRoleSuccess({ id, role }));
    toast.success(res.data.message || "Role updated successfully");
    
    // UI grid immediate refresh karne ke liye list dobara call ki
    dispatch(fetchAllUsers());
  } catch (error) {
    dispatch(adminSlice.actions.getAllUsersFailed());
    toast.error(error.response?.data?.message || "Failed to update role");
  }
};

// ✅ 4. DASHBOARD STATS (Backend Route Match: /admin/fetch/dashboard-stats)
export const getDashboardStats = () => async (dispatch) => {
  dispatch(adminSlice.actions.getstatsRequest());
  try {
    // 💥 CHANGED: Backend exact route match kiya '/admin/fetch/dashboard-stats'
    const res = await axiosInstance.get(`/admin/fetch/dashboard-stats`);
    dispatch(adminSlice.actions.getstatsSuccess(res.data));
  } catch (error) {
    dispatch(adminSlice.actions.getstatsFailed());
  }
};

export default adminSlice.reducer;