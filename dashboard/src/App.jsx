import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { Toaster } from "react-hot-toast";

import SideBar from "./components/SideBar";
import Dashboard from "./components/Dashboard";
import Orders from "./components/Orders";
import Products from "./components/Products";
import Campaigns from "./components/Campaigns";
import AICreativeStudio from "./components/AICreativeStudio";
import AIVideoStudio from "./components/AIVideoStudio";
import AIMarketingStudio from "./components/AIMarketingStudio";
import VirtualTryOn from "./components/VirtualTryOn";
import Profile from "./components/Profile";
import Users from "./components/Users";
import Buyer from "./components/Buyer"; 
import Invoices from "./components/Invoices";
import DeliveryBoys from "./components/DeliveryBoys";
import Chats from "./components/Chats";
import Email from "./components/Email";
import Todo from "./components/Todo";
import Authentication from "./components/Authentication";
import ErrorPages from "./components/ErrorPages";
import FAQ from "./components/FAQ";
import InvoiceSettings from "./components/InvoiceSettings";
import Setting from "./components/Setting";
import Returns from "./components/Returns";

// Actions Imports
import { getUser } from "./store/slices/authSlice";
import { fetchAllUsers, getDashboardStats } from "./store/slices/adminSlice";
import { fetchAllProducts } from "./store/slices/productsSlice";

function App() {
  const dispatch = useDispatch();
  const { openedComponent } = useSelector((state) => state.extra);
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "Admin") {
      dispatch(getDashboardStats());
      dispatch(fetchAllProducts());
    }
  }, [isAuthenticated, user, dispatch]);

  const renderDashboardContent = () => {
    switch (openedComponent) {
      case "Dashboard":
        return <Dashboard />;
      case "Orders":
        return <Orders />;
      case "Returns":
        return <Returns />;
      case "Users":
        return <Users />;
      case "Profile":
        return <Profile />;
      case "Products":
        return <Products />;
      case "Campaigns":
        return <Campaigns />;
      case "AI Creative Studio":
        return <AICreativeStudio />;
      case "AI Video Studio":
        return <AIVideoStudio />;
      case "AI Marketing Studio":
        return <AIMarketingStudio />;
      case "Virtual Try-On":
        return <VirtualTryOn />;
      case "Buyer":
        return <Buyer />;
      case "Invoices":
        return <Invoices />;
      case "Delivery Boys":
        return <DeliveryBoys />;
      case "Chats":
        return <Chats />;
      case "Email":
        return <Email />;
      case "Todo App":
        return <Todo />;
      case "Authentication":
        return <Authentication />;
      case "Error Pages":
        return <ErrorPages />;
      case "Setting":
        return <Setting />;
      case "Invoice Settings":
        return <InvoiceSettings />;
      case "FAQ":
        return <FAQ />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) return null; 

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />

        {/* Protected Admin Route */}
        <Route
          path="/"
          element={
            // ✅ ROLE GUARD FIX: Sirf Admin logged in hoga tabhi layout khulega, varna login block par redirect hoga
            isAuthenticated && user?.role === "Admin" ? (
              <div className="flex min-h-screen bg-gray-100">
                <SideBar />
                <div className="flex-1 overflow-y-auto">
                  {renderDashboardContent()}
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-right" reverseOrder={false} />
    </Router>
  );
}

export default App;