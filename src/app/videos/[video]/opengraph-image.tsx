import { ImageResponse } from "next/og";
import { getContent } from "@/lib/getContent";
import { OgImageTemplate } from "@/components/og/OgImageTemplate";

// Route segment config
// export const runtime = "edge";
export const revalidate = 604800; // 1 week - Match the page's revalidate

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface VideoOgImageProps {
	params: { video: string }; // video is the video ID
}

export default async function Image({ params }: VideoOgImageProps) {
	const content = await getContent("video", params.video);

	if (!content) {
		// Return a default/error image
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
				Video Not Found
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
