"use client";

import { useCallback } from "react";

export function useShare() {
	return useCallback(async (videoId: string) => {
		try {
			const shareData = {
				title: "Check out this video",
				url: `https://youtube.com/watch?v=${videoId}`,
			};

			if (typeof navigator !== "undefined" && navigator.share) {
				await navigator.share(shareData);
			} else {
				await navigator.clipboard.writeText(shareData.url);
			}
		} catch (err) {
			console.error("Error sharing:", err);
		}
	}, []);
}
