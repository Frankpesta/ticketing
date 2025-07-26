import { headers } from "next/headers";
import { paystack } from "@/lib/paystack";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Paystack } from "paystack-sdk";
import crypto from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(request: Request) {
	const headersList = headers();
	// Get Paystack signature header
	const signature = request.headers.get("x-paystack-signature");
	const body = await request.text();
	// Verify the signature using Paystack secret key
	const hash = crypto
		.createHmac("sha512", PAYSTACK_SECRET_KEY)
		.update(body)
		.digest("hex");
	if (hash !== signature) {
		return new Response("Invalid signature", { status: 400 });
	}

	const event = JSON.parse(body);
	const convex = getConvexClient();

	if (event.event === "charge.success") {
		console.log("Processing charge success event:", event);
		const { data } = event;
		console.log(data);

		try {
			const result = await convex.mutation(api.events.purchaseTicket, {
				eventId: data.metadata.eventId,
				userId: data.metadata.userId,
				waitingListId: data.metadata.waitingListId,
				paymentInfo: {
					amount: data.amount,
					paymentIntentId: data.reference,
				},
			});
			console.log("Purchase ticket mutation completed:", result);
		} catch (error) {
			console.error("Error processing purchase ticket mutation:", error);
			return new Response("Error processing purchase ticket", { status: 500 });
		}
	}
	return new Response(null, { status: 200 });
}
