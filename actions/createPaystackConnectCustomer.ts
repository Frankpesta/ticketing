"use server";

import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { paystack } from "@/lib/paystack";
import axios from "axios";

interface CreateSubaccountParams {
	businessName: string;
	settlementBank: string;
	accountNumber: string;
	description: string;
}

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
	throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function createPaystackConnectCustomer(
	values: CreateSubaccountParams
) {
	console.log("createPaystackConnectCustomer called with:", values);
	const { userId } = await auth();
	if (!userId) {
		console.error("No userId found");
		throw new Error("User not authenticated!");
	}

	let existingPaystackConnectId;
	try {
		console.log("Querying Convex for user:", userId);
		existingPaystackConnectId = await convex.query(
			api.users.getUsersPaystackSubaccountId,
			{ userId }
		);
		console.log("Existing subaccount:", existingPaystackConnectId);
	} catch (error) {
		console.error("Convex query error:", error);
		throw new Error("Failed to check existing subaccount");
	}

	if (existingPaystackConnectId) {
		console.log("Returning existing subaccount:", existingPaystackConnectId);
		return { account: existingPaystackConnectId };
	}

	console.log("Creating Paystack subaccount with:", {
		business_name: values.businessName,
		settlement_bank: values.settlementBank,
		account_number: values.accountNumber,
		percentage_charge: 20,
		description: values.description,
	});
	let account;
	try {
		account = await paystack.subAccount.create({
			business_name: values.businessName,
			settlement_bank: values.settlementBank,
			account_number: values.accountNumber,
			percentage_charge: 20,
			description: values.description,
		});
		console.log("Paystack response:", account);
	} catch (error) {
		console.error("Paystack API error:", error);
		throw new Error("Failed to create Paystack subaccount");
	}

	try {
		await convex.mutation(api.users.updateOrCreateUsersPaystacksubaccountId, {
			userId,
			stripeConnectId: account.data?.subaccount_code || "",
		});
		console.log(
			"Convex updated with subaccount:",
			account.data?.subaccount_code
		);
	} catch (error) {
		console.error("Convex mutation error:", error);
		throw new Error("Failed to update subaccount");
	}

	return { account: account.data?.subaccount_code };
}

export async function getPaystackBanks() {
	const response = await axios.get("https://api.paystack.co/bank", {
		headers: {
			Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
		},
	});

	if (!response.data.status) {
		throw new Error("Failed to fetch banks from Paystack");
	}

	// Return array of banks [{ name, code, ... }]
	return response.data.data;
}
