import { Link } from "react-router-dom";

export default function Navbar({ isLoggedIn, setIsLoggedIn }) {
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
                </nav>
            </div>
        </div>
    );
}
