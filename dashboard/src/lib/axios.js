import axios from "axios";

// ✅ Yahi single configuration kafi hai aapke pure project ke liye.
// 'withCredentials: true' browser ko batata hai ki har request ke sath 
// automatically cookies (admin_token) attach karni hai.
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  withCredentials: true,
  headers: {
    "X-App-Type": "Admin",
  },
});

// ✅ ADD THIS INTERCEPTOR
// Provides a fallback for cross-site cookie blocking by passing Bearer token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});