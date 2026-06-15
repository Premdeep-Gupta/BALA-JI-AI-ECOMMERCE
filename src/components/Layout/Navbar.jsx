import { Menu, User, ShoppingCart, Search, Heart } from "lucide-react"; 
import { useDispatch, useSelector } from "react-redux";
import { toggleAuthPopup, toggleCart, toggleSidebar, toggleSearchBar, toggleProfilePanel, toggleWishlist } from "../../store/slices/popupSlice";
import { useTheme } from "../../contexts/ThemeContext";
import { motion } from "framer-motion";
import { useState } from "react";

const Navbar = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart?.cart || []);
  const isSearchBarOpen = useSelector((state) => state.popup?.isSearchBarOpen);
  const { theme, toggleTheme } = useTheme();

  const cartItemsCount = cart.reduce((total, item) => total + (item?.quantity || 0), 0);
  const wishlist = useSelector((state) => state.wishlist?.wishlistItems || []);

  // Get active indicator for theme
  const getThemeIndicator = () => {
    if (theme === "wine") return "🍷";
    if (theme === "dark") return "🌙";
    return "☀️";
  };

  const getThemeTitle = () => {
    if (theme === "wine") return "Luxury Wine";
    if (theme === "dark") return "Dark Crimson";
    return "Light Rose";
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] shadow-lg transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* SIDEBAR TOGGLE */}
          <button 
            onClick={() => dispatch(toggleSidebar())} 
            className="p-2.5 rounded-xl hover:bg-[var(--primary)]/10 text-[var(--text)] transition active:scale-95 border border-transparent hover:border-[var(--border)]"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* LOGO */}
          <LinkToHome>
            <h1 className="text-2xl font-black tracking-tighter text-[var(--text)] cursor-pointer select-none">
              Balaji<span className="text-[var(--primary)] text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600"> Mart</span>
            </h1>
          </LinkToHome>

          <div className="flex items-center space-x-2">
            
            {/* STUNNING THEME SWITCH TOGGLE */}
            <button
              onClick={toggleTheme}
              title={`Switch Theme (Current: ${getThemeTitle()})`}
              className="p-2 rounded-xl bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--border)] text-lg transition-all duration-300 active:scale-90 flex items-center justify-center w-10 h-10 shadow-inner group relative"
            >
              <span className="group-hover:scale-125 transition-transform duration-300">
                {getThemeIndicator()}
              </span>
              
              {/* Tooltip */}
              <span className="absolute top-12 scale-0 group-hover:scale-100 transition-all text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {getThemeTitle()}
              </span>
            </button>

            {/* SEARCH */}
            <button 
              onClick={() => dispatch(toggleSearchBar())} 
              className={`p-2.5 rounded-xl transition border ${
                isSearchBarOpen 
                  ? "bg-[var(--primary)]/25 border-[var(--primary)] text-[var(--text)]" 
                  : "hover:bg-[var(--primary)]/10 border-transparent hover:border-[var(--border)] text-[var(--text)]"
              }`}
              title="Text Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* PROFILE */}
            <button
              onClick={() => authUser ? dispatch(toggleProfilePanel()) : dispatch(toggleAuthPopup())}
              className="p-1 rounded-xl hover:bg-[var(--primary)]/10 text-[var(--text)] transition border border-transparent hover:border-[var(--border)]"
              title={authUser ? authUser.name : "Login"}
            >
              {authUser?.avatar ? (
                <img
                  src={typeof authUser.avatar === "string" ? authUser.avatar : authUser.avatar?.url}
                  alt="profile"
                  className="w-8 h-8 rounded-xl object-cover border-2 border-[var(--primary)]/30 shadow-md"
                />
              ) : (
                <div className="p-1.5">
                  <User className="w-5 h-5" />
                </div>
              )}
            </button>

            {/* WISHLIST */}
            <button 
              onClick={() => dispatch(toggleWishlist())} 
              className="relative p-2.5 rounded-xl hover:bg-[var(--primary)]/10 text-[var(--text)] transition border border-transparent hover:border-[var(--border)] active:scale-95"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5 text-[var(--text)] hover:text-red-500 transition-colors" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-650 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* CART */}
            <button 
              onClick={() => dispatch(toggleCart())} 
              className="relative p-2.5 rounded-xl hover:bg-[var(--primary)]/10 text-[var(--text)] transition border border-transparent hover:border-[var(--border)] active:scale-95"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[var(--primary)] text-[var(--text)] text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_10px_var(--primary)]">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Internal link helper inside index/home routing mapping
const LinkToHome = ({ children }) => {
  return (
    <a href="/" onClick={(e) => {
      e.preventDefault();
      window.location.href = "/";
    }}>
      {children}
    </a>
  );
};

export default Navbar;