export default function Home() {
    return (
        <div className="flex flex-col items-center h-[calc(100vh-4rem)] w-screen">
            <div className="flex flex-col items-center bg-gray-800 p-8 rounded-lg shadow-lg w-2/3 m-8">
                <h1 className="text-white text-6xl font-bold">
                    Welcome to When2Meet
                </h1>
                <p className="p-8 text-white text-lg">
                    The easiest way to find a time for everyone.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6  px-6 text-white">
                    <div className="bg-gray-700 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-2">
                            See everyone’s availability, all in one place
                        </h2>
                        <p>
                            Link your calendar and instantly check when friends
                            are free — no guessing, no group texts.
                        </p>
                    </div>
                    <div className="bg-gray-700 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-2">
                            Connect your Google Calendar or Notion
                        </h2>
                        <p>
                            Import your schedule once and stay synced
                            automatically. Everyone sees the most up-to-date
                            times.
                        </p>
                    </div>
                    <div className="bg-gray-700 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-2">
                            We find the best time for you and your friends
                        </h2>
                        <p>
                            Our system highlights overlapping free times. Just
                            select a few friends and you won't have to figure
                            this out
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
