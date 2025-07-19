import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUrl = query({
	args: {
		storageId: v.id("_storage"),
	},
	handler: async (ctx, { storageId }) => {
		return await ctx.storage.getUrl(storageId);
	},
});

export const generateUploadUrl = mutation(async (ctx) => {
	return await ctx.storage.generateUploadUrl();
});

export const updateEventImage = mutation({
	args: {
		storageId: v.union(v.id("_storage"), v.null()),
		eventId: v.id("events"),
	},
	handler: async (ctx, { storageId, eventId }) => {
		await ctx.db.patch(eventId, {
			imageStorageId: storageId ?? undefined,
		});
	},
});

export const deleteImage = mutation({
	args: {
		storageId: v.id("_storage"),
	},
	handler: async (ctx, { storageId }) => {
		await ctx.storage.delete(storageId);
	},
});
