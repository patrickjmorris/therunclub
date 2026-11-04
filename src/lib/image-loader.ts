import type { ImageLoaderProps } from "next/image";

// Resize through the image hosts that support it, and send our own Supabase
// images through Vercel's optimizer. Everything else passes through.

const YOUTUBE_THUMB =
	/^https:\/\/i\.ytimg\.com\/vi(_webp)?\/([^/]+)\/[a-z_]+\.(jpg|webp)$/;
const GGPHT_SIZE = /=s\d+/;
// Podcast art (225) and athlete photos (1.7k), not per-episode art (13k).
// Keep in step with images.remotePatterns in next.config.mjs: the optimizer
// rejects any other host or path, which bounds what can be billed to us.
const VERCEL_OPTIMIZED =
	/^https:\/\/akzhyzwiwjxtjuirmqyx\.supabase\.co\/storage\/v1\/object\/public\/(?:content-images\/podcasts|athlete-images)\/.+$/;

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
	const youtube = src.match(YOUTUBE_THUMB);
	if (youtube) {
		// mqdefault 320x180, hqdefault 480x360 always exist; larger sizes
		// are missing for some videos, so keep the stored URL above 828w.
		if (width <= 256)
			return `https://i.ytimg.com/vi/${youtube[2]}/mqdefault.jpg`;
		if (width <= 828)
			return `https://i.ytimg.com/vi/${youtube[2]}/hqdefault.jpg`;
		return src;
	}

	if (src.startsWith("https://yt3.ggpht.com/") && GGPHT_SIZE.test(src)) {
		return src.replace(GGPHT_SIZE, `=s${Math.min(width, 800)}`);
	}

	if (VERCEL_OPTIMIZED.test(src)) {
		return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${
			quality ?? 75
		}`;
	}

	return src;
}
