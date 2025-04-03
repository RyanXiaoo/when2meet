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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        const uniqueTypes = new Map();
        if (Array.isArray(events)) {
            console.log("Processing events:", events);
            events.forEach((event) => {
                // Use the calendar property for the event type
                const eventType = event.calendar;

                if (
                    eventType &&
                    !eventType.includes("@") &&
                    eventType !== "Default"
                ) {
                    console.log("Adding event type:", eventType);
                    uniqueTypes.set(eventType, {
                        id: eventType,
                        color: event.backgroundColor || "#039be5",
                    });
                }
            });
        }
        const newItems = Array.from(uniqueTypes.values());
        console.log("Final unique calendar types:", newItems);
        setItems(newItems);
    }, [events]);

    const fetchEvents = async () => {
        try {
            const response = await axios.get("/calendar/events/google");
            console.log("Raw calendar response:", response.data);
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
                return arrayMove(items, oldIndex, newIndex);
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
                <h2 className="text-2xl font-bold mb-6">Schedule</h2>

                <div className="bg-gray-700 rounded-lg p-6 mb-8">
                    <div className="relative h-48">
                        {/* Priority Line */}
                        <div className="flex justify-between mb-4">
                            <div className="text-sm text-gray-300">
                                Most important
                            </div>
                            <div className="text-sm text-gray-300">
                                Least important
                            </div>
                        </div>

                        {/* Line with Tick Marks */}
                        <div className="relative mb-8">
                            {/* Main Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-400"></div>
                            {/* Tick Marks */}
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
