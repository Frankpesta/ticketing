"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import Spinner from "./Spinner";
import { WAITING_LIST_STATUS } from "@/convex/constants";
import { Clock, ClockIcon, OctagonIcon } from "lucide-react";
import { Button } from "./ui/button";

const JoinQueue = ({
	eventId,
	userId,
}: {
	eventId: Id<"events">;
	userId: string;
}) => {
	const joinWaitingList = useMutation(api.events.joinWaitingList);
	const queuePosition = useQuery(api.waitingList.getQueuePosition, {
		eventId,
		userId,
	});
	const userTicket = useQuery(api.tickets.getUserTicketForEvent, {
		eventId,
		userId,
	});
	const availability = useQuery(api.events.getEventAvailability, {
		eventId,
	});
	const event = useQuery(api.events.getEventById, {
		eventId,
	});
	const isEventOwner = event?.userId === userId;

	const handleJoinQueue = async () => {
		try {
			const result = await joinWaitingList({
				eventId,
				userId,
			});
			if (result.success) {
				toast.success("Successfully joined Waiting List!");
			}
		} catch (error) {
			if (
				error instanceof ConvexError &&
				error.message.includes("joined the waiting list too many times")
			) {
				toast.error(`${error.data}`);
			} else {
				console.error("Error joining waiting list:", error);
				toast.error("Failed to join Waiting List. Please try again later.");
			}
		}
	};

	if (queuePosition === undefined || availability === undefined || !event) {
		return <Spinner />;
	}

	if (userTicket) {
		return null;
	}

	const isPastEvent = event.eventDate < Date.now();

	return (
		<div>
			{(!queuePosition ||
				queuePosition.status === WAITING_LIST_STATUS.EXPIRED ||
				(queuePosition.status === WAITING_LIST_STATUS.OFFERED &&
					queuePosition.offerExpiresAt &&
					queuePosition.offerExpiresAt <= Date.now())) && (
				<>
					{isEventOwner ? (
						<div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg">
							<OctagonIcon className="w-5 h-5" />
							<span className="text-sm">
								You cannot buy a ticket for your own event.
							</span>
						</div>
					) : isPastEvent ? (
						<div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
							<ClockIcon className="w-5 h-5" />
							<span className="text-sm">This event has already passed.</span>
						</div>
					) : availability.purchasedCount >= availability.totalTickets ? (
						<div className="text-center p-4">
							<p className="text-lg font-semibold text-red-600">
								Sorry, this event is sold out.
							</p>
						</div>
					) : (
						<Button
							className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
							onClick={handleJoinQueue}
							disabled={isEventOwner || isPastEvent}>
							Buy Ticket
						</Button>
					)}
				</>
			)}
		</div>
	);
};

export default JoinQueue;
