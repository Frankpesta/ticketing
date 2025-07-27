"use client";

import EventCard from "@/components/event-card";
import JoinQueue from "@/components/join-queue";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useStorageUrl } from "@/lib";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { CalendarDays, MapPin, Ticket, User } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";

const EventPage = () => {
	const params = useParams();
	const { user } = useUser();

	// Only call query if params.id exists
	const event = params.id
		? useQuery(api.events.getEventById, { eventId: params.id as Id<"events"> })
		: null;
	const availability = params.id
		? useQuery(api.events.getEventAvailability, {
				eventId: params.id as Id<"events">,
			})
		: null;

	const imageUrl = useStorageUrl(event?.imageStorageId);

	// Show loading spinner while event or availability is not loaded
	if (!event || !availability) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Event Details */}
			<div className="max-w-full mx-auto px-4 sm:px-2 lg:px-8 py-12">
				<div className="bg-white rounded-xl shadow-sm overflow-hidden">
					{/* Event Image */}
					{imageUrl && (
						<div className="aspect-[21/9] relative w-full">
							<Image
								src={imageUrl}
								alt={event.name}
								fill
								className="object-cover"
								priority
							/>
						</div>
					)}
					{/* Event Details Indepth */}
					<div className="p-8">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
							{/* Left column - Event Details */}
							<div className="space-y-8">
								<div>
									<h1 className="text-4xl font-bold text-gray-900 mb-4">
										{event.name}
									</h1>
									<p className="text-lg text-gray-600">{event.description}</p>
								</div>
								<div className="grid grid-cols-2 gap-6">
									<div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
										<div className="flex items-center text-gray-600 mb-1">
											<CalendarDays className="w-5 h-5 mr-2 text-blue-600" />
											<span className="text-sm font-medium">Date</span>
										</div>
										<p className="text-gray-900">
											{new Date(event.eventDate).toLocaleString()}
										</p>
									</div>

									<div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
										<div className="flex items-center text-gray-600 mb-1">
											<MapPin className="w-5 h-5 mr-2 text-blue-600" />
											<span className="text-sm font-medium">Location</span>
										</div>
										<p className="text-gray-900">{event.location}</p>
									</div>

									<div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
										<div className="flex items-center text-gray-600 mb-1">
											<Ticket className="w-5 h-5 mr-2 text-blue-600" />
											<span className="text-sm font-medium">Price</span>
										</div>
										<p className="text-gray-900">₦{event.price.toFixed(2)}</p>
									</div>
									<div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
										<div className="flex items-center text-gray-600 mb-1">
											<User className="w-5 h-5 mr-2 text-blue-600" />
											<span className="text-sm font-medium">Availability</span>
										</div>
										<p className="text-gray-900">
											{availability.totalTickets - availability.purchasedCount}{" "}
											/ {availability.totalTickets} left
										</p>
									</div>
								</div>
								{/* Additional Event Information */}

								<div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
									<h1 className="text-lg font-semibold text-blue-900 mb-2">
										Event Information
									</h1>
									<ul className="space-y-2 text-blue-700">
										<li>
											* Please arrive early for the event for ticket scanning
											and checking.
										</li>
										<li>* Tickets are non-refundable</li>
										<li>* Age restriction: 10+</li>
									</ul>
								</div>
							</div>
							{/* Right Column - Purchase ticket Card */}
							<div>
								<div className="sticky top-8 space-y-4">
									<EventCard eventId={params.id as Id<"events">} />

									{user ? (
										<JoinQueue
											eventId={params.id as Id<"events">}
											userId={user.id}
										/>
									) : (
										<SignInButton>
											<Button className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
												Sign in to buy tickets.
											</Button>
										</SignInButton>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EventPage;
