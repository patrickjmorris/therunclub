"use client";
import Link from "next/link";
import { login, signup } from "@/app/login/actions";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export function LoginForm() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error");

	return (
		<Card className="mx-auto max-w-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Login</CardTitle>
				<CardDescription>
					Enter your email below to login to your account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4">
					{error && (
						<Alert variant="destructive">
							<ExclamationTriangleIcon className="h-4 w-4" />
							<AlertDescription>
								{error === "Invalid credentials"
									? "The email or password you entered is incorrect. Please try again."
									: error === "Signup failed"
									  ? "There was a problem creating your account. This email might already be registered."
									  : "An error occurred. Please try again."}
							</AlertDescription>
						</Alert>
					)}
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="m@example.com"
							required
							autoComplete="email"
						/>
					</div>
					<div className="grid gap-2">
						<div className="flex items-center">
							<Label htmlFor="password">Password</Label>
							<Link
								href="/reset-password"
								className="ml-auto inline-block text-sm underline"
							>
								Forgot your password?
							</Link>
						</div>
						<Input
							id="password"
							name="password"
							type="password"
							required
							autoComplete="current-password"
							minLength={6}
						/>
						<p className="text-xs text-muted-foreground">
							Password must be at least 6 characters long
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<Button type="submit" formAction={login} className="w-full">
							Login
						</Button>
						<Button
							type="submit"
							formAction={signup}
							variant="outline"
							className="w-full"
						>
							Sign up
						</Button>
					</div>
				</form>
			</CardContent>
			<CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
				<p>
					By signing up, you agree to our{" "}
					<Link href="/terms" className="underline">
						Terms of Service
					</Link>{" "}
					and{" "}
					<Link href="/privacy" className="underline">
						Privacy Policy
					</Link>
				</p>
				<p>
					Already have an account?{" "}
					<Link href="/login" className="font-medium underline">
						Sign in
					</Link>
				</p>
			</CardFooter>
		</Card>
	);
}
