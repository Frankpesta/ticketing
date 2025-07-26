"use client";

import React, { Suspense, ReactElement } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import EventCard from "@/components/event-card";
import { Search as SearchIcon } from "lucide-react";
import Spinner from "@/components/Spinner";

function Search(): ReactElement {
	const searchParams = useSearchParams();
	const query = searchParams.get("q") || "";
	const searchResults = useQuery(api.events.search, { searchTerm: query });

	if (!searchResults) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Spinner />
			</div>
		);
	}

	const upcomingEvents = searchResults
		.filter((event) => event.eventDate > Date.now())
		.sort((a, b) => b.eventDate - a.eventDate);

	const pastEvents = searchResults
		.filter((event) => event.eventDate <= Date.now())
		.sort((a, b) => b.eventDate - a.eventDate);

	return (
		<div className="min-h-screen bg-gray-50 py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center gap-3 mb-8">
					<SearchIcon className="w-6 h-6 text-blue-600" />
					<div>
						<h1 className="text-2xl font-bold text-gray-800">
							Search Results for "{query}":
						</h1>
						<p className="text-gray-600">Found {searchResults.length} events</p>
					</div>
				</div>

				{searchResults.length === 0 && (
					<div className="text-center py-12 bg-white rounded-xl shadow-sm">
						<SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
						<h3>No events found</h3>
						<p className="text-gray-600 mt-1">
							Try searching for a different term or check back later or browse
							our list of events.
						</p>
					</div>
				)}

				{upcomingEvents.length > 0 && (
					<div>
						<h2 className="text-xl font-semibold text-gray-900 mb-6">
							Upcoming Events
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{upcomingEvents.map((event) => (
								<EventCard key={event._id} eventId={event._id} />
							))}
						</div>
					</div>
				)}

				{pastEvents.length > 0 && (
					<div className="mt-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-6">
							Past Events
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{pastEvents.map((event) => (
								<EventCard key={event._id} eventId={event._id} />
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default function SearchPage(): ReactElement {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-screen">
					<Spinner />
				</div>
			}>
			<Search />
		</Suspense>
	);
}
