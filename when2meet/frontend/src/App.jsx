import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Navbar from "./components/navbar";
import Home from "./pages/loggedout/home";
import SignUp from "./pages/loggedout/signup";
import Login from "./pages/loggedout/login";
import ForgotPassword from "./pages/loggedout/forgotpassword";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    return (
        <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 min-h-screen">
            <Router>
                <div className="container mx-auto px-4 py-8">
                    <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                </div>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/sign-up" element={<SignUp />} />
                    <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                    />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
