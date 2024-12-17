import { createClient } from "@/utils/supabase/server";
import { db } from "@/db/client";
import { userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserRoleType = "admin" | "editor" | "user";

export class AuthError extends Error {
	constructor(
		message: string,
		public code: "UNAUTHORIZED" | "UNAUTHENTICATED",
	) {
		super(message);
		this.name = "AuthError";
	}
}

export async function getUserRole(): Promise<UserRoleType | null> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return null;

	const [userRole] = await db
		.select()
		.from(userRoles)
		.where(eq(userRoles.userId, user.id))
		.limit(1);

	if (!userRole) return "user";
	return userRole.role as UserRoleType;
}

export async function canManageContent(): Promise<boolean> {
	const role = await getUserRole();
	return role === "admin" || role === "editor";
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function requireRole<TState, TArgs extends any[]>(
	role: UserRoleType | UserRoleType[],
) {
	return function withAuth<T extends (...args: [...TArgs]) => Promise<TState>>(
		next: T,
	): T {
		return (async (...args: TArgs) => {
			const userRole = await getUserRole();
			if (!userRole) {
				throw new AuthError(
					"You must be logged in to perform this action",
					"UNAUTHENTICATED",
				);
			}

			const allowedRoles = Array.isArray(role) ? role : [role];
			if (!allowedRoles.includes(userRole)) {
				throw new AuthError(
					`You need ${allowedRoles.join(
						" or ",
					)} permissions to perform this action`,
					"UNAUTHORIZED",
				);
			}

			return next(...args);
		}) as T;
	};
}
