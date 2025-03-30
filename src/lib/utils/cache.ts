import { unstable_cache as next_unstable_cache } from "next/cache";
import { cache } from "react";

/**
 * Optimized caching utility that combines Next.js unstable_cache with React's cache
 * for both server-side caching and client-side deduplication.
 *
 * @param callback The function to cache
 * @param keyParts Array of strings used to create a cache key
 * @param options Cache options including revalidation time and tags
 * @returns Cached function with deduplication
 */
export const createCache = <Inputs extends unknown[], Output>(
	callback: (...args: Inputs) => Promise<Output>,
	keyParts: string[],
	options: {
		revalidate?: number;
		tags?: string[];
	} = { revalidate: 3600 }, // Default 1 hour cache
) => {
	// Wrap Next.js unstable_cache with React's cache for deduplication
	return cache(
		next_unstable_cache(callback, keyParts, {
			revalidate: options.revalidate,
			tags: options.tags,
		}),
	);
};

/**
 * Creates a cache with short-lived revalidation (5 minutes)
 */
export const createShortCache = <Inputs extends unknown[], Output>(
	callback: (...args: Inputs) => Promise<Output>,
	keyParts: string[],
	tags?: string[],
) => createCache(callback, keyParts, { revalidate: 300, tags });

/**
 * Creates a cache with standard revalidation (1 hour)
 */
export const createStandardCache = <Inputs extends unknown[], Output>(
	callback: (...args: Inputs) => Promise<Output>,
	keyParts: string[],
	tags?: string[],
) => createCache(callback, keyParts, { revalidate: 3600, tags });

/**
 * Creates a cache with long-lived revalidation (24 hours)
 */
export const createDailyCache = <Inputs extends unknown[], Output>(
	callback: (...args: Inputs) => Promise<Output>,
	keyParts: string[],
	tags?: string[],
) => createCache(callback, keyParts, { revalidate: 86400, tags });

/**
 * Creates a cache with very long-lived revalidation (1 week)
 */
export const createWeeklyCache = <Inputs extends unknown[], Output>(
	callback: (...args: Inputs) => Promise<Output>,
	keyParts: string[],
	tags?: string[],
) => createCache(callback, keyParts, { revalidate: 604800, tags });
