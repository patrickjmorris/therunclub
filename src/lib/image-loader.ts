import type { ImageLoaderProps } from "next/image";

// Vercel's optimizer is off (unbounded hosts, per-image cost), so resize
// through the image hosts that support it and pass everything else through.

const YOUTUBE_THUMB =
	/^https:\/\/i\.ytimg\.com\/vi(_webp)?\/([^/]+)\/[a-z_]+\.(jpg|webp)$/;
const GGPHT_SIZE = /=s\d+/;
// Supabase bills transforms per origin image: podcast art (225) and
// athlete photos (1.7k) yes; per-episode art (45k) no. Widths cap at the
// stored size: podcast art 1400px, athlete photos 800px.
const SUPABASE_TRANSFORMABLE =
	/^(https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1)\/object\/public\/((?:content-images\/podcasts|athlete-images)\/.+)$/;

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

	const supabase = src.match(SUPABASE_TRANSFORMABLE);
	if (supabase) {
		return `${supabase[1]}/render/image/public/${
			supabase[2]
		}?width=${Math.min(
			width,
			supabase[2].startsWith("athlete-images/") ? 800 : 1400,
		)}&quality=${quality ?? 75}`;
	}

	return src;
}
