import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";
export const revalidate = 86400; // Revalidate daily or as needed

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Base URL for assets in the public folder
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const logoUrl = `${BASE_URL}/run-club-logo-trans.png`;

// Helper to fetch image data
const fetchImage = async (imageUrl: string): Promise<ArrayBuffer | null> => {
	try {
		const response = await fetch(imageUrl);
		if (!response.ok) {
			console.error(
				`Failed to fetch image: ${response.status} ${response.statusText}`,
			);
			return null;
		}
		return response.arrayBuffer();
	} catch (error) {
		console.error("Error fetching image:", error);
		return null;
	}
};

export default async function Image() {
	const logoData = await fetchImage(logoUrl);

	const logoElement = logoData ? (
		<img
			src={Buffer.from(logoData).toString("base64")}
			alt="The Run Club Logo"
			style={{ width: "400px", height: "auto" }} // Adjust size as needed
		/>
	) : (
		<div style={{ fontSize: "48px", color: "white" }}>The Run Club</div> // Text fallback
	);

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#B697CF", // Brand purple background
			}}
		>
			{logoElement}
		</div>,
		{
			...size,
			// You might need to fetch fonts here if your text fallback uses custom fonts
			// fonts: [],
		},
	);
}
