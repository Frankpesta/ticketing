"use client";
import { Button } from "./ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStorageUrl } from "@/lib";
import { CalendarIcon } from "lucide-react";

const formSchema = z.object({
	name: z.string().min(1, "Event name is required"),
	description: z.string().min(15, "Description is required"),
	location: z.string().min(5, "Location is required"),
	eventDate: z
		.date()
		.min(
			new Date(new Date().setHours(0, 0, 0, 0)),
			"Event date must be in the future"
		),
	price: z.number().min(0, "Price must be 0 or greater"),
	totalTickets: z.number().min(1, "Must have at least 1 ticket"),
});

type formData = z.infer<typeof formSchema>;

interface InitialEventsData {
	_id: Id<"events">;
	name: string;
	description: string;
	location: string;
	eventDate: number;
	price: number;
	totalTickets: number;
	imageStorageId?: Id<"_storage">;
}

interface EventFormProps {
	mode: "create" | "edit";
	initialData?: InitialEventsData;
}

// Utility: format Date object to MM/DD/YYYY string
function formatDate(date: Date | null): string {
	if (!date) return "";
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	const yyyy = date.getFullYear();
	return `${mm}/${dd}/${yyyy}`;
}

// Utility: parse MM/DD/YYYY string to Date object or null
function parseDate(str: string): Date | null {
	const [mm, dd, yyyy] = str.split("/");
	if (!mm || !dd || !yyyy) return null;
	const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
	return isNaN(date.getTime()) ? null : date;
}

// CalendarPopover Component: Custom calendar UI for date picking
function CalendarPopover({
	selectedDate,
	onSelectDate,
	minDate,
	onClose,
}: {
	selectedDate: Date | null;
	onSelectDate: (date: Date) => void;
	minDate?: Date;
	onClose: () => void;
}) {
	const [currentMonth, setCurrentMonth] = useState<Date>(
		selectedDate ? new Date(selectedDate) : new Date()
	);

	useEffect(() => {
		// Reset to selectedDate month if selectedDate changes
		if (selectedDate) setCurrentMonth(new Date(selectedDate));
	}, [selectedDate]);

	// Helpers
	const startOfMonth = new Date(
		currentMonth.getFullYear(),
		currentMonth.getMonth(),
		1
	);
	const endOfMonth = new Date(
		currentMonth.getFullYear(),
		currentMonth.getMonth() + 1,
		0
	);
	const startDay = startOfMonth.getDay(); // Sunday=0
	const daysInMonth = endOfMonth.getDate();

	// Generate calendar grid days including previous month's trailing days
	const calendarDays: { date: Date; currentMonth: boolean }[] = [];

	// Fill previous month's days to align first day of current month
	for (let i = startDay - 1; i >= 0; i--) {
		const day = new Date(
			currentMonth.getFullYear(),
			currentMonth.getMonth(),
			-i
		);
		calendarDays.push({ date: day, currentMonth: false });
	}
	// Fill current month days
	for (let d = 1; d <= daysInMonth; d++) {
		calendarDays.push({
			date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d),
			currentMonth: true,
		});
	}
	// Fill next month's days to complete weeks (42 cells = 6 weeks)
	while (calendarDays.length % 7 !== 0) {
		const lastDate = calendarDays[calendarDays.length - 1].date;
		const nextDate = new Date(lastDate);
		nextDate.setDate(lastDate.getDate() + 1);
		calendarDays.push({ date: nextDate, currentMonth: false });
	}

	// Check if date is disabled (before minDate)
	function isDisabled(date: Date) {
		if (!minDate) return false;
		return (
			date <
			new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
		);
	}

	// Check if two dates are the same day
	function isSameDay(d1: Date, d2: Date) {
		return (
			d1.getFullYear() === d2.getFullYear() &&
			d1.getMonth() === d2.getMonth() &&
			d1.getDate() === d2.getDate()
		);
	}

	// Handlers
	function handlePrevMonth() {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
		);
	}
	function handleNextMonth() {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
		);
	}

	// Keyboard accessibility: close on Escape
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	return (
		<div
			className="absolute z-50 mt-2 w-72 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
			role="dialog"
			aria-modal="true">
			{/* Header with month/year and navigation */}
			<div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
				<button
					type="button"
					onClick={handlePrevMonth}
					aria-label="Previous month"
					className="p-1 rounded hover:bg-gray-100">
					<svg
						className="w-5 h-5 text-gray-600"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				<div className="text-lg font-semibold text-gray-700">
					{currentMonth.toLocaleString("default", { month: "long" })}{" "}
					{currentMonth.getFullYear()}
				</div>
				<button
					type="button"
					onClick={handleNextMonth}
					aria-label="Next month"
					className="p-1 rounded hover:bg-gray-100">
					<svg
						className="w-5 h-5 text-gray-600"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>

			{/* Weekday headers */}
			<div className="grid grid-cols-7 gap-1 px-4 pt-2 text-xs font-medium text-gray-500 uppercase select-none">
				{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
					<div key={day} className="text-center">
						{day}
					</div>
				))}
			</div>

			{/* Dates grid */}
			<div className="grid grid-cols-7 gap-1 px-4 pb-4 pt-1">
				{calendarDays.map(({ date, currentMonth: isCurrentMonth }, idx) => {
					const disabled = isDisabled(date);
					const isToday = isSameDay(date, new Date());
					const isSelected = selectedDate
						? isSameDay(date, selectedDate)
						: false;
					return (
						<button
							key={idx}
							type="button"
							onClick={() => !disabled && onSelectDate(date)}
							disabled={disabled}
							className={`
                relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                ${disabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-blue-100"}
                ${!isCurrentMonth ? "text-gray-400" : ""}
                ${isSelected ? "bg-blue-600 text-white" : ""}
                ${isToday && !isSelected ? "border border-blue-500" : ""}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              `}
							aria-current={isToday ? "date" : undefined}
							aria-selected={isSelected}>
							{date.getDate()}
							{isSelected && <span className="sr-only">Selected</span>}
							{isToday && !isSelected && <span className="sr-only">Today</span>}
						</button>
					);
				})}
			</div>
		</div>
	);
}

const EventForm = ({ mode, initialData }: EventFormProps) => {
	const { user } = useUser();
	const createEvent = useMutation(api.events.create);
	const updateEvent = useMutation(api.events.updateEvent);
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const currentImageUrl = useStorageUrl(initialData?.imageStorageId);

	// image upload
	const imageInput = useRef<HTMLInputElement>(null);
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [showCalendar, setShowCalendar] = useState(false);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
	const updateEventImage = useMutation(api.storage.updateEventImage);
	const deleteImage = useMutation(api.storage.deleteImage);

	const [removedCurrentImage, setRemovedCurrentImage] = useState(false);

	const form = useForm<formData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			location: initialData?.location ?? "",
			eventDate: initialData ? new Date(initialData.eventDate) : new Date(),
			price: initialData?.price ?? 0,
			totalTickets: initialData?.totalTickets ?? 1,
		},
	});

	async function onSubmit(values: formData) {
		if (!user?.id) return;
		startTransition(async () => {
			try {
				let imageStorageId = null;

				// handle image change
				if (selectedImage) {
					// Upload new image
					imageStorageId = await handleImageUpload(selectedImage);
				}

				// Handle image deletion/update in edit mode
				if (mode === "edit" && initialData?.imageStorageId) {
					// Delete old image from storage
					await deleteImage({ storageId: initialData.imageStorageId });
				}

				if (mode === "create") {
					const eventId = await createEvent({
						...values,
						userId: user.id,
						eventDate: values.eventDate.getTime(),
					});
					if (imageStorageId && eventId) {
						await updateEventImage({
							eventId: eventId as Id<"events">,
							storageId: imageStorageId as Id<"_storage">,
						});
					}
					router.push(`/event/${eventId}`);
					toast.success("Event created successfully!");
				} else {
					// Ensure initial data exists
					if (!initialData) {
						toast.error("Initial Event data is required for updates");
						return;
					}

					// update event details
					await updateEvent({
						eventId: initialData._id,
						...values,
						eventDate: values.eventDate.getTime(),
					});

					// update image - this will handle both new image upload and removal of current image
					if (imageStorageId || removedCurrentImage) {
						await updateEventImage({
							eventId: initialData._id,
							// if we have a new image, use its ID, otherwise if we are removing the image, pass null
							storageId: imageStorageId
								? (imageStorageId as Id<"_storage">)
								: null,
						});
					}
					toast.success("Event updated successfully!");
					router.push(`/event/${initialData._id}`);
				}
			} catch (error) {
				console.error("Error submitting form: ", error);
				toast.error("Failed to submit form. Please try again.");
			}
		});
	}

	async function handleImageUpload(file: File): Promise<string | null> {
		try {
			const postUrl = await generateUploadUrl();
			const result = await fetch(postUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			const { storageId } = await result.json();
			return storageId;
		} catch (error) {
			console.error("Failed to upload image: ", error);
			return null;
		}
	}

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	// Close calendar if clicking outside
	const calendarRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				calendarRef.current &&
				!calendarRef.current.contains(event.target as Node)
			) {
				setShowCalendar(false);
			}
		}
		if (showCalendar) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showCalendar]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="px-4">
				<div className="space-y-6">
					{/* Event Name */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-lg font-semibold text-gray-700">
									Event Name
								</FormLabel>
								<FormControl>
									<Input
										placeholder="Enter event name"
										{...field}
										className="w-full rounded-md border border-gray-300 px-4 py-2 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
									/>
								</FormControl>
								<FormMessage className="text-red-600 mt-1" />
							</FormItem>
						)}
					/>

					{/* Event Description */}
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-lg font-semibold text-gray-700">
									Event Description
								</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Enter event description"
										{...field}
										className="w-full rounded-md border border-gray-300 px-4 py-2 placeholder-gray-400 text-gray-900 resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
									/>
								</FormControl>
								<FormMessage className="text-red-600 mt-1" />
							</FormItem>
						)}
					/>

					{/* Event Location */}
					<FormField
						control={form.control}
						name="location"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-lg font-semibold text-gray-700">
									Event Location
								</FormLabel>
								<FormControl>
									<Input
										placeholder="Enter event location"
										{...field}
										className="w-full rounded-md border border-gray-300 px-4 py-2 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
									/>
								</FormControl>
								<FormMessage className="text-red-600 mt-1" />
							</FormItem>
						)}
					/>

					{/* Event Date with Custom Date Picker */}
					<FormField
						control={form.control}
						name="eventDate"
						render={({ field }) => {
							// Convert Date to formatted string for input
							const inputValue = field.value ? formatDate(field.value) : "";

							// Handle manual input change with validation
							function handleInputChange(
								e: React.ChangeEvent<HTMLInputElement>
							) {
								const val = e.target.value;
								// Allow only digits and slashes and max length 10 (MM/DD/YYYY)
								if (/^[0-9/]*$/.test(val) && val.length <= 10) {
									field.onChange(parseDate(val));
								}
							}

							return (
								<FormItem className="relative" ref={calendarRef}>
									<FormLabel className="text-lg font-semibold text-gray-700 flex items-center">
										Event Date
										<CalendarIcon
											className="ml-2 w-5 h-5 text-gray-400"
											aria-hidden="true"
										/>
									</FormLabel>
									<FormControl>
										<div className="relative">
											<input
												type="text"
												placeholder="MM/DD/YYYY"
												className={`w-full rounded-md border border-gray-300 px-4 py-2 pr-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
													form.formState.errors.eventDate
														? "border-red-600 focus:ring-red-600"
														: ""
												}`}
												value={inputValue}
												onChange={handleInputChange}
												onFocus={() => setShowCalendar(true)}
												aria-invalid={!!form.formState.errors.eventDate}
												aria-describedby="eventDate-error"
												autoComplete="off"
											/>
											<button
												type="button"
												onClick={() => setShowCalendar((v) => !v)}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
												aria-label="Toggle calendar">
												<CalendarIcon className="w-5 h-5" />
											</button>
											{showCalendar && (
												<CalendarPopover
													selectedDate={field.value}
													onSelectDate={(date) => {
														field.onChange(date);
														setShowCalendar(false);
													}}
													minDate={new Date()}
													onClose={() => setShowCalendar(false)}
												/>
											)}
										</div>
									</FormControl>
									<FormMessage
										id="eventDate-error"
										className="text-red-600 mt-1"
									/>
								</FormItem>
							);
						}}
					/>

					{/* Price Per Ticket */}
					<FormField
						control={form.control}
						name="price"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-lg font-semibold text-gray-700">
									Price Per Ticket
								</FormLabel>
								<FormControl>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">
											&#8358;
										</span>
										<Input
											type="number"
											{...field}
											onChange={(e) =>
												field.onChange(
													Number(e.target.value) < 0
														? 0
														: Number(e.target.value)
												)
											}
											className="pl-8 w-full rounded-md border border-gray-300 px-4 py-2 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
										/>
									</div>
								</FormControl>
								<FormMessage className="text-red-600 mt-1" />
							</FormItem>
						)}
					/>

					{/* Total Tickets Available */}
					<FormField
						control={form.control}
						name="totalTickets"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-lg font-semibold text-gray-700">
									Total Tickets Available
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										{...field}
										onChange={(e) =>
											field.onChange(
												Number(e.target.value) < 1 ? 1 : Number(e.target.value)
											)
										}
										className="w-full rounded-md border border-gray-300 px-4 py-2 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
										min={1}
										step={1}
										inputMode="numeric"
									/>
								</FormControl>
								<FormMessage className="text-red-600 mt-1" />
							</FormItem>
						)}
					/>

					{/* Image Upload */}
					<div className="space-y-2">
						<label
							htmlFor="image-upload"
							className="block text-lg font-semibold text-gray-700">
							Event Image
						</label>
						<div className="mt-1 flex items-center gap-4">
							{imagePreview || (currentImageUrl && !removedCurrentImage) ? (
								<div className="relative w-32 aspect-square bg-gray-100 rounded-lg shadow-sm overflow-hidden">
									<Image
										src={imagePreview || currentImageUrl || ""}
										alt="Preview"
										fill
										className="object-contain rounded-lg"
									/>
									<button
										type="button"
										onClick={() => {
											setSelectedImage(null);
											setImagePreview(null);
											setRemovedCurrentImage(true);
											if (imageInput.current) {
												imageInput.current.value = "";
											}
										}}
										className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
										aria-label="Remove image">
										&times;
									</button>
								</div>
							) : (
								<Input
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									ref={imageInput}
									className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
								/>
							)}
						</div>
					</div>
				</div>

				<Button
					type="submit"
					disabled={isPending}
					className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-900 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
					{isPending ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							{mode === "create" ? "Creating Event..." : "Updating Event..."}
						</>
					) : mode === "create" ? (
						"Create Event"
					) : (
						"Update Event"
					)}
				</Button>
			</form>
		</Form>
	);
};

export default EventForm;
