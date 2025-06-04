"use client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React from "react";
import Spinner from "./Spinner";

const EventList = () => {
	const events = useQuery(api.events.getAllEvents);

	if (!events) {
		return (
			<div className="min-h-[400px] flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const upcomingEvents = events
		.filter((event) => event.eventDate > Date.now())
		.sort((a, b) => a.eventDate - b.eventDate);

	const pastEvents = events
		.filter((event) => event.eventDate <= Date.now())
		.sort((a, b) => b.eventDate - a.eventDate);
	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* Header  */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
					<p>Discover & book tickets for amazing events</p>
				</div>
			</div>
		</div>
	);
};

export default EventList;
