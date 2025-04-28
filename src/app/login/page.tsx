import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./components/login-form";
import { GoogleSignInButton } from "./components/google-sign-in-button";
import { SeparatorWithText } from "@/components/ui/separator-with-text";
import { Button } from "@/components/ui/button";

function AuthFormSkeleton() {
	return (
		<div className="mx-auto max-w-sm w-full space-y-6">
			{/* Title/Subtitle Skeletons */}
			<div className="space-y-2 text-center">
				<Skeleton className="h-8 w-3/4 mx-auto" />
				<Skeleton className="h-4 w-full mx-auto" />
			</div>
			{/* Google Button Skeleton */}
			<Skeleton className="h-10 w-full" />
			{/* Separator Skeleton */}
			<Skeleton className="h-5 w-full" />
			{/* Email Input Skeleton */}
			<div className="space-y-2">
				<Skeleton className="h-4 w-1/4" />
				<Skeleton className="h-10 w-full" />
			</div>
			{/* Continue Button Skeleton */}
			<Skeleton className="h-10 w-full" />
			{/* Passkey Skeleton */}
			<Skeleton className="h-10 w-full" />
		</div>
	);
}

export default function LoginPage() {
	return (
		<div className="flex min-h-screen w-full items-center justify-center px-4 py-12">
			<div className="mx-auto max-w-sm w-full space-y-6">
				<div className="space-y-2 text-center">
					<h1 className="text-3xl font-bold">Sign in to The Run Club</h1>
					<p className="text-muted-foreground">
						Welcome back! Please sign in to continue
					</p>
				</div>
				<Suspense fallback={<AuthFormSkeleton />}>
					<GoogleSignInButton />
					<SeparatorWithText>or</SeparatorWithText>
					<LoginForm />
					<Button variant="link" className="w-full text-primary font-semibold">
						Use passkey instead
					</Button>
				</Suspense>
			</div>
		</div>
	);
}
