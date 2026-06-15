import {
  X,
  Home,
  Package,
  Info,
  HelpCircle,
  ShoppingCart,
  List,
  Phone,
  User,
  Heart,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar, toggleWishlist } from "../../store/slices/popupSlice";
import { useEffect, useState } from "react";

const Sidebar = () => {
  const { authUser } = useSelector((state) => state.auth);
  const { isSidebarOpen } = useSelector((state) => state.popup);
  const dispatch = useDispatch();
  const location = useLocation();

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
    }
  }, [isSidebarOpen]);

  const menuItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Products", icon: Package, path: "/products" },
    { name: "Wishlist", icon: Heart, onClick: () => { dispatch(toggleWishlist()); dispatch(toggleSidebar()); } },
    { name: "Contact", icon: Phone, path: "/contact" },
    { name: "Cart", icon: ShoppingCart, path: "/cart" },
    authUser && { name: "My Orders", icon: List, path: "/orders" },
    { name: "About", icon: Info, path: "/about" },
    { name: "FAQ", icon: HelpCircle, path: "/faq" },
  ].filter(Boolean);

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300
        ${animate ? "bg-black/50 backdrop-blur-sm" : "bg-black/0"}`}
        onClick={() => dispatch(toggleSidebar())}
      />

      {/* Dynamic Theme Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 z-50
        bg-[var(--card)]/95 backdrop-blur-2xl
        border-r border-[var(--border)]
        text-[var(--text)] shadow-2xl
        transition-all duration-300 ease-out
        ${animate ? "translate-x-0" : "-translate-x-full"}`}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-black uppercase tracking-wider text-white">
            Menu
          </h2>

          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-xl hover:bg-white/5 transition active:scale-90"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* USER PROFILE IN MENU */}
        {authUser && (
          <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
            {authUser.avatar ? (
              <img 
                src={typeof authUser.avatar === "string" ? authUser.avatar : authUser.avatar?.url} 
                alt="profile" 
                className="w-10 h-10 rounded-xl object-cover border border-[var(--border)] shadow-md shrink-0"
              />
            ) : (
              <div className="bg-[var(--primary)]/10 p-2.5 rounded-xl border border-[var(--border)] text-[var(--primary)] shrink-0">
                <User className="w-5 h-5" />
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase font-black tracking-wider opacity-50">Welcome back</p>
              <p className="font-bold truncate max-w-[185px] text-white">
                {authUser.name}
              </p>
            </div>
          </div>
        )}

        {/* MENU LIST ITEMS */}
        <nav className="p-4 overflow-y-auto h-[calc(100%-160px)]">
          <ul className="space-y-1">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li
                  key={item.name}
                  className={`transition-all duration-300 ${
                    animate
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-5"
                  }`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <Link
                    to={item.path || "#"}
                    onClick={(e) => {
                      if (item.onClick) {
                        e.preventDefault();
                        item.onClick();
                      } else {
                        dispatch(toggleSidebar());
                      }
                    }}
                    className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/15 border border-[var(--primary)]"
                        : "hover:bg-[var(--primary)]/10 border border-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition shrink-0" />

                    <span className="font-bold tracking-wide text-sm">
                      {item.name}
                    </span>

                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* FOOTER */}
        <div className="p-5 border-t border-[var(--border)] text-center text-[10px] font-black uppercase tracking-widest opacity-40">
          © 2026 Balaji Mart Official
        </div>
      </div>
    </>
  );
};

export default Sidebar;