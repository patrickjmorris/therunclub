"use server";

import { fetchLinkPreviews } from "@/app/api/link-preview/actions";
import { cache } from "react";

// Cache the fetch operation so we don't make duplicate requests
const preloadLinkPreviews = cache((urls: string[]) => {
	return fetchLinkPreviews(urls);
});

export async function preloadLinks(urls: string[]) {
	return preloadLinkPreviews(urls);
}

export async function LinkPreviewPreloader({ urls }: { urls: string[] }) {
	if (urls.length > 0) {
		preloadLinks(urls);
	}
	return null;
}
