import { Fragment } from "react";
import {
	linkifyPlainText,
	type PlainTextSegment,
} from "@/lib/linkify-plain-text";

interface PlainTextWithLinksProps {
	text: string;
}

function renderSegment(segment: PlainTextSegment, index: number) {
	switch (segment.type) {
		case "text":
			return <Fragment key={`text-${index}`}>{segment.value}</Fragment>;
		case "link":
			return (
				<a
					key={`${index}-${segment.href}`}
					href={segment.href}
					target="_blank"
					rel="noopener noreferrer"
				>
					{segment.value}
				</a>
			);
		default: {
			const unreachable: never = segment;
			throw new Error(`Unhandled segment ${String(unreachable)}`);
		}
	}
}

// Plain text only. Text nodes escape markup; http(s) matches become anchors.
export function PlainTextWithLinks({ text }: PlainTextWithLinksProps) {
	return linkifyPlainText(text).map((segment, index) =>
		renderSegment(segment, index),
	);
}
