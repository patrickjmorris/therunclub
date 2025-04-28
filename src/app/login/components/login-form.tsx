"use client";

import { login } from "@/app/login/actions";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { ArrowRight } from "lucide-react";
import { useTransition, useState, useRef, FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

export function LoginForm() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error");
	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);
	const [clientError, setClientError] = useState<string | null>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault(); // Prevent default submission initially
		setClientError(null); // Clear previous client errors
		const formData = new FormData(event.currentTarget);

		if (!showPassword) {
			const email = formData.get("email") as string;
			const validation = emailSchema.safeParse(email);
			if (!validation.success) {
				setClientError(validation.error.errors[0]?.message || "Invalid email");
				return;
			}
			setShowPassword(true);
		} else {
			// Allow submission to server action when password is visible
			startTransition(() => {
				login(formData);
			});
		}
	};

	// Combine server error and client error for display
	const displayError = clientError || error;

	return (
		<form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
			{displayError && (
				<Alert variant="destructive" className="text-xs">
					<ExclamationTriangleIcon className="h-4 w-4" />
					<AlertDescription>
						{/* Prioritize client error message if present */}
						{clientError ||
							(error === "auth-code-error"
								? "There was an issue with Google Sign-In. Please try again."
								: error === "Invalid credentials"
								  ? "The email or password you entered is incorrect. Please try again."
								  : error === "Signup failed"
									  ? "There was a problem creating your account. This email might already be registered."
									  : "An error occurred. Please try again.")}
					</AlertDescription>
				</Alert>
			)}
			<div className="grid gap-2">
				<Label htmlFor="email" className="font-semibold">
					Email address
				</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="Enter your email address"
					required
					autoComplete="email"
					readOnly={showPassword} // Make email read-only after first step
					className={showPassword ? "text-muted-foreground" : ""}
				/>
			</div>

			<AnimatePresence>
				{showPassword && (
					<motion.div
						className="grid gap-2"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.3 }}
					>
						<Label htmlFor="password" className="font-semibold">
							Password
						</Label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="Enter your password"
							required
							autoFocus // Focus password field when it appears
							autoComplete="current-password"
							minLength={6}
						/>
						{/* Optional: Add forgot password link here if needed */}
					</motion.div>
				)}
			</AnimatePresence>

			<Button
				type="submit"
				className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
				disabled={isPending}
			>
				{isPending ? (
					<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
				) : (
					"Continue"
				)}
				{!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
			</Button>
		</form>
	);
}
