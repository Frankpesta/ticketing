"use server";

import { paystack } from "@/lib/paystack";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import baseUrl from "@/lib/baseUrl";
import { auth } from "@clerk/nextjs/server";
import { DURATIONS } from "@/convex/constants";

export type PaystackCheckoutMetaData = {
	eventId: Id<"events">;
	userId: string;
	waitingListId: Id<"waitingList">;
};

export async function createPaystackCheckoutSession({
	eventId,
}: {
	eventId: Id<"events">;
}) {
	const { userId } = await auth();
	if (!userId) throw new Error("Not authenticated");

	const convex = getConvexClient();

	// Get event details
	const event = await convex.query(api.events.getEventById, { eventId });
	if (!event) throw new Error("Event not found");

	// Get user by ID and his email
	const user = await convex.query(api.users.getUserById, { userId });
	if (!user) {
		throw new Error("User not found");
	}

	// Get waiting list entry
	const queuePosition = await convex.query(api.waitingList.getQueuePosition, {
		eventId,
		userId,
	});

	if (!queuePosition) {
		throw new Error("Queue position not found");
	}

	const paystackConnectId = await convex.query(
		api.users.getUsersPaystackSubaccountId,
		{ userId: event.userId }
	);

	if (!paystackConnectId) {
		throw new Error("Paystack subaccount Id not found for owner of the event");
	}

	if (!queuePosition.offerExpiresAt) {
		throw new Error("Ticket offer has no expiration date");
	}

	const metaData: PaystackCheckoutMetaData = {
		eventId,
		userId,
		waitingListId: queuePosition._id,
	};

	// create paystack checkout Session
	const session = await paystack.transaction.initialize({
		email: user.email,
		amount: Math.round(event.price * 100).toString(),
		subaccount: paystackConnectId,
		currency: "NGN",
		bearer: "subaccount",
		metadata: metaData,
		channels: [
			"card",
			"bank",
			"apple_pay",
			"ussd",
			"qr",
			"mobile_money",
			"bank_transfer",
			"eft",
		],
		callback_url: `${baseUrl}/tickets/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
	});
	return {
		secureUrl: session.data?.authorization_url,
		accessCode: session.data?.access_code,
		sessionId: session.data?.reference,
	};
}
