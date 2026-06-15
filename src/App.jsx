import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { AnimatePresence } from "framer-motion";

// Layout
import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";
import SearchOverlay from "./components/Layout/SearchOverlay";
import CartSidebar from "./components/Layout/CartSidebar";
import WishlistSidebar from "./components/Layout/WishlistSidebar";
import ProfilePanel from "./components/Layout/ProfilePanel";
import LoginModal from "./components/Layout/LoginModal";
import Footer from "./components/Layout/Footer";
import AISalesman from './components/Layout/AISalesman';
import ComparisonDrawer from './components/Products/ComparisonDrawer';

// Pages
import Index from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";  
import Orders from "./pages/Orders";
import Payment from "./pages/Payment";
import OrderSuccess from "./pages/OrderSuccess"; // ✅ Naya Import
import OrderDetail from "./pages/OrderDetail";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import DeliveryRegister from "./pages/DeliveryRegister";
import DeliveryLogin from "./pages/DeliveryLogin";
import DeliveryPortal from "./pages/DeliveryPortal";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

// Redux
import { getUser } from "./store/slices/authSlice";
import { fetchAllProducts } from "./store/slices/productSlice";

const AppContent = () => {
  const location = useLocation();
  const isDeliveryPath = location.pathname.startsWith("/delivery") || location.pathname.startsWith("/admin");

  const isProfileOpen = useSelector(
    (state) => state.popup.isProfilePanelOpen
  );

  // Automatically scroll to the top of the page on route/path change (Flipkart behavior)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isDeliveryPath && <AISalesman />}
      {!isDeliveryPath && <ComparisonDrawer />}

      {/* NAVBAR & OVERLAYS */}
      {!isDeliveryPath && <Navbar />}
      {!isDeliveryPath && <Sidebar />}
      {!isDeliveryPath && <SearchOverlay />}
      {!isDeliveryPath && <CartSidebar />}
      {!isDeliveryPath && <WishlistSidebar />}

      {/* PROFILE PANEL */}
      <AnimatePresence>
        {isProfileOpen && <ProfilePanel />}
      </AnimatePresence>

      {/* LOGIN MODAL */}
      <LoginModal />

      {/* ROUTES */}
      <main className={`flex-grow ${isDeliveryPath ? "pt-0" : "pt-16"}`}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          
          {/* ✅ CART FLOW */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />   
          <Route path="/payment" element={<Payment />} />
          <Route path="/order-success" element={<OrderSuccess />} /> {/* ✅ SUCCESS PAGE ADDED */}
          <Route path="/order/:id" element={<OrderDetail />} />

          <Route path="/orders" element={<Orders />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/password/reset/:token" element={<ResetPassword />} />

          {/* 🚚 DELIVERY BOY PORTAL */}
          <Route path="/delivery/register" element={<DeliveryRegister />} />
          <Route path="/delivery/login" element={<DeliveryLogin />} />
          <Route path="/delivery/portal" element={<DeliveryPortal />} />

          {/* 👨‍💼 ADMIN PORTAL */}
          <Route path="/admin" element={<Admin />} />

          {/* 🔑 USER AUTHENTICATION */}
          <Route path="/login" element={<Login />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* FOOTER */}
      {!isDeliveryPath && <Footer />}
    </div>
  );
};

const App = () => {
  const dispatch = useDispatch();
  const { authUser, isCheckingAuth } = useSelector((state) => state.auth);

  // ================= AUTH =================
  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  // ================= PRODUCTS =================
  useEffect(() => {
    dispatch(
      fetchAllProducts({
        category: "",
        price: "0-10000",
        search: "",
        ratings: "",
        availability: "",
        page: 1,
      })
    );
  }, [dispatch]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        {isCheckingAuth && !authUser ? (
          <div className="flex items-center justify-center h-screen">
            <Loader className="animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <>
            <AppContent />
            <ToastContainer position="bottom-right" theme="dark" />
          </>
        )}
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;