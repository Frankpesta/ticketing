"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { redirect, useParams } from "next/navigation";
import Ticket from "@/components/Ticket";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, Share2 } from "lucide-react";
import { useEffect } from "react";

export default function MyTicket() {
	const params = useParams();
	const { user } = useUser();
	const ticket = useQuery(api.tickets.getTicketWithDetails, {
		ticketId: params.id as Id<"tickets">,
	});

	useEffect(() => {
		if (!user) {
			redirect("/");
		}

		if (!ticket || ticket.userId !== user.id) {
			redirect("/tickets");
		}

		if (!ticket.event) {
			redirect("/tickets");
		}
	}, [user, ticket]);

	if (!ticket || !ticket.event) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="maz-w-3xl mx-auto">
				<div className="mb-8 space-y-3">
					{/* Navigation and Actions */}
					<div className="flex items-center justify-between">
						<Link
							href="/tickets"
							className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Tickets
						</Link>
						<div className="flex items-enter gap-4">
							<button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
								<Download className="h-4 w-4" />
								<span className="text-sm">Save</span>
							</button>
							<button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
								<Share2 className="h-4 w-4" />
								<span className="text-sm">Share</span>
							</button>
						</div>
					</div>

					{/* Event Info Summary */}
					<div
						className={`bg-white p-6 rounded-lg shadow-sm border ${ticket.event.is_cancelled ? "border-red-200" : "border-gray-100"}`}>
						<h1 className="text-2xl font-bold text-gray-900">
							{ticket.event.name}
						</h1>
						<p className="mt-1 text-gray-600">
							{new Date(ticket.event.eventDate).toLocaleDateString()} at{" "}
							{ticket.event.location}
						</p>
						<div className="mt-4 flex items-center gap-4">
							<span
								className={`px-3 py-1 rounded-full text-sm font-medium ${ticket.event.is_cancelled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
								{ticket.event.is_cancelled ? "Cancelled" : "Valid Ticket"}
							</span>
							<span className="text-sm text-gray-500">
								Purchased on {new Date(ticket.purchasedAt).toLocaleDateString()}
							</span>
						</div>
						{ticket.event.is_cancelled && (
							<p className="mt-2 text-sm text-red-600">
								This event has been cancelled. A refund will be processed
								automatically if it has not been done already
							</p>
						)}
					</div>
				</div>
				{/* Ticket Component */}
				<Ticket ticketId={ticket._id} />

				{/* Additional Information */}
				<div
					className={`mt-8 rounded-lg p-4 ${ticket.event.is_cancelled ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"} border`}>
					<h3
						className={`text-sm font-medium ${ticket.event.is_cancelled ? "text-red-900" : "text-blue-900"}`}>
						Need Help?
					</h3>
					<p
						className={`mt-1 text-sm ${ticket.event.is_cancelled ? "text-red-700" : "text-blue-700"}`}>
						If you have any questions or need assistance with your ticket,
						please contact our support team.
					</p>
				</div>
			</div>
		</div>
	);
}
