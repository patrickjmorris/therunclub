"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface RaceImageWithFallbackProps {
	src?: string | null;
	fallbackSrc: string;
	alt: string;
	width: number;
	height: number;
	className?: string;
}

export function RaceImageWithFallback({
	src,
	fallbackSrc,
	alt,
	width,
	height,
	className,
}: RaceImageWithFallbackProps) {
	const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

	// Update image source if the src prop changes
	useEffect(() => {
		setImgSrc(src || fallbackSrc);
	}, [src, fallbackSrc]);

	return (
		<Image
			src={imgSrc}
			alt={alt}
			width={width}
			height={height}
			className={className}
			onError={() => {
				// Only try fallback if the current source isn't already the fallback
				if (imgSrc !== fallbackSrc) {
					setImgSrc(fallbackSrc);
				}
			}}
		/>
	);
}
