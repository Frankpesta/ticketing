"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { refundEventTickets } from "@/actions/refundEventTickets";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CancelEventButton({
	eventId,
}: {
	eventId: Id<"events">;
}) {
	const [isCancelling, setIsCancelling] = useState(false);
	const cancelEvent = useMutation(api.events.cancelEvent);
	const router = useRouter();

	const handleCancel = async () => {
		if (
			!confirm(
				"Are you sure you want to cancel this event? All tickets will be refunded and event will be cancelled permanently"
			)
		) {
			return;
		}

		setIsCancelling(true);
		try {
			await refundEventTickets(eventId);
			await cancelEvent({ eventId });
			toast("All tickets have been refunded successully");
			router.push(`/seller/events`);
		} catch (error) {
			console.error("Failed to cancel Event:", error);
			toast("Failed to cancel event. Please try again");
		} finally {
			setIsCancelling(false);
		}
	};
	return (
		<button
			onClick={handleCancel}
			disabled={isCancelling}
			className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
			<Ban className="w-4 h-4" />
			<span>{isCancelling ? "Processing" : "Cancel Event"}</span>
		</button>
	);
}
