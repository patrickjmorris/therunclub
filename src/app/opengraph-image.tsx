import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				padding: 96,
				background: "#0a0a0a",
				color: "#fafafa",
			}}
		>
			<div style={{ fontSize: 96, fontWeight: 700 }}>{siteConfig.name}</div>
			<div style={{ fontSize: 40, marginTop: 24, color: "#a3a3a3" }}>
				Running podcasts, videos, athletes, and races
			</div>
		</div>,
		size,
	);
}
