import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    };

    const friendsDropdownItems = [
        { path: "/friends", label: "Friends List" },
        { path: "/friends/requests", label: "Friend Requests" },
        { path: "/friends/sent", label: "Sent Requests" },
    ];

    return (
        <nav className="bg-gray-900 shadow-lg mb-6">
            <div className="container mx-auto px-4">
                <div className="flex justify-between">
                    <div className="flex space-x-4">
                        {user ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className={`px-4 py-3 text-sm font-medium ${
                                        isActive("/dashboard")
                                            ? "text-white border-b-2 border-blue-500"
                                            : "text-gray-300 hover:text-white hover:border-b-2 hover:border-blue-400"
                                    } transition-colors duration-200`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/calendar"
                                    className={`px-4 py-3 text-sm font-medium ${
                                        isActive("/calendar")
                                            ? "text-white border-b-2 border-blue-500"
                                            : "text-gray-300 hover:text-white hover:border-b-2 hover:border-blue-400"
                                    } transition-colors duration-200`}
                                >
                                    Calendar
                                </Link>
                                <div className="relative group">
                                    <div
                                        className={`px-4 py-3 text-sm font-medium cursor-default ${
                                            location.pathname.startsWith(
                                                "/friends"
                                            )
                                                ? "text-white border-b-2 border-blue-500"
                                                : "text-gray-300"
                                        } transition-colors duration-200`}
                                    >
                                        Friends
                                    </div>
                                    <div className="absolute left-0 hidden group-hover:block w-48 py-2 bg-gray-800 rounded-md shadow-xl z-50">
                                        {friendsDropdownItems.map((item) => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`block px-4 py-2 text-sm ${
                                                    isActive(item.path)
                                                        ? "text-white bg-gray-700"
                                                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                                                } transition-colors duration-200`}
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    className={`px-4 py-3 text-sm font-medium ${
                                        isActive("/")
                                            ? "text-white border-b-2 border-blue-500"
                                            : "text-gray-300 hover:text-white hover:border-b-2 hover:border-blue-400"
                                    } transition-colors duration-200`}
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/login"
                                    className={`px-4 py-3 text-sm font-medium ${
                                        isActive("/login")
                                            ? "text-white border-b-2 border-blue-500"
                                            : "text-gray-300 hover:text-white hover:border-b-2 hover:border-blue-400"
                                    } transition-colors duration-200`}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/sign-up"
                                    className={`px-4 py-3 text-sm font-medium ${
                                        isActive("/sign-up")
                                            ? "text-white border-b-2 border-blue-500"
                                            : "text-gray-300 hover:text-white hover:border-b-2 hover:border-blue-400"
                                    } transition-colors duration-200`}
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                    {user && (
                        <button
                            onClick={handleLogout}
                            className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:border-b-2 hover:border-blue-400 transition-colors duration-200"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
