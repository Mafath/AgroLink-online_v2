import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {LogOut, Settings, User, Paperclip  } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Paperclip className="w-5 h-5 text-white-600" />
              </div>
              <h1 className="text-lg font-bold">AgroLink</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {!authUser && (
              <>
                <Link to="/signup" className={`h-8 px-3 rounded-md border text-sm`}>Sign up</Link>
                <Link to="/login" className={`h-8 px-3 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-sm flex items-center`}>Log in</Link>
              </>
            )}

            {authUser && (
              <>
                <Link
                  to={"/settings"}
                  className={`h-8 px-3 rounded-md border text-sm flex items-center gap-2`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>

                <Link to={"/profile"} className={`h-8 px-3 rounded-md border text-sm flex items-center gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center h-8 px-3 rounded-md border text-sm" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;