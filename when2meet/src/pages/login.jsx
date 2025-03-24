import { useState } from "react";

export default function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle login submission here
        console.log("Login submitted:", formData);
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
