import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from "./constants";
import { internal } from "./_generated/api";

export const getQueuePosition = query({
	args: {
		eventId: v.id("events"),
		userId: v.string(),
	},
	handler: async (ctx, { eventId, userId }) => {
		// Get entry for this specific user and event combination
		const entry = await ctx.db
			.query("waitingList")
			.withIndex("by_user_event", (q) =>
				q.eq("userId", userId).eq("eventId", eventId)
			)
			.filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED))
			.first();

		if (!entry) return null;

		// Get total number of people ahead in time
		const peopleAhead = await ctx.db
			.query("waitingList")
			.withIndex("by_event_status", (q) => q.eq("eventId", eventId))
			.filter((q) =>
				q.and(
					q.lt(q.field("_creationTime"), entry._creationTime),
					q.or(
						q.eq(q.field("status"), WAITING_LIST_STATUS.WAITING),
						q.eq(q.field("status"), WAITING_LIST_STATUS.OFFERED)
					)
				)
			)
			.collect()
			.then((entries) => entries.length);

		return {
			...entry,
			position: peopleAhead + 1, // +1 for the current user
		};
	},
});

// Internal mutation to expire a single offer and process the queue for next persona
// Called by a scheduled job when offer timer expires
export const expireTicketOffer = internalMutation({
	args: {
		waitingListId: v.id("waitingList"),
		eventId: v.id("events"),
	},
	handler: async (ctx, { waitingListId, eventId }) => {
		const offer = await ctx.db.get(waitingListId);
		if (!offer || offer.status !== WAITING_LIST_STATUS.OFFERED) return;

		await ctx.db.patch(waitingListId, {
			status: WAITING_LIST_STATUS.EXPIRED,
		});

		await processQueueLogic(ctx, eventId);
	},
});

// Mutation to process the waiting list and offer tickets to the next eligible users
// Checks current availability considering purchased tickets and active offers

// Reusable helper function for availability (from previous request)
async function getAvailability(ctx: any, eventId: string) {
	const event = await ctx.db.get(eventId);
	if (!event) {
		throw new Error("Event not found");
	}

	// Count total purchased tickets
	interface Ticket {
		_id: string;
		eventId: string;
		status: string;
		// Add other ticket fields as needed
	}

	const purchasedCount = await ctx.db
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
		_id: string;
		eventId: string;
		userId: string;
		status: string;
		offerExpiresAt?: number;
		_creationTime: number;
		// Add other fields as needed
	}

	const activeOffers = await ctx.db
		.query("waitingList")
		.withIndex("by_event_status", (q: any) =>
			q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
		)
		.collect()
		.then(
			(entries: WaitingListEntry[]) =>
				entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
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

// Define the checkAvailability query
export const checkAvailability = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, { eventId }) => {
		return await getAvailability(ctx, eventId);
	},
});

// Reusable helper function for processQueue logic
async function processQueueLogic(ctx: any, eventId: string) {
	const event = await ctx.db.get(eventId);
	if (!event) throw new Error("Event not found");

	// Reuse getAvailability to calculate available spots
	const { availableSpots } = await getAvailability(ctx, eventId);

	if (availableSpots <= 0) return;

	// Get next users in line
	interface WaitingUser {
		_id: string;
		eventId: string;
		userId: string;
		status: string;
		offerExpiresAt?: number;
		_creationTime: number;
		// Add other fields as needed
	}

	const waitingUsers: WaitingUser[] = await ctx.db
		.query("waitingList")
		.withIndex("by_event_status", (q: any) =>
			q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.WAITING)
		)
		.order("asc")
		.take(availableSpots);

	// Create time-limited offers for selected users
	const now = Date.now();
	for (const user of waitingUsers) {
		// Update the waiting list entry to OFFERED status
		await ctx.db.patch(user._id, {
			status: WAITING_LIST_STATUS.OFFERED,
			offerExpiresAt: now + DURATIONS.TICKET_OFFER,
		});

		// Schedule the expiration job for this offer
		await ctx.scheduler.runAfter(
			DURATIONS.TICKET_OFFER,
			"waitingList:expireTicketOffer", // Use string reference for the internal function
			{
				waitingListId: user._id,
				eventId,
			}
		);
	}
}

// Define the processQueue mutation
export const processQueue = mutation({
	args: { eventId: v.id("events") },
	handler: async (ctx, { eventId }) => {
		await processQueueLogic(ctx, eventId);
	},
});

export const releaseTicket = mutation({
	args: {
		eventId: v.id("events"),
		waitingListId: v.id("waitingList"),
	},
	handler: async (ctx, { eventId, waitingListId }) => {
		const entry = await ctx.db.get(waitingListId);
		if (!entry || entry.status !== WAITING_LIST_STATUS.OFFERED) {
			throw new Error("No valid ticket offer found");
		}

		// Mark the entry as expired
		await ctx.db.patch(waitingListId, {
			status: WAITING_LIST_STATUS.EXPIRED,
		});

		//process the queue to offer ticket to next person
		await processQueueLogic(ctx, eventId);
	},
});
