import { Link } from "react-router-dom";

export default function Navbar() {
    return (
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
    );
}
