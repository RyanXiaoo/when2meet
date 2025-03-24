import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Navbar from "./components/navbar";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import Login from "./pages/login";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
    return (
        <div className="min-h-screen bg-gray-900">
            <Router>
                <div className="container mx-auto px-4 py-8">
                    <Navbar />
                </div>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/sign-up" element={<SignUp />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
