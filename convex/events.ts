import { v, ConvexError } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from "./constants";
import { internal } from "./_generated/api";

export const getAllEvents = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("events")
			.filter((q) => q.eq(q.field("is_cancelled"), undefined))
			.collect();
	},
});

export const getEventById = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, { eventId }) => {
		return await ctx.db.get(eventId);
	},
});

export const getEventAvailability = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, { eventId }) => {
		if (!eventId) throw new Error("Event not found");
		const event = await ctx.db.get(eventId);
		if (!event) throw new Error("Event not found");

		//count total purchased tickets
		const purchasedCount = await ctx.db
			.query("tickets")
			.withIndex("by_event", (q) => q.eq("eventId", eventId))
			.collect()
			.then(
				(tickets) =>
					tickets.filter(
						(t) =>
							t.status === TICKET_STATUS.VALID ||
							t.status === TICKET_STATUS.USED
					).length
			);

		// count current valid offers
		const now = Date.now();
		const activeOffers = await ctx.db
			.query("waitingList")
			.withIndex("by_event_status", (q) =>
				q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
			)
			.collect()
			.then(
				(entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
			);

		const totalReserved = purchasedCount + activeOffers;

		return {
			isSoldOut: totalReserved >= event.totalTickets,
			totalTickets: event.totalTickets,
			purchasedCount,
			activeOffers,
			remainingTickets: Math.max(0, event.totalTickets - totalReserved),
		};
	},
});

// Define the Ticket type if not already defined elsewhere
type Ticket = {
	status: string;
	// Add other fields as needed
};

// Helper function to check availability
// Reusable helper function
async function getAvailability(ctx: any, eventId: string) {
	const event = await ctx.db.get(eventId);
	if (!event) {
		throw new Error("Event not found");
	}

	// Count total purchased tickets
	const purchasedCount: number = await ctx.db
		.query("tickets")
		.withIndex("by_event", (q: any) => q.eq("eventId", eventId))
		.collect()
		.then(
			(tickets: Ticket[]) =>
				tickets.filter(
					(t: Ticket) =>
						t.status === TICKET_STATUS.VALID || t.status === TICKET_STATUS.USED
				).length
		);

	// Count current valid offers
	const now = Date.now();
	interface WaitingListEntry {
		eventId: string;
		userId: string;
		status: string;
		offerExpiresAt?: number;
		// Add other fields as needed
	}

	const activeOffers: number = await ctx.db
		.query("waitingList")
		.withIndex("by_event_status", (q: any) =>
			q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
		)
		.collect()
		.then(
			(entries: WaitingListEntry[]) =>
				entries.filter((e: WaitingListEntry) => (e.offerExpiresAt ?? 0) > now)
					.length
		);

	const availableSpots = event.totalTickets - (purchasedCount + activeOffers);

	return {
		available: availableSpots > 0,
		availableSpots,
		totalTickets: event.totalTickets,
		purchasedCount,
		activeOffers,
	};
}

// Define the query
export const checkAvailability = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, { eventId }) => {
		return await getAvailability(ctx, eventId);
	},
});

export const joinWaitingList = mutation({
	args: { eventId: v.id("events"), userId: v.string() },
	handler: async (ctx, { eventId, userId }) => {
		// Rate limit check
		// const status = await rateLimiter.limit(ctx, "queueJoin", { key: userId });
		// if(!status.ok) {
		// 	throw new ConvexError(`You've joined the waiting list too many times. Please wait ${Math.ceil(status.retryAfter / 60 * 1000)} minutes before trying again.`);
		// }

		// Checking if user already has an active entry in waiting list for this event.
		// Active means any status except EXPIRED
		const existingEntry = await ctx.db
			.query("waitingList")
			.withIndex("by_user_event", (q) =>
				q.eq("userId", userId).eq("eventId", eventId)
			)
			.filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED))
			.first();

		// Dont allow joining if already in the waiting list
		if (existingEntry) {
			throw new ConvexError(
				"You are already in the waiting list for this event."
			);
		}

		// Verify if event exists and is not cancelled
		const event = await ctx.db.get(eventId);
		if (!event || event.is_cancelled) {
			throw new ConvexError("Event not found or is cancelled.");
		}

		// Check if there are any available tickets right now
		const { available } = await getAvailability(ctx, eventId);
		if (available) {
			// if tickets are available, create an offer entry
			const waitingListId = await ctx.db.insert("waitingList", {
				eventId,
				userId,
				status: WAITING_LIST_STATUS.OFFERED,
				offerExpiresAt: DURATIONS.TICKET_OFFER,
			});

			//schedule a job to expire the offer after the offer duration
			await ctx.scheduler.runAfter(
				DURATIONS.TICKET_OFFER,
				internal.waitingList.expireTicketOffer,
				{ waitingListId, eventId }
			);
		} else {
			// if no tickets are available, create a waiting entry
			await ctx.db.insert("waitingList", {
				eventId,
				userId,
				status: WAITING_LIST_STATUS.WAITING,
			});
		}
		return {
			success: true,
			status: available
				? WAITING_LIST_STATUS.OFFERED
				: WAITING_LIST_STATUS.WAITING,
			message: available
				? "Ticket offered! Please complete your purchase within the next 15 minutes."
				: "You have been added to the waiting list. We will notify you if a ticket becomes available.",
		};
	},
});
