"use client";

import { useState } from "react";
import clsx from "clsx";

import { TinyWaveFormIcon } from "@/components/TinyWaveFormIcon";

export function AboutSection(
	props: React.ComponentPropsWithoutRef<"section"> & { description: string },
) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<section {...props}>
			<h2 className="flex items-center font-mono text-sm font-medium leading-7 text-slate-900">
				<TinyWaveFormIcon
					colors={["fill-violet-300", "fill-pink-300"]}
					className="h-2.5 w-2.5"
				/>
				<span className="ml-2.5">About</span>
			</h2>
			<div
				className={clsx(
					"mt-2 text-base leading-7 text-slate-700 whitespace-pre-wrap mb-4",
					!isExpanded && "line-clamp-4",
				)}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: We want to use the HTML content to apply styling
				dangerouslySetInnerHTML={{ __html: props.description }}
			/>
			{!isExpanded && (
				<button
					type="button"
					className="mt-2 inline-block text-sm font-bold leading-6 text-pink-500 hover:text-pink-700 active:text-pink-900"
					onClick={() => setIsExpanded(true)}
				>
					Show more
				</button>
			)}
		</section>
	);
}
