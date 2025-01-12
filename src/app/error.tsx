"use client";

import { useEffect } from "react";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-[400px]">
			<h2 className="text-xl font-semibold mb-4">Something went wrong!</h2>
			<button
				type="button"
				className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
				onClick={() => reset()}
			>
				Try again
			</button>
		</div>
	);
}
