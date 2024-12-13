"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorFeaturedChannel({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error(error);
	}, [error]);

	return (
		<div className="container mx-auto p-4 max-w-2xl">
			<Card className="p-6">
				<div className="flex flex-col items-center text-center space-y-4">
					<AlertCircle className="h-12 w-12 text-destructive" />
					<h2 className="text-xl font-semibold">Something went wrong!</h2>
					<p className="text-muted-foreground">
						We couldn't load the featured channel. Please try again.
					</p>
					<Button onClick={reset} variant="outline" className="gap-2">
						<RefreshCw className="h-4 w-4" />
						Try again
					</Button>
				</div>
			</Card>
		</div>
	);
}
