import { useState } from "react";

export default function SignUp() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [hasSubmitted, setHasSubmitted] = useState(false);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!passwordMatch) {
            setHasSubmitted(true);
            alert("Passwords do not match!");
            setHasSubmitted(false); // Reset after showing error
            return;
        }
        // Handle form submission here
        console.log("Form submitted:", formData);
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <form
                onSubmit={handleSubmit}
                className="bg-gray-800 p-8 rounded-lg w-96 h-[400px] flex flex-col justify-between"
            >
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-white text-center mb-6">
                        Sign Up
                    </h1>

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
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Sign Up
                </button>
            </form>
        </div>
    );
}
