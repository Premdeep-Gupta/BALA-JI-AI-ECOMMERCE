import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";
import { toggleAIModal } from "./popupSlice";


// ===============================
// GET ALL PRODUCTS (FATCH VERSION)
// ===============================
export const fetchAllProducts = createAsyncThunk(
  "product/fetchAllProducts",
  async (
    {
      availability = "",
      price = "0-200000",
      category = "",
      sub_category = "",
      offer_type = "",
      ratings = "",
      search = "",
      page = 1,
      limit = 12,
      brand = "",
      gender = "",
      color = "",
      size = "",
      discount = "",
      occasion = "",
    },
    thunkAPI
  ) => {
    try {
      const params = new URLSearchParams();

      if (category) params.append("category", category);
      if (sub_category) params.append("sub_category", sub_category);
      if (offer_type) params.append("offer_type", offer_type);
      if (price) params.append("price", price);
      if (search) params.append("search", search);
      if (ratings) params.append("ratings", ratings);
      if (availability) params.append("availability", availability);
      if (brand) params.append("brand", brand);
      if (gender) params.append("gender", gender);
      if (color) params.append("color", color);
      if (size) params.append("size", size);
      if (discount) params.append("discount", discount);
      if (occasion) params.append("occasion", occasion);
      if (page) params.append("page", page);
      if (limit) params.append("limit", limit);

      const res = await axiosInstance.get(
        `/product?${params.toString()}`
      );

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch products");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);


// ===============================
// GET PRODUCT DETAILS
// ===============================
export const fetchAllProductDetails = createAsyncThunk(
  "product/getProductDetails",
  async (id, thunkAPI) => {
    try {
      //console.log("PRODUCT DETAILS FETCHING");
      //console.log(res)
      //return res.data.product;

      const res = await axiosInstance.get(
        `/product/${id}`
      );
      return res.data.product;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch product details");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);


// ===============================
// ADD REVIEW
// ===============================
export const postReview = createAsyncThunk(
  "product/postReview",
  async ({ productId, reviewData }, thunkAPI) => {
    try {
      const res = await axiosInstance.post(
        `/product/review/${productId}`,
        reviewData
      );

      toast.success(res.data.message);
      return res.data.review;
    } catch (error) {
      console.warn("Review submission API error:", error.response?.data?.message);
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to add review");
    }
  }
);


// ===============================
// DELETE REVIEW
// ===============================
export const deleteReview = createAsyncThunk(
  "product/deleteReview",
  async ({ productId, reviewId }, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(
        `/product/review/${productId}`
      );

      toast.success(res.data.message);
      return reviewId;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);


// Helper for client-side fallback AI semantic search
const performClientAISearch = (products, prompt) => {
  const cleanPrompt = prompt.toLowerCase();
  
  // 1. Parse Price constraints
  let maxPrice = Infinity;
  let minPrice = 0;
  
  const underMatch = cleanPrompt.match(/(?:under|below|less than|below price of|sasta|cheap range|upto|up to|within)\s*([0-9,]+)/i);
  if (underMatch) {
    maxPrice = parseInt(underMatch[1].replace(/,/g, ""), 10);
  }
  
  const aboveMatch = cleanPrompt.match(/(?:above|over|more than|greater than|starting from)\s*([0-9,]+)/i);
  if (aboveMatch) {
    minPrice = parseInt(aboveMatch[1].replace(/,/g, ""), 10);
  }

  const budgetMatch = cleanPrompt.match(/budget\s*([0-9,]+)/i);
  if (budgetMatch) {
    maxPrice = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
  }
  
  // 2. Scan and score each product
  return products
    .map(product => {
      let score = 0;
      const name = (product.name || "").toLowerCase();
      const desc = (product.description || "").toLowerCase();
      const cat = (product.category || "").toLowerCase();
      
      // Category matches
      if (cleanPrompt.includes("electronic") || cleanPrompt.includes("gadget") || cleanPrompt.includes("laptop") || cleanPrompt.includes("headphone") || cleanPrompt.includes("earbud") || cleanPrompt.includes("computer")) {
        if (cat.includes("electronic") || cat.includes("electronics")) score += 5;
      }
      if (cleanPrompt.includes("cloth") || cleanPrompt.includes("fashion") || cleanPrompt.includes("wear") || cleanPrompt.includes("t-shirt") || cleanPrompt.includes("shirt") || cleanPrompt.includes("pant")) {
        if (cat.includes("fashion") || cat.includes("clothing")) score += 5;
      }
      if (cleanPrompt.includes("shoe") || cleanPrompt.includes("sneaker") || cleanPrompt.includes("footwear") || cleanPrompt.includes("run")) {
        if (cat.includes("shoes") || cat.includes("sports") || cat.includes("fashion")) score += 4;
      }
      if (cleanPrompt.includes("book") || cleanPrompt.includes("read") || cleanPrompt.includes("novel")) {
        if (cat.includes("books")) score += 5;
      }
      if (cleanPrompt.includes("home") || cleanPrompt.includes("kitchen") || cleanPrompt.includes("garden") || cleanPrompt.includes("furnish")) {
        if (cat.includes("home") || cat.includes("garden")) score += 5;
      }
      if (cleanPrompt.includes("mobile") || cleanPrompt.includes("phone") || cleanPrompt.includes("smartphone")) {
        if (cat.includes("mobiles") || cat.includes("electronics") || cat.includes("mobile")) score += 5;
      }
      
      // Keyword matches
      const words = cleanPrompt.split(/\s+/).filter(w => w.length > 2);
      words.forEach(word => {
        if (name.includes(word)) score += 3;
        if (desc.includes(word)) score += 1;
        if (cat.includes(word)) score += 2;
      });
      
      // Feature matches
      if (cleanPrompt.includes("bass") && (name.includes("bass") || desc.includes("bass"))) score += 4;
      if (cleanPrompt.includes("gaming") && (name.includes("gaming") || desc.includes("gaming"))) score += 4;
      if (cleanPrompt.includes("noise") && (name.includes("noise") || desc.includes("noise"))) score += 4;
      if (cleanPrompt.includes("wireless") && (name.includes("wireless") || desc.includes("wireless"))) score += 3;
      if (cleanPrompt.includes("waterproof") && (name.includes("waterproof") || desc.includes("waterproof"))) score += 3;
      if (cleanPrompt.includes("budget") && product.price < 5000) score += 2;
      if ((cleanPrompt.includes("best") || cleanPrompt.includes("top") || cleanPrompt.includes("star")) && product.ratings >= 4.5) score += 3;
      
      return { product, score, price: product.price };
    })
    .filter(item => item.score > 0 && item.price >= minPrice && item.price <= maxPrice)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
};

// ===============================
// AI SEARCH
// ===============================
export const fetchProductWithAI = createAsyncThunk(
  "product/ai-search",
  async (userPrompt, thunkAPI) => {
    try {
      // ✅ Explicitly object format mein bhejein
      const res = await axiosInstance.post(
        `/product/ai/search`,
        { userPrompt: userPrompt } // Backend 'userPrompt' hi expect kar raha hai
      );

      thunkAPI.dispatch(toggleAIModal());
      return res.data;
    } catch (error) {
      console.warn("AI search backend failed, using frontend semantic parser fallback:", error);
      try {
        // Fetch all products to search through
        const res = await axiosInstance.get("/product?limit=100");
        const allProducts = res.data.products || [];
        const filtered = performClientAISearch(allProducts, userPrompt);
        
        thunkAPI.dispatch(toggleAIModal());
        toast.info(`AI Offline Search: Found ${filtered.length} matching products`);
        return { products: filtered };
      } catch (innerError) {
        console.error("AI Offline Search Error:", innerError);
        thunkAPI.dispatch(toggleAIModal());
        toast.error("AI Search failed completely.");
        return thunkAPI.rejectWithValue("AI Search Failed");
      }
    }
  }
);


// ===============================
// SLICE
// ===============================
const productSlice = createSlice({
  name: "product",
  initialState: {
    loading: false,
    products: [],
    productDetails: null,
    totalProducts: 0,
    topRatedProducts: [],
    newProducts: [],
    aiSearching: false,
    isPostingReviews: false,
    isDeletingReview: false,
    productReviews: [],
    aiSearchQuery: "",
    error: null,
  },

  reducers: {
    setCampaignProducts: (state, action) => {
      state.products = action.payload.products || [];
      state.totalProducts = action.payload.products?.length || 0;
      state.aiSearchQuery = action.payload.title ? `💥 Campaign: ${action.payload.title}` : "";
    }
  },

  extraReducers: (builder) => {
    builder

      // ✅ FATCH ALL PRODUCTS
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;

        state.products = action.payload.products || [];
        state.totalProducts = action.payload.totalProducts || 0;

        state.topRatedProducts =
          action.payload.products?.filter((p) => p.ratings >= 4) || [];

        state.newProducts = action.payload.newProducts || [];
        state.aiSearchQuery = ""; // Clear AI search query
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // =======================
      // PRODUCT DETAILS
      // =======================
      .addCase(fetchAllProductDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProductDetails.fulfilled, (state, action) => {
        state.loading = false;

        state.productDetails = action.payload || {};
        state.productReviews = action.payload?.reviews || [];
      })
      .addCase(fetchAllProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // =======================
      // ADD REVIEW
      // =======================
      .addCase(postReview.pending, (state) => {
        state.isPostingReviews = true;
      })
      .addCase(postReview.fulfilled, (state, action) => {
        state.isPostingReviews = false;

        state.productReviews = [
          action.payload,
          ...state.productReviews,
        ];
      })
      .addCase(postReview.rejected, (state) => {
        state.isPostingReviews = false;
      })


      // =======================
      // DELETE REVIEW
      // =======================
      .addCase(deleteReview.pending, (state) => {
        state.isDeletingReview = true;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.isDeletingReview = false;

        state.productReviews = state.productReviews.filter(
          (review) => review._id !== action.payload
        );
      })
      .addCase(deleteReview.rejected, (state) => {
        state.isDeletingReview = false;
      })


      // =======================
      // AI SEARCH
      // =======================
      .addCase(fetchProductWithAI.pending, (state) => {
        state.aiSearching = true;
      })
      .addCase(fetchProductWithAI.fulfilled, (state, action) => {
        state.aiSearching = false;
        state.products = action.payload.products || [];
        state.totalProducts = action.payload.products?.length || 0;
        state.aiSearchQuery = action.meta.arg; // Save the prompt that was searched
      })
      .addCase(fetchProductWithAI.rejected, (state) => {
        state.aiSearching = false;
      });
  },
});
export const { setCampaignProducts } = productSlice.actions;
export default productSlice.reducer;