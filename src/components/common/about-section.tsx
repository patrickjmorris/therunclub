"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import DOMPurify from "isomorphic-dompurify";

interface AboutSectionProps {
	description: string;
}

export function AboutSection({ description }: AboutSectionProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const sanitizedHtml = DOMPurify.sanitize(description);

	return (
		<div className="space-y-4">
			<h2 className="text-sm font-medium text-muted-foreground uppercase">
				About
			</h2>
			<div
				className={`prose dark:prose-invert max-w-none ${
					!isExpanded ? "line-clamp-3" : ""
				}`}
			>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitizedHtml is sanitized */}
				<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
			</div>
			{description.length > 200 && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					{isExpanded ? "Show less" : "Show more"}
				</Button>
			)}
		</div>
	);
}
