"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

const JoinQueue = ({
	eventId,
	userId,
}: {
	eventId: Id<"events">;
	userId: Id<"users">;
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

	return <div>JoinQueue</div>;
};

export default JoinQueue;
