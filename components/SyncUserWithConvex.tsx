"use client";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";

function SyncUserWithConvex() {
	const { user } = useUser();
	const updateUser = useMutation(api.users.updateUser);

	useEffect(() => {
		if (!user) return;

		const syncUser = async () => {
			try {
				await updateUser({
					userId: user.id,
					email: user.emailAddresses[0]?.emailAddress || "",
					name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
				});
			} catch (error) {
				console.error("Error syncing user with Convex:", error);
			}
		};
		syncUser();
	}, [user, updateUser]);
	return null;
}

export default SyncUserWithConvex;
