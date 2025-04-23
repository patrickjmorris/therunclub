import { ImageResponse } from "next/og";

// Fonts need to be fetched within the ImageResponse function
const fetchFont = async (fontFamily: string, weight: number) => {
	const url = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weight}&display=swap`;
	const css = await fetch(url, {
		headers: {
			// Make sure it returns woff2
			"User-Agent":
				"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_8; en-us) AppleWebKit/530.19.2 (KHTML, like Gecko) Version/4.0.2 Safari/530.19",
		},
	}).then((res) => res.text());
	const resource = css.match(/src: url\((.+)\) format\('(woff2)'\)/);
	if (!resource?.[1]) {
		throw new Error(`Could not find font resource for ${fontFamily} ${weight}`);
	}
	return fetch(resource[1]).then((res) => res.arrayBuffer());
};

const fetchImage = async (imageUrl: string) => {
	try {
		const response = await fetch(imageUrl);
		if (!response.ok) {
			console.error(
				`Failed to fetch image: ${response.status} ${response.statusText}`,
			);
			return null;
		}
		return Buffer.from(await response.arrayBuffer());
	} catch (error) {
		console.error("Error fetching image:", error);
		return null;
	}
};

interface OgImageTemplateProps {
	title: string;
	imageUrl?: string | null; // URL for the main content image
}

// Base URL for assets in the public folder
// Ensure NEXT_PUBLIC_BASE_URL is set in your environment variables
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function OgImageTemplate({
	title,
	imageUrl,
}: OgImageTemplateProps): Promise<ImageResponse> {
	// Fetch fonts and images in parallel
	const [interBoldData, racewayRegularData, imageDataBuffer, logoDataBuffer] =
		await Promise.all([
			fetchFont("Inter", 700),
			fetchFont("Raceway", 400), // Assuming Raceway is needed for the logo text alternative if logo fails
			imageUrl ? fetchImage(imageUrl) : Promise.resolve(null),
			fetchImage(`${BASE_URL}/run-club-logo-trans.png`),
		]);

	const imageElement = imageDataBuffer ? (
		<img
			src={imageDataBuffer.toString("base64")}
			alt=""
			style={{
				width: "500px", // Fixed width for the image container part
				height: "500px",
				objectFit: "cover", // Crop image to fit the square
			}}
			tw="rounded-lg"
		/>
	) : (
		<div tw="w-[500px] h-[500px] bg-gray-300 rounded-lg flex items-center justify-center text-gray-500">
			No Image
		</div> // Placeholder if no image
	);

	const logoElement = logoDataBuffer ? (
		<img
			src={logoDataBuffer.toString("base64")}
			alt="The Run Club Logo"
			style={{ width: "200px", height: "auto" }}
		/>
	) : (
		<div style={{ fontFamily: "Raceway", fontSize: "32px" }}>The Run Club</div> // Text fallback for logo
	);

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				fontFamily: "Inter",
				backgroundColor: "#B697CF", // Purple background
			}}
			tw="flex items-center justify-center p-16" // Padding around the content
		>
			{/* Left side: Image */}
			<div tw="flex w-1/2 h-full items-center justify-center pr-8">
				{imageElement}
			</div>

			{/* Right side: Title and Logo */}
			<div tw="flex flex-col w-1/2 h-full justify-between text-white pl-8">
				{/* Title - centered vertically */}
				<div tw="flex grow items-center">
					<h1
						style={{
							fontSize: "72px", // Starting font size
							fontWeight: 700, // Bold
							lineHeight: 1.2,
							maxHeight: "80%", // Limit title height
							overflow: "hidden",
						}}
						tw="text-ellipsis"
					>
						{title}
					</h1>
				</div>

				{/* Logo - bottom right */}
				<div tw="flex justify-end items-end">
					<div style={{ fontFamily: "Raceway" }}>{logoElement}</div>
				</div>
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: "Inter",
					data: interBoldData,
					weight: 700,
					style: "normal",
				},
				{
					name: "Raceway",
					data: racewayRegularData,
					weight: 400,
					style: "normal",
				},
			],
		},
	);
}
