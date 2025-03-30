import { useAuth } from "../../context/AuthContext";
import Dashboard from "./dashboard";

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="container mx-auto px-4 pt-20">
            
            <div className="bg-gray-800 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-4">
                    Welcome, {user.username}!
                </h1>
                <p>This is your dashboard. More features coming soon!</p>
            </div>
        </div>
    );
}
