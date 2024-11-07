"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
	error: Error;
	reset: () => void;
}

export function VideoErrorBoundary({ error, reset }: ErrorBoundaryProps) {
	useEffect(() => {
		console.error("Video Error:", error);
	}, [error]);

	return (
		<div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
			<h3 className="text-lg font-semibold mb-2">Error Loading Video</h3>
			<p className="text-muted-foreground mb-4">
				There was a problem loading this video. Please try again.
			</p>
			<Button onClick={reset} variant="outline">
				Try Again
			</Button>
		</div>
	);
}
