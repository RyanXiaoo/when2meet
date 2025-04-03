import { Link } from "react-router-dom";

export default function Calendar() {
    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="bg-gray-800 rounded-lg p-6 text-white">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Google Calendar Option */}
                    <Link to="/calendar/google" className="block">
                        <div className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold">
                                    Google Calendar
                                </h2>
                            </div>
                            <p className="text-gray-400">
                                Connect your Google Calendar to sync your events
                                and meetings.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
