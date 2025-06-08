"use server";
import { paystack } from "@/lib/paystack";

export type AccountStatus = {
	active: boolean;
	subaccount_code: string;
	id: number;
	business_name: string;
	account_number: number;
	settlement_bank: string;
	is_verified: boolean;
};

export async function getPaystackConnectAccountStatus(
	stripeConnectId: string
): Promise<AccountStatus> {
	if (!stripeConnectId) {
		throw new Error("No paystack Subaccount code provided");
	}

	try {
		const account = await paystack.subAccount.fetch(stripeConnectId);

		return {
			active: account.data?.active ?? false,
			subaccount_code: account.data?.subaccount_code ?? "",
			id: account.data?.id ?? 0,
			business_name: account.data?.business_name ?? "",
			account_number: Number(account.data?.account_number ?? 0),
			settlement_bank: account.data?.settlement_bank ?? "",
			is_verified: account.data?.is_verified ?? false,
		};
	} catch (error) {
		console.log(`Error fetching paystack subaccount details - ${error}`);
		throw new Error("Failed to fetch Paystack account status");
	}
}
