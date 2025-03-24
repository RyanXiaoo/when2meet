import { useState } from "react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email === "") {
            setError("Email is required");
            setSuccess("");
        } else {
            setSuccess("Email sent");
            setError("");
        }
        setEmail("");
    };

    return (
        <div>
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                <form
                    onSubmit={handleSubmit}
                    className="bg-gray-800 p-8 rounded-lg w-96 h-[300px] flex flex-col justify-between"
                >
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white text-center mb-6">
                            Forgot Password
                        </h1>
                        <label htmlFor="email" className="block text-white">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="space-y-2">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Reset Password
                        </button>
                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}
                        {success && (
                            <p className="text-green-500 text-sm">{success}</p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
