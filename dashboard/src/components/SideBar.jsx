import React, { useState } from "react"; 
import {
  LayoutDashboard,
  ListOrdered,
  Package,
  Users,
  LogOut,
  ChevronLeft,
  UserCircle,
  ChevronDown,
  FileText,
  MessageSquare,
  Mail,
  CheckSquare,
  Lock,
  AlertTriangle,
  Settings,
  HelpCircle,
  Component,
  Briefcase,
  Sparkles,
  Video,
  Shirt,
  ArrowLeftRight,
  Truck,
  Megaphone
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom"; 
import { logout } from "../store/slices/authSlice"; 
import { toggleNavbar, toggleComponent } from "../store/slices/extraSlice";
import avatar from "../assets/avatar.jpg";
import { resolveAvatar } from "../lib/helper";

const SideBar = () => {
  const dispatch = useDispatch();

  // Redux hooks for state persistence
  const { isNavbarOpened, openedComponent: activeComponent } = useSelector((state) => state.extra);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Accordion dropdowns state controller
  const [openSections, setOpenSections] = useState({
    sales: true,
    support: true,
    pages: false,
    ui: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  // Auth Guard
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Navigation Links Structure
  const sections = {
    sales: {
      label: "Sales product manager",
      items: [
        { icon: <LayoutDashboard size={16} />, title: "Dashboard" },
        { icon: <ListOrdered size={16} />, title: "Orders" },
        { icon: <ArrowLeftRight size={16} />, title: "Returns" },
        { icon: <Package size={16} />, title: "Products" },
        { icon: <Component size={16} />, title: "Campaigns" },
        { icon: <Sparkles size={16} />, title: "AI Creative Studio" },
        { icon: <Video size={16} />, title: "AI Video Studio" },
        { icon: <Megaphone size={16} />, title: "AI Marketing Studio" },
        { icon: <Shirt size={16} />, title: "Virtual Try-On" },
        { icon: <Briefcase size={16} />, title: "Buyer" },
        { icon: <FileText size={16} />, title: "Invoices" },
        { icon: <Truck size={16} />, title: "Delivery Boys" },
      ]
    },
    support: {
      label: "Support Apps",
      items: [
        { icon: <MessageSquare size={16} />, title: "Chats" },
        { icon: <Mail size={16} />, title: "Email" },
        { icon: <CheckSquare size={16} />, title: "Todo App" },
      ]
    },
    pages: {
      label: "All Pages",
      items: [
        { icon: <UserCircle size={16} />, title: "Profile" },
        { icon: <Users size={16} />, title: "Users" },
        { icon: <Lock size={16} />, title: "Authentication" },
        { icon: <AlertTriangle size={16} />, title: "Error Pages" },
        { icon: <Settings size={16} />, title: "Setting" },
        { icon: <FileText size={16} />, title: "Invoice Settings" },
        { icon: <HelpCircle size={16} />, title: "FAQ" },
      ]
    },
    ui: {
      label: "User Interface",
      items: [
        { icon: <Component size={16} />, title: "Components" },
      ]
    }
  };

  return (
    <>
      <aside
        className={`
          fixed top-0 bottom-0 h-full w-64 bg-slate-950 text-slate-400 z-[99] 
          transition-all duration-300 ease-in-out flex flex-col justify-between
          border-r border-slate-900 shadow-2xl font-sans overflow-hidden
          ${isNavbarOpened ? "left-0" : "-left-full"} 
          md:left-0
        `}
      >
        {/* Top Header & Scrollable Navigation */}
        <div className="flex flex-col h-[calc(100%-120px)]">
          <div className="flex items-center justify-between px-6 pt-5 pb-2 flex-shrink-0">
            <h2 className="text-sm font-black tracking-widest text-white uppercase italic">
              Control Hub
            </h2>
            <button 
              type="button"
              onClick={() => dispatch(toggleNavbar())}
              className="block md:hidden p-1.5 hover:bg-white/5 rounded-xl text-slate-400"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Scrollable Items Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 space-y-6">
            {Object.entries(sections).map(([key, section]) => (
              <div key={key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-[0.08em] hover:text-slate-400 transition-colors"
                >
                  <span>{section.label}</span>
                  <ChevronDown 
                    size={12} 
                    className={`transition-transform duration-300 text-slate-600 ${openSections[key] ? "" : "-rotate-90"}`} 
                  />
                </button>

                <div className={`space-y-0.5 transition-all duration-300 overflow-hidden ${openSections[key] ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
                  {section.items.map((item, index) => {
                    const isActive = activeComponent === item.title;

                    return (
                      <button
                        type="button"
                        onClick={() => dispatch(toggleComponent(item.title))}
                        key={index}
                        className={`
                          w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200
                          flex items-center justify-between group outline-none
                          ${isActive 
                            ? "bg-slate-900 text-white shadow-sm font-black" 
                            : "hover:bg-slate-900/40 hover:text-slate-200"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`transition-transform duration-200 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                            {item.icon}
                          </span>
                          <span className="tracking-wide text-[12px]">{item.title}</span>
                        </div>
                        {["Orders", "Products", "Buyer", "Invoices", "Delivery Boys", "Chats", "Profile", "Components", "Invoice Settings"].includes(item.title) && (
                          <ChevronDown size={12} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Panel Actions & User Profiles */}
        <div className="p-4 space-y-4 bg-slate-950 border-t border-slate-900/60 flex-shrink-0">
          
          {/* User Account Details Section */}
          {user && (
            <div className="flex items-center gap-3 px-2 py-0.5 border border-transparent">
              <img 
                src={resolveAvatar(user?.avatar, avatar)} 
                alt="user-avatar"
                className="w-8 h-8 rounded-xl object-cover border border-slate-800"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = avatar;
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-200 truncate">{user?.name || "prem Don"}</p>
                <p className="text-[10px] font-bold text-slate-500 truncate">{user?.email || "prem.admin@gmail.com"}</p>
              </div>
            </div>
          )}

          {/* Secure Logout Action Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideBar;