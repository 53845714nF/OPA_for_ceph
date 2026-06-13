import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { username, role, logout } = useAuth();

  return (
    <>
      <Sidebar />
      
      {/* Top right user info */}
      <div className="fixed top-0 right-0 p-4 flex items-center gap-4 z-50 bg-surface/80 backdrop-blur-sm border-b border-l border-outline-variant rounded-bl-xl shadow-sm">
        <div className="text-right hidden sm:block">
          <p className="font-label-md text-on-background font-medium">{username}</p>
          <p className="font-label-sm text-primary uppercase text-[10px] tracking-wider font-bold">{role}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">person</span>
        </div>
        <div className="w-px h-8 bg-outline-variant mx-1"></div>
        <button 
          onClick={logout}
          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors flex items-center"
          title="Logout"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>

      <div className="md:ml-64 pt-16 min-h-screen flex flex-col">
        <Outlet />
      </div>
    </>
  );
}
