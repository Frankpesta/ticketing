"use client";

import {
	CalendarDays,
	Edit,
	Ticket,
	Ban,
	InfoIcon,
	Banknote,
} from "lucide-react";
import Link from "next/link";
import { useStorageUrl } from "@/lib";
import Image from "next/image";
import { Doc } from "@/convex/_generated/dataModel";
import { Metrics } from "@/convex/events";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import SellerEventCard from "@/components/seller-event-card";

export default function SellerEventList() {
	const { user } = useUser();
	const events = useQuery(api.events.getSellerEvents, {
		userId: user?.id ?? "",
	});

	if (!events) return null;

	const upcomingEvents = events.filter((e) => e.eventDate > Date.now());
	const pastEvents = events.filter((e) => e.eventDate <= Date.now());

	return (
		<div className="mx-auto space-y-4">
			{/* Upcoming Events */}
			<div>
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Upcoming Events
				</h2>
				<div className="grid grid-cols-1 gap-6">
					{upcomingEvents.map((event) => (
						<SellerEventCard key={event._id} event={event} />
					))}
					{upcomingEvents.length === 0 && (
						<p className="text-gray-500">No upcoming events.</p>
					)}
				</div>
			</div>

			{/* Past Events */}
			<div>
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Past Events</h2>
				<div className="grid grid-cols-1 gap-6">
					{pastEvents.map((event) => (
						<SellerEventCard key={event._id} event={event} />
					))}
					{pastEvents.length === 0 && (
						<p className="text-gray-500">No upcoming events.</p>
					)}
				</div>
			</div>
		</div>
	);
}
