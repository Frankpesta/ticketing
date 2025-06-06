"use client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useStorageUrl(storageId: Id<"_storage"> | undefined) {
	return useQuery(api.storage.getUrl, storageId ? { storageId } : "skip");
}
