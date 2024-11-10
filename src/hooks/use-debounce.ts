import { useCallback, useRef } from "react";

type AnyFunction = (...args: unknown[]) => unknown;

export function useDebounce<T extends AnyFunction>(callback: T, delay: number) {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	return useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => callback(...args), delay);
		},
		[callback, delay],
	);
}