const WIKIMEDIA_API_BASE = "https://commons.wikimedia.org/w/api.php";
import { processAthleteImage } from "./image-utils";

interface WikimediaImageResponse {
	query?: {
		pages?: Record<
			string,
			{
				title: string;
				imageinfo?: Array<{
					url: string;
					descriptionurl: string;
					mime: string;
					size: number;
					width: number;
					height: number;
					thumbheight: number;
					thumbwidth: number;
					thumburl: string;
				}>;
			}
		>;
	};
}

interface WikimediaSearchResponse {
	query?: {
		search?: Array<{
			title: string;
			snippet: string;
		}>;
	};
}

export async function searchAthleteImage(name: string): Promise<string | null> {
	try {
		// First, search for the athlete's name in Wikimedia Commons
		const searchParams = new URLSearchParams({
			action: "query",
			list: "search",
			srsearch: `${name} athlete`,
			srnamespace: "6", // File namespace
			format: "json",
			origin: "*",
			srlimit: "10",
			srqiprofile: "popular_inclinks_pv",
		});

		const searchResponse = await fetch(
			`${WIKIMEDIA_API_BASE}?${searchParams.toString()}`,
		);
		const searchData: WikimediaSearchResponse = await searchResponse.json();

		if (!searchData.query?.search?.length) {
			console.log(`No images found for athlete: ${name}`);
			return null;
		}

		// Get the first image that matches our criteria
		const imageTitle = searchData.query.search[0].title;

		// Now fetch the actual image URL
		const imageParams = new URLSearchParams({
			action: "query",
			prop: "imageinfo",
			iiprop: "url|size|mime",
			iiurlwidth: "800",
			format: "json",
			origin: "*",
			titles: imageTitle,
		});

		const imageResponse = await fetch(
			`${WIKIMEDIA_API_BASE}?${imageParams.toString()}`,
		);
		const imageData: WikimediaImageResponse = await imageResponse.json();

		if (!imageData.query?.pages) {
			console.log(`No image data found for: ${imageTitle}`);
			return null;
		}

		// Get the first page (there should only be one)
		const page = Object.values(imageData.query.pages)[0];
		const imageInfo = page.imageinfo?.[0];

		if (!imageInfo) {
			console.log(`No image info found for: ${imageTitle}`);
			return null;
		}

		// Check if it's an image and not too large
		if (
			(imageInfo.mime === "image/jpeg" || imageInfo.mime === "image/png") &&
			imageInfo.width >= 400 &&
			imageInfo.width <= 4000 &&
			imageInfo.height >= 400 &&
			imageInfo.height <= 4000
		) {
			// Process the image with smart cropping
			return await processAthleteImage(imageInfo.url);
		}

		console.log(`Image did not meet criteria: ${imageTitle}`);
		return null;
	} catch (error) {
		console.error("Error fetching athlete image:", error);
		return null;
	}
}
