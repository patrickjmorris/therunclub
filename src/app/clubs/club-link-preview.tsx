"use client";

import { LinkPreview } from "@/components/common/link-preview/link-preview";
import { Suspense } from "react";
import type { OpenGraphData } from "@/lib/og";

interface ClubLinkPreviewProps {
	website: string;
	ogData: OpenGraphData | null;
}

function LinkPreviewErrorBoundary({ children }: { children: React.ReactNode }) {
	return <div className="w-full">{children}</div>;
}

export function ClubLinkPreview({ website, ogData }: ClubLinkPreviewProps) {
	if (!website || !ogData) return null;

	return (
		<Suspense
			fallback={<div className="animate-pulse">Loading website preview...</div>}
		>
			<LinkPreviewErrorBoundary>
				<LinkPreview url={website} ogData={ogData} className="mb-4" />
			</LinkPreviewErrorBoundary>
		</Suspense>
	);
}
