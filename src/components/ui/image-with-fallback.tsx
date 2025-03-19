import Image from "next/image";
import { cn } from "@/lib/utils";
import { Headphones, PlayCircle } from "lucide-react";

interface ImageWithFallbackProps {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	className?: string;
	type?: "video" | "podcast";
	priority?: boolean;
	sizes?: string;
	fill?: boolean;
}

export function ImageWithFallback({
	src,
	alt,
	width,
	height,
	className,
	type = "video",
	priority = false,
	sizes,
	fill = false,
}: ImageWithFallbackProps) {
	const FallbackIcon = type === "video" ? PlayCircle : Headphones;

	return (
		<div className={cn("relative", className)}>
			<Image
				src={src}
				alt={alt}
				width={width}
				height={height}
				className={cn("object-cover", className)}
				priority={priority}
				sizes={sizes}
				fill={fill}
				onError={(e) => {
					// Hide the image on error
					const target = e.target as HTMLImageElement;
					target.style.display = "none";
					// Show the fallback icon
					const fallback =
						target.parentElement?.querySelector(".fallback-icon");
					if (fallback) {
						fallback.classList.remove("hidden");
					}
				}}
			/>
			<div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-muted">
				<FallbackIcon className="h-8 w-8 text-muted-foreground" />
			</div>
		</div>
	);
}
