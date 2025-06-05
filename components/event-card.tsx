"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStorageUrl } from "@/lib/utils";

const EventCard = ({ eventId }: { eventId: Id<"events"> }) => {
	const { user } = useUser();
	const router = useRouter();
	const event = useQuery(api.events.getEventById, { eventId });
	const availability = useQuery(api.events.getEventAvailability, { eventId });
	const userTicket = useQuery(api.tickets.getUserTicketForEvent, {
		eventId,
		userId: user?.id ?? "",
	});

	const queuePosition = useQuery(api.waitingList.getQueuePosition, {
		eventId,
		userId: user?.id ?? "",
	});

	const imageUrl = useStorageUrl(event?.imageStorageId);

	const isPastEvent =
		event?.eventDate !== undefined && event.eventDate < Date.now();

	const isEventOwner = user?.id === event?.userId;

	return <div>EventCard</div>;
};

export default EventCard;
