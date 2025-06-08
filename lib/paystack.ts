import { Paystack } from "paystack-sdk";

if (!process.env.PAYSTACK_SECRET_KEY) {
	throw new Error(
		"PAYSTACK_SECRET_KEY is missing from environmental variables"
	);
}

export const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);
