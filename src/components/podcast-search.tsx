"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PodcastSearchResult } from "@/lib/podcast-index";

function convertToCSV(results: PodcastSearchResult[]): string {
	// Create CSV header
	const header = ["title", "url", "categories"].join(",");

	// Create CSV rows
	const rows = results.map((podcast) => {
		const categories = podcast.categories
			? Object.values(podcast.categories).join(";")
			: "";

		return [
			// Escape quotes and wrap fields in quotes to handle commas
			`"${podcast.title.replace(/"/g, '""')}"`,
			`"${podcast.url.replace(/"/g, '""')}"`,
			`"${categories.replace(/"/g, '""')}"`,
		].join(",");
	});

	return [header, ...rows].join("\n");
}

function downloadCSV(content: string, filename: string) {
	const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);

	link.setAttribute("href", url);
	link.setAttribute("download", filename);
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

export function PodcastSearch() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<PodcastSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	async function handleSearch(e: React.FormEvent) {
		e.preventDefault();
		if (!query.trim()) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/podcast-search?q=${encodeURIComponent(query)}`,
			);
			const data = await response.json();
			setResults(data.results);
		} catch (error) {
			console.error("Search failed:", error);
		} finally {
			setIsLoading(false);
		}
	}

	function handleDownloadCSV() {
		const csv = convertToCSV(results);
		const timestamp = new Date().toISOString().split("T")[0];
		downloadCSV(csv, `podcast-search-${timestamp}.csv`);
	}

	return (
		<div className="space-y-4">
			<form onSubmit={handleSearch} className="flex gap-2">
				<Input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search podcasts..."
					className="flex-1"
				/>
				<Button type="submit" disabled={isLoading}>
					{isLoading ? "Searching..." : "Search"}
				</Button>
			</form>

			{results.length > 0 && (
				<div className="flex justify-end">
					<Button onClick={handleDownloadCSV} variant="outline" size="sm">
						Download CSV
					</Button>
				</div>
			)}

			<div className="space-y-4">
				{results.map((podcast) => (
					<div key={podcast.id} className="p-4 border rounded-lg">
						<div className="flex gap-4">
							{podcast.image && (
								<img
									src={podcast.image}
									alt={podcast.title}
									className="w-20 h-20 object-cover rounded"
								/>
							)}
							<div>
								<h3 className="font-bold">{podcast.title}</h3>
								{podcast.author && (
									<p className="text-sm text-gray-600">{podcast.author}</p>
								)}
								{podcast.description && (
									<p className="text-sm mt-2">{podcast.description}</p>
								)}
								{podcast.categories && (
									<p className="text-sm mt-2">
										Categories: {Object.values(podcast.categories).join(", ")}
									</p>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
