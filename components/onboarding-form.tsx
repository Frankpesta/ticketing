"use client";

import React, { useEffect, useState } from "react";
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

export function OnboardingForm() {
	const [banks, setBanks] = useState<Bank[]>([]);
	const [loadingBanks, setLoadingBanks] = useState(true);
	const [error, setError] = useState<string | null>(null);
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

	async function onSubmit(values: FormValues) {
		setError(null);
		setSuccess(null);
		startTransition(async () => {
			try {
				const result = await createPaystackConnectCustomer(values);
				if (result?.account) {
					setSuccess("Account successfully created! You can now proceed.");
					form.reset();
				}
			} catch (err: any) {
				setError(err.message || "An error occurred during onboarding.");
			}
		});
	}

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-6 bg-white rounded-lg shadow-md">
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
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<FormField
						control={form.control}
						name="businessName"
						rules={{
							required: "Business name is required",
							minLength: { value: 3, message: "Minimum 3 characters" },
						}}
						render={({ field, fieldState }) => (
							<FormItem>
								<FormLabel>Business Name</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Acme Inc."
										className={fieldState.invalid ? "border-red-500" : ""}
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
												className={fieldState.invalid ? "border-red-500" : ""}>
												<SelectValue placeholder="Select Bank" />
											</SelectTrigger>
											<SelectContent>
												{banks.map((bank) => (
													<SelectItem key={bank.code} value={bank.code}>
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
										className={fieldState.invalid ? "border-red-500" : ""}
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
							minLength: { value: 10, message: "Minimum 10 characters" },
						}}
						render={({ field, fieldState }) => (
							<FormItem>
								<FormLabel>Business Description</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Brief description of your business"
										className={fieldState.invalid ? "border-red-500" : ""}
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
	);
}
