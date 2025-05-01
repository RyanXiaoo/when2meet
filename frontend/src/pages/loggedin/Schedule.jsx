import { useState, useEffect } from "react";
import axios from "../../utils/axios";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    useSortable,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, color, isDragging }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({
            id: id,
        });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: color,
        height: "40px",
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="px-4 py-2 rounded-md text-center text-sm text-white cursor-grab active:cursor-grabbing shadow-md hover:brightness-110 transition-all duration-200 select-none touch-none min-w-[120px] whitespace-nowrap"
        >
            {id}
        </div>
    );
}

function DragOverlayItem({ id, color }) {
    return (
        <div
            style={{
                backgroundColor: color,
                height: "40px",
                transform: "scale(1.05)",
                opacity: 0.8,
            }}
            className="px-4 py-2 rounded-md text-center text-sm text-white shadow-xl cursor-grabbing transition-transform min-w-[120px] whitespace-nowrap"
        >
            {id}
        </div>
    );
}

export default function Schedule() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [items, setItems] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [saveStatus, setSaveStatus] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchEvents();
        loadSavedPriorities();
    }, []);

    const loadSavedPriorities = async () => {
        try {
            const response = await axios.get("/calendar/priorities");
            if (response.data && response.data.priorities) {
                // We'll use this data when setting up items
                return response.data.priorities;
            }
        } catch (err) {
            console.error("Error loading priorities:", err);
        }
        return null;
    };

    useEffect(() => {
        const setupItems = async () => {
            const uniqueTypes = new Map();
            const savedPriorities = await loadSavedPriorities();

            if (Array.isArray(events)) {
                events.forEach((event) => {
                    const eventType = event.calendar;
                    if (
                        eventType &&
                        !eventType.includes("@") &&
                        eventType !== "Default"
                    ) {
                        // If we have saved priorities, use them; otherwise, use default order
                        const savedPriority = savedPriorities?.find(
                            (p) => p.type === eventType
                        )?.priority;
                        uniqueTypes.set(eventType, {
                            id: eventType,
                            color: event.backgroundColor || "#039be5",
                            priority: savedPriority || 0.5, // Default priority
                        });
                    }
                });
            }

            const newItems = Array.from(uniqueTypes.values());
            // Sort by saved priority if available
            if (savedPriorities) {
                newItems.sort((a, b) => b.priority - a.priority);
            }
            setItems(newItems);
        };

        setupItems();
    }, [events]);

    const fetchEvents = async () => {
        try {
            const response = await axios.get("/calendar/events/google");
            if (response.data && response.data.events) {
                setEvents(response.data.events);
            } else {
                setError("No events data in response");
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching events:", err);
            setError("Failed to fetch calendar events");
            setLoading(false);
        }
    };

    const savePriorities = async () => {
        try {
            setSaveStatus("Saving...");

            // Calculate priority values based on position (10 to 1)
            const prioritiesData = items.map((item, index) => {
                const priority = 10 - (index * 9) / (items.length - 1 || 1);
                return {
                    type: String(item.id), // Ensure type is a string
                    priority: Number(priority.toFixed(2)), // Ensure priority is a clean number
                };
            });

            console.log("Saving priorities:", prioritiesData);

            const response = await axios.post("/calendar/priorities", {
                priorities: prioritiesData,
            });

            console.log("Save response:", response.data);

            if (response.data.priorities) {
                // Update local items with saved priorities
                setItems((items) =>
                    items.map((item) => {
                        const savedPriority = response.data.priorities.find(
                            (p) => p.type === item.id
                        );
                        return {
                            ...item,
                            priority: savedPriority
                                ? savedPriority.priority
                                : item.priority,
                        };
                    })
                );
            }

            setSaveStatus("Saved successfully!");
            setTimeout(() => setSaveStatus(""), 3000);
        } catch (err) {
            console.error("Error saving priorities:", {
                error: err.message,
                response: err.response?.data,
                data: err.response?.data?.error,
            });
            setSaveStatus(
                err.response?.data?.message || "Error saving priorities"
            );
            setTimeout(() => setSaveStatus(""), 3000);
        }
    };

    function handleDragStart(event) {
        setActiveId(event.active.id);
    }

    function handleDragEnd(event) {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(
                    (item) => item.id === active.id
                );
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update priority values after reordering (10 to 1)
                return newItems.map((item, index) => ({
                    ...item,
                    priority: 10 - (index * 9) / (newItems.length || 1),
                }));
            });
        }
    }

    function handleDragCancel() {
        setActiveId(null);
    }

    if (loading) return <div className="text-white">Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    const activeItem = items.find((item) => item.id === activeId);

    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="bg-gray-800 rounded-lg p-6 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Schedule</h2>
                    <div className="flex items-center gap-4">
                        {saveStatus && (
                            <span
                                className={`text-sm ${
                                    saveStatus.includes("Error")
                                        ? "text-red-400"
                                        : "text-green-400"
                                }`}
                            >
                                {saveStatus}
                            </span>
                        )}
                        <button
                            onClick={savePriorities}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                            Save Priorities
                        </button>
                    </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6 mb-8">
                    <div className="relative h-48">
                        {/* Priority Line */}
                        <div className="flex justify-between mb-4">
                            <div className="text-xs text-gray-400">
                                Higher Priority
                            </div>
                            <div className="text-xs text-gray-400">
                                Lower Priority
                            </div>
                        </div>

                        {/* Line with Tick Marks */}
                        <div className="relative mb-8">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-400"></div>
                            {items.map((_, index) => (
                                <div
                                    key={index}
                                    className="absolute w-0.5 h-3 bg-gray-400"
                                    style={{
                                        left: `${
                                            (index / (items.length - 1 || 1)) *
                                            100
                                        }%`,
                                        transform: "translateX(-50%)",
                                    }}
                                ></div>
                            ))}
                        </div>

                        {/* Event Types */}
                        <div className="mt-12">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragCancel={handleDragCancel}
                            >
                                <SortableContext
                                    items={items.map((item) => item.id)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    <div className="flex justify-between items-start">
                                        {items.map((item) => (
                                            <SortableItem
                                                key={item.id}
                                                id={item.id}
                                                color={item.color}
                                                isDragging={
                                                    item.id === activeId
                                                }
                                            />
                                        ))}
                                    </div>
                                </SortableContext>

                                <DragOverlay>
                                    {activeId && activeItem ? (
                                        <DragOverlayItem
                                            id={activeItem.id}
                                            color={activeItem.color}
                                        />
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6">
                    <p className="text-gray-300">
                        Your schedule management page is coming soon! Here
                        you'll be able to:
                    </p>
                    <ul className="list-disc list-inside mt-4 space-y-2 text-gray-300">
                        <li>View your weekly and monthly schedules</li>
                        <li>Manage your availability</li>
                        <li>Set preferred meeting times</li>
                        <li>Coordinate with friends and colleagues</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
