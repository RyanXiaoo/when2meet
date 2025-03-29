import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Check password match when either password field changes
        if (name === "password" || name === "confirmPassword") {
            if (name === "password") {
                setPasswordMatch(value === formData.confirmPassword);
            } else {
                setPasswordMatch(value === formData.password);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setHasSubmitted(true);

        if (!passwordMatch) {
            setError("Passwords do not match!");
            return;
        }

        if (!formData.username || !formData.email || !formData.password) {
            setError("All fields are required");
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create account");
            }

            // Successful signup
            navigate("/login");
        } catch (err) {
            setError(err.message || "An error occurred during signup");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <form
                onSubmit={handleSubmit}
                className="bg-gray-800 p-8 rounded-lg w-96 space-y-6"
            >
                <h1 className="text-2xl font-bold text-white text-center mb-6">
                    Sign Up
                </h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="username" className="block text-white">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                        placeholder="Enter your username"
                    />
                </div>

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
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="block text-white">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                        placeholder="Enter your password"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="confirmPassword"
                        className="block text-white"
                    >
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-md bg-gray-700 text-white border ${
                            hasSubmitted && !passwordMatch
                                ? "border-red-500"
                                : "border-gray-600"
                        } focus:outline-none focus:border-blue-500`}
                        placeholder="Confirm your password"
                    />
                    {hasSubmitted && !passwordMatch && (
                        <p className="text-red-500 text-sm">
                            Passwords do not match
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating Account..." : "Sign Up"}
                </button>
            </form>
        </div>
    );
}
