"use client";

import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { signInWithGoogle } from "../actions";
import { useTransition } from "react";
import Google from "./google";
export function GoogleSignInButton() {
	const [isPending, startTransition] = useTransition();

	const handleSignIn = () => {
		startTransition(() => {
			signInWithGoogle();
		});
	};

	return (
		<Button
			type="button" // Important: use type="button" to prevent default form submission if nested
			variant="outline"
			className="w-full"
			onClick={handleSignIn}
			disabled={isPending}
		>
			{isPending ? (
				<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
			) : (
				<Google className="mr-2 h-4 w-4" />
			)}
			Sign in with Google
		</Button>
	);
}
