import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { Skeleton } from "@/components/ui/skeleton";

function LoginFormSkeleton() {
	return (
		<div className="mx-auto max-w-sm w-full space-y-4">
			<Skeleton className="h-8 w-3/4" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}

export default function LoginPage() {
	return (
		<div className="flex h-screen w-full items-center justify-center px-4">
			<Suspense fallback={<LoginFormSkeleton />}>
				<LoginForm />
			</Suspense>
		</div>
	);
}
