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
import Calendar from "./pages/loggedin/Calendar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import FriendsList from "./pages/loggedin/friends/FriendsList";
import FriendRequests from "./pages/loggedin/friends/FriendRequests";
import SentRequests from "./pages/loggedin/friends/SentRequests";
import GoogleCalendar from "./pages/loggedin/GoogleCalendar";

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
                        <Route
                            path="/calendar"
                            element={
                                <ProtectedRoute>
                                    <Navigate to="/calendar/google" replace />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/calendar/google"
                            element={
                                <ProtectedRoute>
                                    <GoogleCalendar />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/friends"
                            element={
                                <ProtectedRoute>
                                    <FriendsList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/friends/requests"
                            element={
                                <ProtectedRoute>
                                    <FriendRequests />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/friends/sent"
                            element={
                                <ProtectedRoute>
                                    <SentRequests />
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
