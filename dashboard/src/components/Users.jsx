import React, { useEffect, useState } from "react";
import avatar from "../assets/avatar.jpg";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import { LoaderCircle, UserX } from "lucide-react";
import { resolveAvatar } from "../lib/helper";
import {
  fetchAllUsers,
  deleteUser,
  updateUserRole,
} from "../store/slices/adminSlice";

const Users = () => {
  const [page, setPage] = useState(1);
  const { loading, users, totalUsers } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const [maxPages, setMaxPages] = useState(null);

  useEffect(() => {
    dispatch(fetchAllUsers(page));
  }, [dispatch, page]);

  useEffect(() => {
    if (totalUsers !== undefined) {
      const newMaxPages = Math.ceil(totalUsers / 10);
      setMaxPages(newMaxPages || 1);
    }
  }, [totalUsers]);

  useEffect(() => {
    if (maxPages && page > maxPages) {
      setPage(maxPages);
    }
  }, [maxPages, page]);

  const handleDelete = (id) => {
    dispatch(deleteUser(id, page));
  };

  const handleRoleUpdate = (id, currentRole) => {
    const newRole = currentRole === "Admin" ? "User" : "Admin";
    dispatch(updateUserRole(id, newRole));
  };

  return (
    <>
      <main className="p-4 md:p-8 md:pl-[18rem] bg-gray-50 min-h-screen font-sans transition-all duration-300 w-full">
        <div className="max-w-7xl mx-auto">
          {/* HEADER LAYER */}
          <div className="mb-6">
            <Header />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic mt-2">All Users Registry.</h1>
            <p className="text-sm text-slate-400 font-bold mt-1">Manage system accounts, authority parameters, and demotions.</p>
          </div>

          {/* MAIN DATA GRID SECTION */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-[50vh]">
               <LoaderCircle className="w-12 h-12 text-blue-600 animate-spin mb-4" />
               <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing Accounts Database...</p>
            </div>
          ) : users && users.length > 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Avatar</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">System Role</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Registered At</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/70">
                    {users.map((user, index) => {
                      // ✅ PostgreSQL dynamic standard structural key link
                      const userId = user.id || user._id;
                      return (
                        <tr key={userId || index} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <img
                              src={resolveAvatar(user?.avatar, avatar)}
                              alt={user.name || "User"}
                              className="w-10 h-10 rounded-xl object-cover shadow-inner border border-slate-100"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = avatar;
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 font-black text-sm text-slate-900">{user.name || "N/A"}</td>
                          <td className="px-6 py-4 font-bold text-xs text-slate-500">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              user.role === 'Admin' 
                                ? 'bg-purple-50 border border-purple-100 text-purple-600' 
                                : 'bg-slate-100 border border-slate-200 text-slate-600'
                            }`}>
                              {user.role || "User"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-400">
                            {user.created_at || user.createdAt ? new Date(user.created_at || user.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            }) : "N/A"}
                          </td>
                          <td className="px-6 py-4 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRoleUpdate(userId, user.role)}
                              className={`text-white rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
                                user.role === 'Admin' 
                                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                              }`}
                            >
                              {user.role === "Admin" ? "Demote" : "Make Admin"}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDelete(userId)}
                              className="text-white rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-500/10 transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mt-20 p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
               <UserX size={60} className="text-slate-200 mb-4" />
               <h3 className="text-xl font-black text-slate-800 tracking-tight">No registered users found.</h3>
               <p className="text-sm font-bold text-slate-400 mt-1">Database return parameters are empty or unauthenticated.</p>
            </div>
          )}

          {/* PAGINATION LAYOUT CONTAINER */}
          {!loading && maxPages > 1 && (
            <div className="flex justify-center items-center mt-8 gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Page {page} of {maxPages}</span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, maxPages))}
                disabled={page === maxPages}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Users;