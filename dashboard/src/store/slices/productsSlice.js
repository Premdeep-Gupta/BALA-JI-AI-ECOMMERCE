import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toggleCreateProductModal, toggleUpdateProductModal } from "./extraSlice";
import { toast } from "react-hot-toast";

const productSlice = createSlice({
  name: "product",
  initialState: {
    loading: false,
    fetchingProduct: false,
    products: [],
    allProducts: [], 
    totalProducts: 0,
  },
  reducers: {
    createProductRequest(state) {
      state.loading = true;
    },
    createProductSuccess(state, action) {
      state.loading = false;
      const payloadData = action.payload;
      if (!payloadData) return;
      
      const finalProduct = payloadData.product || payloadData;
      const newProduct = { ...finalProduct, _id: finalProduct.id || finalProduct._id };
      
      state.products = [newProduct, ...state.products];
    },
    createProductFailed(state) {
      state.loading = false;
    },
    getAllProductRequest(state) {
      state.fetchingProduct = true;
    },
    getAllProductSuccess(state, action) {
      state.fetchingProduct = false;
      state.products = (action.payload.products || []).map(p => ({
        ...p,
        _id: p.id || p._id
      }));
      state.totalProducts = action.payload.totalProducts || 0;
    },
    getAllProductFailed(state) {
      state.fetchingProduct = false;
    },
    getAllProductsForDashboardRequest(state) {
      state.fetchingProduct = true;
    },
    getAllProductsForDashboardSuccess(state, action) {
      state.fetchingProduct = false;
      state.allProducts = (action.payload.products || []).map(p => ({
        ...p,
        _id: p.id || p._id
      }));
    },
    getAllProductsForDashboardFailed(state) {
      state.fetchingProduct = false;
    },
    updateProductRequest(state) {
      state.loading = true;
    },
    updateProductSuccess(state, action) {
      state.loading = false;
      const payloadData = action.payload;
      if (!payloadData) return;

      // 🔥 SYNCHRONIZED UPDATE PARSING: Handle both explicit updatedProduct wrapper or direct objects safely
      const updatedP = payloadData.updatedProduct || payloadData.product || payloadData;
      
      state.products = state.products.map((product) =>
        (product.id === updatedP.id || product._id === updatedP.id || product._id === updatedP._id) 
        ? { ...updatedP, _id: updatedP.id || updatedP._id } : product
      );
    },
    updateProductFailed(state) {
      state.loading = false;
    },
    deleteProductRequest(state) {
      state.loading = true;
    },
    deleteProductSuccess(state, action) {
      state.loading = false;
      state.products = state.products.filter((product) => 
        product.id !== action.payload && product._id !== action.payload
      );
      state.totalProducts = Math.max(0, state.totalProducts - 1);
    },
    deleteProductFailed(state) {
      state.loading = false;
    },
  }
});

export const fetchAllProducts = (page, limit, category = "", search = "", availability = "") => async (dispatch) => {
  dispatch(productSlice.actions.getAllProductRequest());
  try {
    const params = new URLSearchParams();
    params.append("page", page || 1);
    params.append("limit", limit || 10);
    if (category) params.append("category", category);
    if (search) params.append("search", search);
    if (availability) params.append("availability", availability);

    const res = await axiosInstance.get(`/product?${params.toString()}`);
    dispatch(productSlice.actions.getAllProductSuccess(res.data));
  } catch (error) {
    dispatch(productSlice.actions.getAllProductFailed());
    toast.error(error.response?.data?.message || "Failed to fetch products.");
  }
};

export const fetchAllProductsForDashboard = () => async (dispatch) => {
  dispatch(productSlice.actions.getAllProductsForDashboardRequest());
  try {
    const res = await axiosInstance.get(`/product?page=1&limit=10000`);
    dispatch(productSlice.actions.getAllProductsForDashboardSuccess(res.data));
  } catch (error) {
    dispatch(productSlice.actions.getAllProductsForDashboardFailed());
  }
};

export const createProduct = (data) => async (dispatch) => {
  dispatch(productSlice.actions.createProductRequest());
  try {
    const res = await axiosInstance.post("/product/admin/create", data, {
      headers: {
        "Content-Type": "multipart/form-data" 
      },
      withCredentials: true // 🔥 CORE FIX: Auth cookie included
    });
    dispatch(productSlice.actions.createProductSuccess(res.data));
    toast.success(res.data.message || "Product created successfully.");
    dispatch(toggleCreateProductModal()); 
  } catch (error) {
    dispatch(productSlice.actions.createProductFailed());
    toast.error(error.response?.data?.message || "Failed to create product.");
  }
};

// 🔥 FULLY REPAIRED MULTIPART UPDATE THUNK ACTION
export const updateProduct = (id, data) => async (dispatch) => {
  dispatch(productSlice.actions.updateProductRequest());
  try {
    const res = await axiosInstance.put(`/product/admin/update/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data" 
      },
      withCredentials: true // 🔥 CORE FIX: Auth cookie included
    });
    
    dispatch(productSlice.actions.updateProductSuccess(res.data));
    toast.success(res.data.message || "Product updated successfully.");
    dispatch(toggleUpdateProductModal()); 
  } catch (error) {
    dispatch(productSlice.actions.updateProductFailed());
    toast.error(error.response?.data?.message || "Failed to update product.");
  }
};

export const deleteProduct = (id, page) => async (dispatch) => {
  dispatch(productSlice.actions.deleteProductRequest());
  try {
    await axiosInstance.delete(`/product/admin/delete/${id}`, {
      withCredentials: true // 🔥 CORE FIX: Auth cookie included
    });
    dispatch(productSlice.actions.deleteProductSuccess(id));
    toast.success("Product deleted successfully.");
    dispatch(fetchAllProducts(page || 1));
  } catch (error) {
    dispatch(productSlice.actions.deleteProductFailed());
    toast.error(error.response?.data?.message || "Failed to delete product.");
  }
};

export const { createProductSuccess, updateProductSuccess } = productSlice.actions;
export default productSlice.reducer;