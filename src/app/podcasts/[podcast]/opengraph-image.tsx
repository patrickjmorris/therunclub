import { ImageResponse } from "next/og";
import { getContent } from "@/lib/getContent";
import { OgImageTemplate } from "@/components/og/OgImageTemplate";

// Route segment config
// export const runtime = "edge"; // Removed to run on Node.js runtime
export const revalidate = 86400; // 1 day - Match the page's revalidate

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface PodcastOgImageProps {
	params: { podcast: string };
}

export default async function Image({ params }: PodcastOgImageProps) {
	const content = await getContent("podcast", params.podcast);

	if (!content) {
		// Return a default/error image or handle as needed
		// For now, returning a simple text response
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: 48,
					background: "#fefefe",
					color: "#333",
				}}
			>
				Podcast Not Found
			</div>,
			{
				...size,
			},
		);
	}

	// Use the OgImageTemplate component to generate the image
	return OgImageTemplate({
		title: content.title,
		imageUrl: content.coverImage,
	});
}
