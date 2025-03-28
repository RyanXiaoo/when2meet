import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    rememberMe: formData.rememberMe,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store the token based on remember me preference
                if (formData.rememberMe) {
                    localStorage.setItem("token", data.token);
                } else {
                    sessionStorage.setItem("token", data.token);
                }
                // Store user info
                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        id: data._id,
                        name: data.name,
                        email: data.email,
                    })
                );
                navigate("/dashboard");
            } else {
                alert(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("An error occurred during login");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <form
                onSubmit={handleSubmit}
                className="bg-gray-800 p-8 rounded-lg w-96 h-[400px] flex flex-col justify-between"
            >
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-white text-center mb-6">
                        Login
                    </h1>

                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-white">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-white">
                            <div className="flex justify-between items-center">
                                Password
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                            placeholder="Enter your password"
                            required
                        />
                        <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="rememberMe"
                                    className="ml-2 text-sm text-white"
                                >
                                    Remember me for 30 days
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Login
                </button>
            </form>
        </div>
    );
}
