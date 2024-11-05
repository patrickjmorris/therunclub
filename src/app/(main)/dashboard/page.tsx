import { protectedRoute } from "@/lib/auth/protected-route";

export default async function DashboardPage() {
	const session = await protectedRoute();

	return (
		<div>
			<h1>Welcome {session.user.email}</h1>
			{/* Rest of your dashboard content */}
		</div>
	);
}
