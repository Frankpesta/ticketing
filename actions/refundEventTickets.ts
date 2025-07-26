"use server";
import { paystack } from "@/lib/paystack";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function refundEventTickets(eventId: Id<"events">) {
	const convex = getConvexClient();

	// Get event details
	const event = await convex.query(api.events.getEventById, { eventId });
	if (!event) throw new Error("Event not found");

	// Get event owner's Paystack connect ID
	const paystackConnectId = await convex.query(
		api.users.getUsersPaystackSubaccountId,
		{ userId: event.userId }
	);

	if (!paystackConnectId) {
		throw new Error("Paystack connect ID not found");
	}

	// Get all valid tickets for this event
	const tickets = await convex.query(api.tickets.getValidTicketsForEvent, {
		eventId,
	});

	// Process refunds for each ticket
	const results = await Promise.allSettled(
		tickets.map(async (ticket) => {
			try {
				if (!ticket.paymentIntentId) {
					throw new Error("Payment information not found");
				}

				// issue refund through stripe
				await paystack.refund.create({
					transaction: ticket.paymentIntentId,
				});

				// update ticket status to refunded
				await convex.mutation(api.tickets.updateTicketStatus, {
					ticketId: ticket._id,
					status: "refunded",
				});

				return { success: true, tickedId: ticket._id };
			} catch (error) {
				console.error(`Failed to refund ticket ${ticket._id}`, error);
				return { success: false, tickedId: ticket._id, error };
			}
		})
	);

	// Check if al refunds were successful
	const allSuccessful = results.every(
		(result) => result.status == "fulfilled" && result.value.success
	);

	if (!allSuccessful) {
		throw new Error("Some refunds failed. Please check the logs and try again");
	}

	// Cancel the event instead of deleting it
	await convex.mutation(api.events.cancelEvent, { eventId });

	return { success: true };
}
