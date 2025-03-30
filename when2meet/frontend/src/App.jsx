import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/loggedout/home";
import SignUp from "./pages/loggedout/signup";
import Login from "./pages/loggedout/login";
import ForgotPassword from "./components/forgotpassword";
import Dashboard from "./pages/loggedin/dashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 min-h-screen">
                <Router>
                    <div className="container mx-auto px-4 py-8">
                        <Navbar />
                    </div>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/sign-up" element={<SignUp />} />
                        <Route
                            path="/forgot-password"
                            element={<ForgotPassword />}
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Router>
            </div>
        </AuthProvider>
    );
}

export default App;
