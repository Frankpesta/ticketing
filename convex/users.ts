import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserById = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_user_id", (q) => q.eq("userId", userId))
			.first();

		if (!user) {
			throw new Error(`User with ID ${userId} not found`);
		}

		return user;
	},
});

export const getUsersPaystackSubaccountId = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("userId"), userId))
			.filter((q) => q.neq(q.field("stripeConnectId"), undefined))
			.first();
		return user?.stripeConnectId;
	},
});

export const updateOrCreateUsersPaystacksubaccountId = mutation({
	args: { userId: v.string(), stripeConnectId: v.string() },
	handler: async (ctx, { userId, stripeConnectId }) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_user_id", (q) => q.eq("userId", userId))
			.first();

		if (!user) {
			throw new Error("User not found!");
		}

		await ctx.db.patch(user._id, { stripeConnectId: stripeConnectId });
	},
});

export const updateUser = mutation({
	args: {
		userId: v.string(),
		email: v.string(),
		name: v.string(),
	},
	handler: async (ctx, { name, email, userId }) => {
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_user_id", (q) => q.eq("userId", userId))
			.first();

		if (existingUser) {
			// update existing user
			await ctx.db.patch(existingUser._id, {
				name,
				email,
			});
			return existingUser._id;
		}

		// create new user
		const newUserId = await ctx.db.insert("users", {
			userId,
			name,
			email,
			stripeConnectId: undefined,
		});
		return newUserId;
	},
});
