import React from "react";
import { useDispatch, useSelector } from "react-redux";
import avatar from "../assets/avatar.jpg";
import { Menu } from "lucide-react";
import { toggleNavbar } from "../store/slices/extraSlice";
import { resolveAvatar } from "../lib/helper";

const Header = () => {
  const {user} = useSelector((state)=>state.auth);
  const {openedComponent} = useSelector((state)=> state.extra);
  const dispatch = useDispatch();
  return ( 
  <>
    <header className="flex justify-between mb-3 pb-2">
      <p className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">{user?.name}</span>
        <span>/</span>
        <span>{openedComponent}</span>
      </p>
      <div className="flex gap-3 items-center">
        <Menu
          className="block md:hidden"
          onClick={() => dispatch(toggleNavbar())}
        />
        <img 
          src={resolveAvatar(user?.avatar, avatar)} 
          alt={user?.name || "avatar"}
          className="w-14 h-14 rounded-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = avatar;
          }}
        />
      </div>
    </header>
  </>
  );
};

export default Header;
