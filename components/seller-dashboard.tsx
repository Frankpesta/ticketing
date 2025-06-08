"use client";

import {
	AccountStatus,
	getPaystackConnectAccountStatus,
} from "@/actions/getPaystackAccountStatus";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import Link from "next/link";
import { CalendarDays, CheckCheckIcon, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import {
	getPaystackBanks,
	createPaystackConnectCustomer,
} from "@/actions/createPaystackConnectCustomer";
import { toast } from "sonner";

interface Bank {
	name: string;
	code: string;
}

interface FormValues {
	businessName: string;
	settlementBank: string; // bank code
	accountNumber: string;
	description: string;
}

const SellerDashboard = () => {
	const [accountCreatePending, setAccountCreatePending] = useState(false);
	const [accountLinkCreatePending, setAccountLinkCreatePending] =
		useState(false);
	const [error, setError] = useState(false);
	const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
		null
	);
	const [banks, setBanks] = useState<Bank[]>([]);
	const [loadingBanks, setLoadingBanks] = useState(true);
	const [errorb, setErrorB] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const form = useForm<FormValues>({
		defaultValues: {
			businessName: "",
			settlementBank: "",
			accountNumber: "",
			description: "",
		},
	});

	const router = useRouter();
	const { user } = useUser();
	const payStackConnectId = useQuery(api.users.getUsersPaystackSubaccountId, {
		userId: user?.id || "",
	});

	const isReadyToAcceptPayments =
		accountStatus?.active && accountStatus.account_number;
	// Fetch banks on mount
	useEffect(() => {
		async function fetchBanks() {
			try {
				setLoadingBanks(true);
				const bankList = await getPaystackBanks();
				const uniqueBanks: Bank[] = bankList.filter(
					(bank: Bank, index: number, self: Bank[]) =>
						index === self.findIndex((b: Bank) => b.code === bank.code)
				);
				setBanks(uniqueBanks);
			} catch (err) {
				setErrorB("Failed to load banks. Please try again later.");
			} finally {
				setLoadingBanks(false);
			}
		}
		fetchBanks();
	}, []);

	useEffect(() => {
		if (payStackConnectId) {
			fetchAccountStatus();
		}
	}, [payStackConnectId]);

	if (payStackConnectId === undefined) {
		return <Spinner />;
	}

	const handleManageAccount = async () => {};

	const fetchAccountStatus = async () => {
		if (payStackConnectId) {
			try {
				const status = await getPaystackConnectAccountStatus(payStackConnectId);
				setAccountStatus(status);
			} catch (error) {
				console.error("Error fetching account status: ", error);
			}
		}
	};

	async function onSubmit(values: FormValues) {
		setErrorB(null);
		setSuccess(null);
		try {
			const result = await createPaystackConnectCustomer(values);

			if (result?.account) {
				setSuccess("Account successfully created! You can now proceed.");
				setAccountCreatePending(false);
				toast.success("Account created successfully.");
				form.reset();
			}
		} catch (err: any) {
			setError(err.message || "An error occurred during onboarding.");
			setAccountCreatePending(false);
		}
	}

	return (
		<div className="max-w-full lg:max-w-3xl mx-auto p-6">
			<div className="bg-white rounded-lg shadow-lg overflow-hidden">
				{/* header section */}
				<div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-6 text-white">
					<h2 className="text-2xl font-bold">Seller Dashboard</h2>
					<p className="text-blue-200 mt-2">
						Manage your seller profile and payment settings.
					</p>
				</div>
			</div>
			{/* main content */}
			{isReadyToAcceptPayments && (
				<>
					<div className="bg-white p-8 rounded-lg">
						<h2 className="text-2xl font-semibold text-gray-900 mb-6">
							Sell tickets for your events
						</h2>
						<p className="text-gray-600 mb-8">
							List your tickets for sale and manage listings
						</p>

						<div className="bg-white rounded-xl shadow border border-gray-200 p-4">
							<div className="flex justify-center gap-4">
								<Link
									href={"/seller/new-event"}
									className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
									<Plus className="w-5 h-5" />
									Create Event
								</Link>
								<Link
									href={"/seller/events"}
									className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
									<CalendarDays className="w-5 h-5" />
									View My Events
								</Link>
							</div>
						</div>
					</div>

					<hr className="my-8" />
				</>
			)}

			<div className="p-6">
				{/* Account Creation Section */}
				{!payStackConnectId && !accountCreatePending && (
					<div className="text-center py-8">
						<h3 className="text-xl font-semibold mb-4">
							Start Accepting Payments
						</h3>
						<p className="text-gray-600 mb-6">
							Create your seller account to start receiving payments securely
							through Paystack.
						</p>

						<Dialog>
							<DialogTrigger className="py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 transition-colors text-white mt-2 rounded-lg">
								Create Seller Account
							</DialogTrigger>
							<DialogContent title="onboarding form">
								<div className="mx-auto max-w-full space-y-6 p-6 bg-white rounded-lg shadow-md">
									<div className="space-y-2 text-center">
										<h1 className="text-3xl font-bold">Business Onboarding</h1>
										<p className="text-muted-foreground">
											Complete your business profile to start accepting payments
										</p>
									</div>

									{error && (
										<Alert variant="destructive" className="mb-4">
											<AlertDescription>{error}</AlertDescription>
										</Alert>
									)}

									{success && (
										<Alert variant="default" className="mb-4">
											<AlertDescription>{success}</AlertDescription>
										</Alert>
									)}

									<Form {...form}>
										<form
											onSubmit={form.handleSubmit(onSubmit)}
											className="space-y-6">
											<FormField
												control={form.control}
												name="businessName"
												rules={{
													required: "Business name is required",
													minLength: {
														value: 3,
														message: "Minimum 3 characters",
													},
												}}
												render={({ field, fieldState }) => (
													<FormItem>
														<FormLabel>Business Name</FormLabel>
														<FormControl>
															<Input
																{...field}
																placeholder="Acme Inc."
																className={
																	fieldState.invalid ? "border-red-500" : ""
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="settlementBank"
												rules={{ required: "Please select a bank" }}
												render={({ field, fieldState }) => (
													<FormItem>
														<FormLabel>Bank Name</FormLabel>
														<FormControl>
															{loadingBanks ? (
																<div className="p-3 bg-gray-100 rounded text-center text-gray-500">
																	Loading banks...
																</div>
															) : (
																<Select
																	onValueChange={field.onChange}
																	value={field.value}
																	disabled={loadingBanks}
																	defaultValue="">
																	<SelectTrigger
																		className={
																			fieldState.invalid ? "border-red-500" : ""
																		}>
																		<SelectValue placeholder="Select Bank" />
																	</SelectTrigger>
																	<SelectContent>
																		{banks.map((bank) => (
																			<SelectItem
																				key={bank.code}
																				value={bank.code}>
																				{bank.name}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															)}
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="accountNumber"
												rules={{
													required: "Account number is required",
													minLength: {
														value: 10,
														message: "Account number must be 10 digits",
													},
													maxLength: {
														value: 10,
														message: "Account number must be 10 digits",
													},
													pattern: {
														value: /^[0-9]+$/,
														message: "Account number must be numeric",
													},
												}}
												render={({ field, fieldState }) => (
													<FormItem>
														<FormLabel>Account Number</FormLabel>
														<FormControl>
															<Input
																{...field}
																placeholder="0123456789"
																maxLength={10}
																className={
																	fieldState.invalid ? "border-red-500" : ""
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="description"
												rules={{
													required: "Description is required",
													minLength: {
														value: 10,
														message: "Minimum 10 characters",
													},
												}}
												render={({ field, fieldState }) => (
													<FormItem>
														<FormLabel>Business Description</FormLabel>
														<FormControl>
															<Input
																{...field}
																placeholder="Brief description of your business"
																className={
																	fieldState.invalid ? "border-red-500" : ""
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<Button
												type="submit"
												disabled={isPending || loadingBanks}
												className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg py-4 text-sm transition-all">
												{isPending ? (
													<Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" />
												) : (
													"Complete Onboarding"
												)}
											</Button>
										</form>
									</Form>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				)}
				{/* Account Status Section */}
				{payStackConnectId && accountStatus && (
					<div className="space-y-6">
						{/* Status Card */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Account Status Card */}
							<div className="bg-gra-50 rounded-lg p-4">
								<h3 className="text-sm font-medium text-gray-500">
									Account Status
								</h3>
								<div className="mt-2 flex items-center">
									<div
										className={`w-3 h-3 rounded-full mr-2 ${accountStatus.is_verified ? "bg-green-500" : "bg-yellow-500"}`}
									/>

									<span className="text-lg font-semibold">
										{accountStatus.is_verified
											? "Verified"
											: "Pending Verification"}
									</span>
								</div>
							</div>
							{/* Payment Status Card */}
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-sm font-medium text-gray-500">
									Payment Capability
								</h3>
								<div className="mt-2 space-y-1">
									<div className="flex items-center">
										<CheckCheckIcon
											className={`w-5 h-5 ${accountStatus.active ? "text-green-500" : "text-gray-400"}`}
										/>
										<span className="ml-2">
											{accountStatus.active
												? "Can accept payments"
												: "Cannot accept payments yet"}
										</span>
									</div>
								</div>

								<div className="mt-2 space-y-1">
									<div className="flex items-center">
										<CheckCheckIcon
											className={`w-5 h-5 ${accountStatus.settlement_bank ? "text-green-500" : "text-gray-400"}`}
										/>
										<span className="ml-2">
											{accountStatus.settlement_bank
												? `Bank: ${accountStatus.settlement_bank}`
												: "No settlement Bank yet. "}
										</span>
									</div>
								</div>

								<div className="mt-2 space-y-1">
									<div className="flex items-center">
										<CheckCheckIcon
											className={`w-5 h-5 ${accountStatus.account_number ? "text-green-500" : "text-gray-400"}`}
										/>
										<span className="ml-2">
											{accountStatus.account_number
												? `Account Number: ${accountStatus.account_number}`
												: "No account number present. "}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default SellerDashboard;
