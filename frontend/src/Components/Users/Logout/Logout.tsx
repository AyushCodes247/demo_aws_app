import { useState } from "react";
import { LogOut, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router";
import axios from "axios";

import api from "../../../api/api";
import { useAppDispatch, useAppSelector } from "../../../hooks/appHook";
import { logout, setError } from "../../../slices/userSlice";

const Logout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.user.accessToken);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await api.post(
        "/users/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      dispatch(logout());
      navigate("/", { replace: true });
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ??
          "Unable to log out. Please try again.")
        : "Something went wrong. Please try again.";

      setLogoutError(message);
      dispatch(setError(message));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-label="Log out"
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors duration-200 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingOut ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <LogOut size={18} />
        )}

        <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
      </button>

      {logoutError && (
        <p role="alert" className="text-xs text-red-400">
          {logoutError}
        </p>
      )}
    </div>
  );
};

export default Logout;
