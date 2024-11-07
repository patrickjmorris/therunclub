import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Running Videos | The Run Club",
	description: "Watch the latest running videos from top creators",
	openGraph: {
		title: "Running Videos | The Run Club",
		description: "Watch the latest running videos from top creators",
		type: "website",
	},
};

export default function VideosLayout({
	children,
	modal,
}: {
	children: React.ReactNode;
	modal: React.ReactNode;
}) {
	return (
		<div>
			{children}
			{modal}
		</div>
	);
}
