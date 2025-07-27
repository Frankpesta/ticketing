"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import ReleaseTicket from "./release-ticket";
import { createPaystackCheckoutSession } from "@/actions/createPaystackCheckout";

const PurchaseTicket = ({ eventId }: { eventId: Id<"events"> }) => {
	const router = useRouter();
	const { user } = useUser();
	const queuePosition = useQuery(api.waitingList.getQueuePosition, {
		eventId: eventId,
		userId: user?.id ?? "",
	});

	const [timeRemaining, setTimeRemaining] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const offerExpiresAt = queuePosition?.offerExpiresAt ?? 0;
	const isExpired = Date.now() > offerExpiresAt;

	useEffect(() => {
		const calculateTimeRemaining = () => {
			// Check if offer is expired or offerExpiresAt is invalid
			if (isExpired || !offerExpiresAt || offerExpiresAt <= Date.now()) {
				setTimeRemaining("Expired");
				return;
			}

			const diff = offerExpiresAt - Date.now();
			const totalSeconds = Math.floor(diff / 1000);
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;

			if (minutes > 0) {
				setTimeRemaining(
					`${minutes} minute${minutes !== 1 ? "s" : ""} ${seconds} second${seconds !== 1 ? "s" : ""}`
				);
			} else {
				setTimeRemaining(`${seconds} second${seconds !== 1 ? "s" : ""}`);
			}
		};

		calculateTimeRemaining(); // Run immediately
		const interval = setInterval(calculateTimeRemaining, 1000);

		return () => clearInterval(interval); // Cleanup interval on unmount
	}, [offerExpiresAt, isExpired]);

	// Stripe checkout
	const handlePurchase = async () => {
		if (!user) return;

		try {
			setIsLoading(true);
			const { secureUrl } = await createPaystackCheckoutSession({
				eventId,
			});
			if (secureUrl) {
				router.push(secureUrl);
			}
		} catch (error) {
		} finally {
			setIsLoading(false);
		}
	};

	if (!user || !queuePosition || queuePosition.status !== "offered") {
		return null;
	}

	return (
		<div className="bg-white py-6 rounded-xl shadow-lg border-amber-200">
			<div className="spacey-y-4">
				<div className="bg-white rounded-lg py-6 px-2 border border-gray-200">
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
								<Ticket className="w-6 h-6 text-amber-600" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-gray-900">
									Ticket Reserved
								</h3>
								<p className="text-sm text-gray-500">
									Expires in {timeRemaining}
								</p>
							</div>
						</div>
						<div className="text-sm text-gray-600 leading-relaxed">
							A ticket has been reserved for you. Please complete your purchase
							within the next {timeRemaining} to secure your spot.
						</div>
					</div>
				</div>

				<Button
					onClick={handlePurchase}
					disabled={isExpired || isLoading}
					className="mt-4 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-lg shadow hover:from-amber-600 hover:to-amber-700 transform hover:scale-[1.02] transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100">
					{isLoading
						? "Redirecting to checkout..."
						: "Purchase Your Ticket Now →"}
				</Button>

				<div className="mt-4">
					<ReleaseTicket eventId={eventId} waitingListId={queuePosition._id} />
				</div>
			</div>
		</div>
	);
};

export default PurchaseTicket;
