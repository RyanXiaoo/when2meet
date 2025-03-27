import calendar from "../../images/calendar.svg";
import friends from "../../images/friends.svg";
import perfecttime from "../../images/perfecttime.svg";

export default function Home() {
    return (
        <div className="flex flex-col items-center w-screen pb-8">
            <div className="flex justify-center flex-col items-center rounded-lg w-2/3 min-h-screen">
                <h1 className="text-white text-6xl font-bold">
                    Welcome to When2Meet
                </h1>
                <p className="p-8 text-white text-lg">
                    The easiest way to find a time for everyone.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6  px-6 text-white">
                    <div className="bg-gray-700/60 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-2">
                            See everyone's availability, all in one place
                        </h2>
                        <p>
                            Link your calendar and instantly check when friends
                            are free — no guessing, no group texts.
                        </p>
                    </div>
                    <div className="bg-gray-700/60 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-2">
                            Connect your Google Calendar or Notion
                        </h2>
                        <p>
                            Import your schedule once and stay synced
                            automatically. Everyone sees the most up-to-date
                            times.
                        </p>
                    </div>
                    <div className="bg-gray-700/60 p-6 rounded-lg shadow-md">
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
            <div className="flex flex-col items-center p-2 rounded-lg shadow-lg w-2/3 m-8 min-h-screen">
                <div className="mt-48 p-8 flex flex-col w-full">
                    <div className="flex flex-col items-center">
                        <h1 className="text-white text-4xl p-4">
                            How it works
                        </h1>
                    </div>

                    <div className="flex flex-col items-center bg-gray-700/60 w-2/3 rounded-full m-4 h-1/5">
                        <div className="flex flex-row items-center justify-evenly h-full">
                            <div className="flex flex-col items-center w-1/3">
                                <img
                                    src={calendar}
                                    alt="calendar"
                                    className="w-full p-8"
                                />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-white text-2xl pl-4">
                                    1. Link your calendar
                                </h2>
                                <p className="text-white text-lg p-4">
                                    Import your schedule once and stay synced
                                    automatically. Everyone sees the most
                                    up-to-date times.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex self-end flex-col items-center bg-gray-700/60 w-2/3 rounded-full m-4 h-1/5">
                        <div className="flex flex-row items-center justify-evenly h-full p-4">
                            <div className="flex flex-col items-center w-1/2">
                                <img
                                    src={friends}
                                    alt="friends"
                                    className="w-full p-8"
                                />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-white text-2xl pl-4">
                                    2. Select your friends
                                </h2>
                                <p className="text-white text-lg p-4">
                                    Invite your friends to connect. Their
                                    schedules sync instantly so you can all see
                                    when everyone's available
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex  flex-col items-center bg-gray-700/60 w-2/3 rounded-full m-4 h-1/5">
                        <div className="flex flex-row items-center justify-evenly h-full p-4">
                            <div className="flex flex-col items-center w-1/2">
                                <img
                                    src={perfecttime}
                                    alt="perfecttime"
                                    className="w-full p-8"
                                />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-white text-2xl pl-4">
                                    3. Find the perfect time
                                </h2>
                                <p className="text-white text-lg p-4">
                                    We’ll highlight the best overlapping times
                                    for your group. Just pick what works and
                                    you're good to go.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
