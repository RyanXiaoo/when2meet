import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 py-4">
            <div className="flex justify-center items-center">
                <nav className="bg-gray-800 flex justify-around items-center p-4 w-1/4 rounded-full">
                    <Link
                        to="/"
                        className="text-white hover:text-gray-300 transition-colors p-1 rounded-full"
                    >
                        Home
                    </Link>
                    {user ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="text-white hover:text-gray-300 transition-colors p-1 rounded-full"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-white hover:text-gray-300 transition-colors p-1 rounded-full"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-white hover:text-gray-300 transition-colors p-1 rounded-full"
                            >
                                Login
                            </Link>
                            <Link
                                to="/sign-up"
                                className="text-white hover:text-gray-300 transition-colors p-1 rounded-full"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </div>
    );
}
