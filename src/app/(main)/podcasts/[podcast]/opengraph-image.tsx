import { ImageResponse } from "next/og";
import { getPodcastBySlug } from "@/db/queries";

export const runtime = "edge";
export const alt = "The Run Club - Podcast";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image({
	params,
}: {
	params: { podcast: string };
}) {
	const podcast = await getPodcastBySlug(params.podcast);
	if (!podcast) return new ImageResponse(<div>Podcast not found</div>);

	return new ImageResponse(
		<div
			style={{
				background: "linear-gradient(to bottom, #030712, #1F2937)",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: "40px",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "16px",
					marginBottom: "20px",
				}}
			>
				{/* Logo/Favicon */}
				<img
					src={`${
						process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
					}/favicon.ico`}
					alt="Logo"
					width="48"
					height="48"
					style={{
						borderRadius: "50%",
					}}
				/>
				<span
					style={{
						fontSize: 32,
						color: "white",
						fontWeight: "bold",
					}}
				>
					The Run Club
				</span>
			</div>

			{/* Main Content */}
			<div
				style={{
					display: "flex",
					width: "100%",
					gap: "32px",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{/* Podcast Image */}
				<img
					src={podcast.image || ""}
					alt={podcast.title}
					width="300"
					height="300"
					style={{
						borderRadius: "12px",
						boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
					}}
				/>

				{/* Podcast Info */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						maxWidth: "600px",
					}}
				>
					<span
						style={{
							fontSize: 24,
							color: "#9CA3AF",
							marginBottom: "8px",
						}}
					>
						Podcast Series
					</span>
					<span
						style={{
							fontSize: 48,
							fontWeight: "bold",
							color: "white",
							lineHeight: 1.2,
						}}
					>
						{podcast.title}
					</span>
				</div>
			</div>
		</div>,
		{
			...size,
			fonts: [
				{
					name: "Inter",
					data: await fetch(
						new URL("../../../../assets/Inter-Bold.ttf", import.meta.url),
					).then((res) => res.arrayBuffer()),
					weight: 700,
					style: "normal",
				},
			],
		},
	);
}
